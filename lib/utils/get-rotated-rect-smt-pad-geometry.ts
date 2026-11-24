import type { PcbSmtPad } from "circuit-json"

type RotatedRectPcbSmtPad = Extract<PcbSmtPad, { shape: "rotated_rect" }>

export type RotatedRectSmtPadGeometry =
  | {
      kind: "axis_aligned_rect"
      widthUm: number
      heightUm: number
    }
  | {
      kind: "rotated_polygon"
      widthUm: number
      heightUm: number
      relativePointsUm: number[]
      customDescriptor: string
    }

function roundMicrons(microns: number): number {
  return Number(microns.toFixed(3))
}

export function parseRotatedRectDescriptor(descriptor: string): {
  widthMm: number
  heightMm: number
  ccwRotation: number
} | null {
  const match = descriptor.match(
    /^rotated_rect_([0-9]+(?:\.[0-9]+)?)x([0-9]+(?:\.[0-9]+)?)_([0-9]+(?:\.[0-9]+)?)deg$/,
  )
  if (!match) return null
  return {
    widthMm: Number(match[1]) / 1000,
    heightMm: Number(match[2]) / 1000,
    ccwRotation: Number(match[3]),
  }
}

export function getRotatedRectSmtPadGeometry(
  pad: RotatedRectPcbSmtPad,
): RotatedRectSmtPadGeometry {
  const normalizedRotation = Number(
    ((((pad.ccw_rotation ?? 0) % 360) + 360) % 360).toFixed(4),
  )
  const mod180 = normalizedRotation % 180

  if (Math.abs(mod180) < 1e-6 || Math.abs(mod180 - 180) < 1e-6) {
    return {
      kind: "axis_aligned_rect",
      widthUm: pad.width * 1000,
      heightUm: pad.height * 1000,
    }
  }

  if (Math.abs(mod180 - 90) < 1e-6) {
    return {
      kind: "axis_aligned_rect",
      widthUm: pad.height * 1000,
      heightUm: pad.width * 1000,
    }
  }

  const widthUm = roundMicrons(pad.width * 1000)
  const heightUm = roundMicrons(pad.height * 1000)
  const halfWidthUm = (pad.width * 1000) / 2
  const halfHeightUm = (pad.height * 1000) / 2
  const radians = (normalizedRotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const localCorners = [
    { x: -halfWidthUm, y: halfHeightUm },
    { x: halfWidthUm, y: halfHeightUm },
    { x: halfWidthUm, y: -halfHeightUm },
    { x: -halfWidthUm, y: -halfHeightUm },
  ]

  const rotatedCorners = localCorners.map((corner) => ({
    x: roundMicrons(corner.x * cos - corner.y * sin),
    y: roundMicrons(corner.x * sin + corner.y * cos),
  }))

  const xs = rotatedCorners.map((corner) => corner.x)
  const ys = rotatedCorners.map((corner) => corner.y)
  const boundingWidthUm = roundMicrons(Math.max(...xs) - Math.min(...xs))
  const boundingHeightUm = roundMicrons(Math.max(...ys) - Math.min(...ys))

  const relativePointsUm = rotatedCorners.flatMap((corner) => [
    corner.x,
    corner.y,
  ])
  relativePointsUm.push(rotatedCorners[0].x, rotatedCorners[0].y)

  return {
    kind: "rotated_polygon",
    widthUm: boundingWidthUm,
    heightUm: boundingHeightUm,
    relativePointsUm,
    customDescriptor: `rotated_rect_${widthUm}x${heightUm}_${normalizedRotation}deg`,
  }
}
