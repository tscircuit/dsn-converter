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
    } else if (sourceComponent.capacitance * 1e9 >= 1) {
      return `${formatDecimal(sourceComponent.capacitance * 1e9)}nF`
    } else {
      return `${(capacitanceUF).toFixed(3)}uF`
    }
  }
  return ""
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(3)).toString()
}
