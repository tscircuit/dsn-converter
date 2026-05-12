export function getComponentValue(sourceComponent: any): string {
  if (!sourceComponent) return ""
  if ("resistance" in sourceComponent) {
    if (
      typeof sourceComponent.display_resistance === "string" &&
      sourceComponent.display_resistance.trim() !== ""
    ) {
      return sourceComponent.display_resistance
    }
    return sourceComponent.resistance >= 1000
      ? `${sourceComponent.resistance / 1000}k`
      : `${sourceComponent.resistance}`
  }
  if ("capacitance" in sourceComponent) {
    if (
      typeof sourceComponent.display_capacitance === "string" &&
      sourceComponent.display_capacitance.trim() !== ""
    ) {
      return sourceComponent.display_capacitance
    }
    const capacitanceUF = sourceComponent.capacitance * 1e6
    if (capacitanceUF >= 1) {
      return `${capacitanceUF}uF`
    } else {
      return `${(capacitanceUF).toFixed(3)}uF`
    }
  }
  return ""
}
