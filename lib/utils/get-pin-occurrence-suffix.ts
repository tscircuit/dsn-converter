/**
 * Footprints may legitimately reuse a pin number (e.g. a SOT-89 tab that is
 * also pin 2). Element ids built from the pin number alone then collide.
 * For the Nth pin (N > 1) sharing a pin number within the same image, this
 * returns a deterministic suffix ("_1", "_2", ...) so ids stay unique; the
 * first occurrence keeps the historic id format.
 */
export function getPinOccurrenceSuffix(
  pins: Array<{ pin_number: number | string }>,
  pinIndex: number,
): string {
  const target = pins[pinIndex]?.pin_number
  let occurrence = 0
  for (let i = 0; i < pinIndex; i++) {
    if (pins[i].pin_number === target) occurrence++
  }
  return occurrence > 0 ? `_${occurrence}` : ""
}
