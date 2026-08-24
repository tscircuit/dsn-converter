import { applyToPoint, fromTriangles, scale } from "transformation-matrix"

import { su } from "@tscircuit/soup-util"
import type {
  AnyCircuitElement,
  LayerRef,
  PcbBoard,
  PcbCopperPour,
} from "circuit-json"
import { pairs } from "lib/utils/pairs"
import type { DsnPcb } from "../types"
import { convertDsnPcbComponentsToSourceComponentsAndPorts } from "./dsn-component-converters/convert-dsn-pcb-components-to-source-components-and-ports"
import { convertNetsToSourceNetsAndTraces } from "./dsn-component-converters/convert-nets-to-source-nets-and-traces"
import { convertPadstacksToSmtPads } from "./dsn-component-converters/convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./dsn-component-converters/convert-wires-to-traces"

function getLayerRefFromDsnLayer(dsnPcb: DsnPcb, dsnLayer: string): LayerRef {
  if (dsnLayer === "Top" || dsnLayer === "F.Cu" || dsnLayer === "F_Cu") {
    return "top"
  }
  if (dsnLayer === "Bottom" || dsnLayer === "B.Cu" || dsnLayer === "B_Cu") {
    return "bottom"
  }

  const layersByIndex = [...dsnPcb.structure.layers].sort(
    (a, b) => a.property.index - b.property.index,
  )
  const layerIndex = layersByIndex.findIndex((layer) => layer.name === dsnLayer)

  if (layerIndex <= 0) return "top"
  if (layerIndex === layersByIndex.length - 1) return "bottom"

  return `inner${layerIndex}` as LayerRef
}

function convertPlanesToCopperPours(
  dsnPcb: DsnPcb,
  transformDsnUnitToMm: any,
): PcbCopperPour[] {
  return (dsnPcb.structure.planes ?? []).map((plane, planeIndex) => {
    const points = pairs(plane.polygon.coordinates).map(([x, y]) =>
      applyToPoint(transformDsnUnitToMm, { x, y }),
    )
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const normalizedPoints =
      firstPoint &&
      lastPoint &&
      firstPoint.x === lastPoint.x &&
      firstPoint.y === lastPoint.y
        ? points.slice(0, -1)
        : points

    return {
      type: "pcb_copper_pour",
      pcb_copper_pour_id: `pcb_copper_pour_plane_${plane.net}_${planeIndex}`,
      source_net_id: `source_net_${plane.net}`,
      layer: getLayerRefFromDsnLayer(dsnPcb, plane.polygon.layer),
      shape: "polygon",
      points: normalizedPoints,
      covered_with_solder_mask: true,
    }
  })
}

export function convertDsnPcbToCircuitJson(
  dsnPcb: DsnPcb,
  fromSessionSpace = false,
): AnyCircuitElement[] {
  const elements: AnyCircuitElement[] = []

  // TODO use pcb.resolution.unit and pcb.resolution.value
  const transformDsnUnitToMm = scale(1 / 1000)

  // Add the board
  // You must use the dsnPcb.boundary to get the center, width and height
  const board: PcbBoard = {
    type: "pcb_board",
    pcb_board_id: "pcb_board_0",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    thickness: 1.4,
    material: "fr4",
    num_layers: 4,
  }
  if (dsnPcb.structure.boundary.path) {
    const boundaryPath = pairs(dsnPcb.structure.boundary.path.coordinates)
    const maxX = Math.max(...boundaryPath.map(([x]) => x))
    const minX = Math.min(...boundaryPath.map(([x]) => x))
    const maxY = Math.max(...boundaryPath.map(([, y]) => y))
    const minY = Math.min(...boundaryPath.map(([, y]) => y))
    board.center = applyToPoint(transformDsnUnitToMm, {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
    })
    board.width = (maxX - minX) * transformDsnUnitToMm.a
    board.height = (maxY - minY) * transformDsnUnitToMm.a
  } else {
    throw new Error(
      `Couldn't read DSN boundary, add support for dsnPcb.structure.boundary["${Object.keys(dsnPcb.structure.boundary).join(",")}"]`,
    )
  }

  elements.push(board)
  elements.push(...convertPlanesToCopperPours(dsnPcb, transformDsnUnitToMm))

  // Convert padstacks to SMT pads using the transformation matrix
  elements.push(...convertPadstacksToSmtPads(dsnPcb, transformDsnUnitToMm))

  // Convert wires to PCB traces using the transformation matrix
  if (dsnPcb.wiring && dsnPcb.network) {
    elements.push(
      ...convertWiresToPcbTraces(
        dsnPcb.wiring,
        dsnPcb.network,
        transformDsnUnitToMm,
        fromSessionSpace,
      ),
    )
  }

  elements.push(
    ...convertDsnPcbComponentsToSourceComponentsAndPorts({
      dsnPcb,
      transformDsnUnitToMm,
    }),
  )
  elements.push(
    ...convertNetsToSourceNetsAndTraces({
      dsnPcb,
      source_ports: su(elements as any).source_port.list(),
    }),
  )

  return elements
}
