import type { PcbSmtPad } from "circuit-json"

type Point = { x: number; y: number }

export interface SmtPadGeometry {
  anchor: Point
  padstackShape: "circle" | "rect" | "polygon"
  layer: PcbSmtPad["layer"]
  outerDiameter?: number
  holeDiameter?: number
  width?: number
  height?: number
  coordinates?: number[]
}

export function getSmtPadGeometry(pad: PcbSmtPad): SmtPadGeometry {
  if (pad.shape === "circle") {
    return {
      anchor: { x: pad.x, y: pad.y },
      padstackShape: "circle",
      outerDiameter: pad.radius * 1000 * 2,
      holeDiameter: pad.radius * 1000 * 2,
      layer: pad.layer,
    }
  }

  if (pad.shape === "polygon") {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const point of pad.points) {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    }

    const anchor = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    }

    const coordinates = pad.points.flatMap((point) => [
      (point.x - anchor.x) * 1000,
      (point.y - anchor.y) * 1000,
    ])

    const firstPoint = pad.points[0]
    if (firstPoint) {
      coordinates.push(
        (firstPoint.x - anchor.x) * 1000,
        (firstPoint.y - anchor.y) * 1000,
      )
    }

    return {
      anchor,
      padstackShape: "polygon",
      layer: pad.layer,
      width: (maxX - minX) * 1000,
      height: (maxY - minY) * 1000,
      coordinates,
    }
  }

  return {
    anchor: { x: pad.x, y: pad.y },
    padstackShape: "rect",
    width: pad.width * 1000,
    height: pad.height * 1000,
    layer: pad.layer,
  }
}
