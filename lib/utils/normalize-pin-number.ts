export const getNumericPinNumber = (
  pinNumber: string | number,
): number | undefined => {
  if (typeof pinNumber === "number") {
    return Number.isNaN(pinNumber) ? undefined : pinNumber
  }

  const parsed = Number.parseInt(pinNumber, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

export const getPinIdSuffix = (pinNumber: string | number): string => {
  const numericPinNumber = getNumericPinNumber(pinNumber)
  return numericPinNumber === undefined
    ? String(pinNumber)
    : String(numericPinNumber - 1)
}
