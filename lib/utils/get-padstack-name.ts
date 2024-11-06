export function getPadstackName(componentType: string | undefined): string {
  switch (componentType) {
    case "simple_resistor":
      return "RoundRect[T]Pad_540x640_135.514_um_0.000000_0"
    case "simple_capacitor":
      return "RoundRect[T]Pad_900x950_225.856_um_0.000000_0"
    default:
      return "default_pad"
  }
}
