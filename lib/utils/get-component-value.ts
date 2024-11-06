export function getComponentValue(sourceComponent: any): string {
  if (!sourceComponent) return ""
  if ("resistance" in sourceComponent) {
    return sourceComponent.resistance >= 1000
      ? `${sourceComponent.resistance / 1000}k`
      : `${sourceComponent.resistance}`
  }
  if ("capacitance" in sourceComponent) {
    const capacitanceUF = sourceComponent.capacitance * 1e6
    if (capacitanceUF >= 1) {
      return `${capacitanceUF}uF`
    } else {
      return `${(capacitanceUF).toFixed(3)}uF`
    }
  }
  return ""
}
