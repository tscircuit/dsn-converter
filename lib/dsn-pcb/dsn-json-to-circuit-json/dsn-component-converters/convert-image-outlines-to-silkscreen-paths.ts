import type { PcbSilkscreenPath } from "circuit-json"
import { pairs } from "lib/utils/pairs"
import { type Matrix, applyToPoint } from "transformation-matrix"
import type { DsnPcb } from "../../types"

const rotateDsnPoint = (
  point: { x: number; y: number },
  degrees: number,
): { x: number; y: number } => {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  }
}

export function convertImageOutlinesToSilkscreenPaths(
  pcb: DsnPcb,
  transform: Matrix,
): PcbSilkscreenPath[] {
  const elements: PcbSilkscreenPath[] = []
  const imageMap = new Map(
    pcb.library.images.map((image) => [image.name, image]),
  )

  pcb.placement.components.forEach((component) => {
    const image = imageMap.get(component.name)
    if (!image?.outlines?.length) return

    component.places.forEach((place) => {
      image.outlines.forEach((outline, outlineIndex) => {
        if (!outline.path?.coordinates?.length) return

        const route = pairs(outline.path.coordinates)
          .map(([x, y]) => {
            const rotatedPoint = rotateDsnPoint({ x, y }, place.rotation ?? 0)
            const circuitPoint = applyToPoint(transform, {
              x: (place.x ?? 0) + rotatedPoint.x,
              y: (place.y ?? 0) + rotatedPoint.y,
            })

            return {
              x: Number(circuitPoint.x.toFixed(4)),
              y: Number(circuitPoint.y.toFixed(4)),
            }
          })
          .filter(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))

        if (route.length < 2) return

        elements.push({
          type: "pcb_silkscreen_path",
          pcb_silkscreen_path_id: `pcb_silkscreen_path_${component.name}_${place.refdes}_${outlineIndex}`,
          pcb_component_id: `${component.name}_${place.refdes}`,
          layer: place.side === "back" ? "bottom" : "top",
          route,
          stroke_width: outline.path.width / 1000,
        })
      })
    })
  })

  return elements
}
