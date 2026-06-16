import type { Pin } from "lib/dsn-pcb/types"

function parseDsnPinNumber(pinNumber: Pin["pin_number"]): number | undefined {
  const normalized =
    typeof pinNumber === "string"
      ? pinNumber.trim().replace(/^pin/i, "")
      : pinNumber
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function createDsnPinNumberResolver(pins: Pin[]) {
  const pinNumbers = new Map<Pin, number>()
  let maxPinNumber = 0

  for (const pin of pins) {
    const pinNumber = parseDsnPinNumber(pin.pin_number)
    if (pinNumber === undefined) continue
    pinNumbers.set(pin, pinNumber)
    maxPinNumber = Math.max(maxPinNumber, pinNumber)
  }

  let nextPinNumber = Math.floor(maxPinNumber) + 1
  for (const pin of pins) {
    if (pinNumbers.has(pin)) continue
    pinNumbers.set(pin, nextPinNumber)
    nextPinNumber++
  }

  return (pin: Pin) => pinNumbers.get(pin) ?? nextPinNumber++
}
