export function getComponentValue(sourceComponent: any): string {
  if (!sourceComponent) return ""
  if (
    "resistance" in sourceComponent &&
    typeof sourceComponent.resistance === "number"
  ) {
    return sourceComponent.resistance >= 1000
      ? `${sourceComponent.resistance / 1000}k`
      : `${sourceComponent.resistance}`
  }
  if (
    "capacitance" in sourceComponent &&
    typeof sourceComponent.capacitance === "number"
  ) {
    const capacitanceUF = sourceComponent.capacitance * 1e6
    if (capacitanceUF >= 1) {
      return `${capacitanceUF}uF`
    }
    if (capacitanceUF >= 0.001) {
      return `${capacitanceUF.toFixed(3)}uF`
    }
    const capacitancePF = Number(
      (sourceComponent.capacitance * 1e12).toFixed(3),
    )
    return `${capacitancePF}pF`
  }
  if (
    "inductance" in sourceComponent &&
    typeof sourceComponent.inductance === "number"
  ) {
    if (sourceComponent.inductance >= 1) {
      return `${sourceComponent.inductance}H`
    }
    if (sourceComponent.inductance >= 1e-3) {
      return `${Number((sourceComponent.inductance * 1e3).toFixed(3))}mH`
    }
    if (sourceComponent.inductance >= 1e-6) {
      return `${Number((sourceComponent.inductance * 1e6).toFixed(3))}uH`
    }
    return `${Number((sourceComponent.inductance * 1e9).toFixed(3))}nH`
  }
  return ""
}
