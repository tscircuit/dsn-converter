interface PadstackNameArgs {
  shape: "circle" | "oval" | "pill" | "rect"
  width?: number
  height?: number
  holeDiameter?: number
  outerDiameter?: number
}

export function getPadstackName({
  shape,
  width,
  height,
  holeDiameter,
  outerDiameter,
}: PadstackNameArgs): string {
  switch (shape) {
    case "circle":
      return `Round[A]Pad_${holeDiameter}_${outerDiameter}_um`
    case "oval":
      return `Oval[A]Pad_${width}x${height}_um`
    case "pill":
      return `Oval[A]Pad_${width}x${height}_um`
    case "rect":
      return `RoundRect[T]Pad_${width}x${height}_um`
    default:
      return "default_pad"
  }
}
