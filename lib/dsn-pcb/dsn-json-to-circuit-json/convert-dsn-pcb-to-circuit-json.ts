import { fromTriangles, scale, applyToPoint } from "transformation-matrix"

import type { AnyCircuitElement, PcbBoard } from "circuit-json"
import type { DsnPcb } from "../types"
import { convertPadstacksToSmtPads } from "./dsn-component-converters/convert-padstacks-to-smtpads"
import { convertWiresToPcbTraces } from "./dsn-component-converters/convert-wires-to-traces"
import { pairs } from "lib/utils/pairs"
import { convertNetsToSourceNetsAndTraces } from "./dsn-component-converters/convert-nets-to-source-nets-and-traces"
import { convertDsnPcbComponentsToSourceComponentsAndPorts } from "./dsn-component-converters/convert-dsn-pcb-components-to-source-components-and-ports"
import { su } from "@tscircuit/soup-util"

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
    num_layers: 4,
    material: "fr4",
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
