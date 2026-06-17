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
  const supplierPartNumber = getFirstSupplierPartNumber(sourceComponent)
  if (supplierPartNumber !== undefined) return supplierPartNumber
  return ""
}

function getFirstSupplierPartNumber(sourceComponent: any): string | undefined {
  const supplierPartNumbers = sourceComponent.supplier_part_numbers
  if (!supplierPartNumbers) return undefined

  for (const partNumbers of Object.values(supplierPartNumbers)) {
    if (Array.isArray(partNumbers) && partNumbers.length > 0) {
      return String(partNumbers[0])
    }
  }

  return undefined
}
