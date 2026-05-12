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
  if ("inductance" in sourceComponent) {
    return formatInductance(sourceComponent.inductance)
  }
  return ""
}

function formatInductance(inductanceH: number): string {
  if (inductanceH >= 1) return `${formatCompactNumber(inductanceH)}H`
  if (inductanceH >= 1e-3) {
    return `${formatCompactNumber(inductanceH * 1e3)}mH`
  }
  if (inductanceH >= 1e-6) {
    return `${formatCompactNumber(inductanceH * 1e6)}uH`
  }
  return `${formatCompactNumber(inductanceH * 1e9)}nH`
}

function formatCompactNumber(value: number): string {
  return Number(value.toPrecision(12)).toString()
}
