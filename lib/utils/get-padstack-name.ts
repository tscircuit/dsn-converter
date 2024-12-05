interface PadstackNameArgs {  
  shape: string
  width?: number
  height?: number
  diameter?: number
}

export function getPadstackName({ shape, width, height, diameter }: PadstackNameArgs): string {
  switch (shape) {
    case "circle":
      return `Round[A]Pad_${diameter}_um`
    case "oval":
      return `Oval[A]Pad_${width}x${height}_um`
    case "pill":
      return `Oval[A]Pad_${width}x${height}_um`
    default:
      return "default_pad"
  }
}
