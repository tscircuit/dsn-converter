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
  if (
    (sourceComponent.ftype === "simple_crystal" ||
      sourceComponent.ftype === "simple_resonator") &&
    Number.isFinite(sourceComponent.frequency)
  ) {
    return formatFrequency(sourceComponent.frequency)
  }
  return ""
}

function formatFrequency(frequencyHz: number): string {
  if (frequencyHz >= 1e9) {
    return `${formatNumber(frequencyHz / 1e9)}GHz`
  }
  if (frequencyHz >= 1e6) {
    return `${formatNumber(frequencyHz / 1e6)}MHz`
  }
  if (frequencyHz >= 1e3) {
    return `${formatNumber(frequencyHz / 1e3)}kHz`
  }
  return `${formatNumber(frequencyHz)}Hz`
}

function formatNumber(value: number): string {
  return Number(value.toFixed(6)).toString()
}
