import type { PcbSilkscreenPath } from "circuit-json"
import type { ComponentPlacement, DsnPcb, Path } from "lib/dsn-pcb/types"
import { pairs } from "lib/utils/pairs"
import { type Matrix, applyToPoint } from "transformation-matrix"

type DsnComponentPlace = ComponentPlacement["places"][number]

export function convertImageOutlinesToSilkscreenPaths({
  dsnPcb,
  transformDsnUnitToMm,
}: {
  dsnPcb: DsnPcb
  transformDsnUnitToMm: Matrix
}): PcbSilkscreenPath[] {
  const elements: PcbSilkscreenPath[] = []
  const imageMap = new Map(dsnPcb.library.images.map((img) => [img.name, img]))

  for (const component of dsnPcb.placement.components) {
    const image = imageMap.get(component.name)
    if (!image?.outlines?.length) continue

    for (const place of component.places) {
      image.outlines.forEach((outline, outlineIndex) => {
        const route = convertOutlinePathToRoute({
          path: outline.path,
          place,
          transformDsnUnitToMm,
        })

        if (route.length < 2) return

        elements.push({
          type: "pcb_silkscreen_path",
          pcb_silkscreen_path_id: `pcb_silkscreen_path_${component.name}_${place.refdes}_${outlineIndex}`,
          pcb_component_id: `${component.name}_${place.refdes}`,
          layer: getSilkscreenLayer(outline.path.layer, place),
          route,
          stroke_width: Math.abs(outline.path.width * transformDsnUnitToMm.a),
        })
      })
    }
  }

  return elements
}

function convertOutlinePathToRoute({
  path,
  place,
  transformDsnUnitToMm,
}: {
  path: Path
  place: DsnComponentPlace
  transformDsnUnitToMm: Matrix
}) {
  return pairs(path.coordinates).map(([x, y]) =>
    applyToPoint(transformDsnUnitToMm, getPlacedPoint(place, { x, y })),
  )
}

function getPlacedPoint(
  place: DsnComponentPlace,
  point: { x: number; y: number },
) {
  const rotationRadians = ((place.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(rotationRadians)
  const sin = Math.sin(rotationRadians)
  const x = place.side === "back" ? -point.x : point.x
  const y = point.y

  return {
    x: (place.x || 0) + x * cos - y * sin,
    y: (place.y || 0) + x * sin + y * cos,
  }
}

function getSilkscreenLayer(
  outlineLayer: string,
  place: DsnComponentPlace,
): PcbSilkscreenPath["layer"] {
  const normalizedLayer = outlineLayer.toLowerCase()

  if (normalizedLayer.includes("bottom") || normalizedLayer.includes("b.")) {
    return "bottom"
  }
  if (normalizedLayer.includes("top") || normalizedLayer.includes("f.")) {
    return "top"
  }

  return place.side === "back" ? "bottom" : "top"
}
