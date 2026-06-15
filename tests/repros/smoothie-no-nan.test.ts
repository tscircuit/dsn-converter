import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression guard for the Smoothie Board conversion (#54).
 *
 * The DSN component pins on this board carry non-numeric pad names, and the
 * converter coerced them with `Number(pin.pin_number)`, yielding `NaN` on every
 * such source_port.pin_number (456 non-finite values). NaN pin numbers break
 * downstream consumers and serialization.
 *
 * This test asserts the conversion output contains no non-finite numbers and
 * drops no ports.
 */
function findNonFinite(value: unknown, path: string, out: string[]): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) out.push(`${path} = ${value}`)
    return
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      findNonFinite(v, `${path}.${k}`, out)
    }
  }
}

test("smoothie board conversion has no NaN/Infinity values", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const ports = (circuitJson as Array<{ type: string }>).filter(
    (e) => e.type === "source_port",
  )
  // The conversion must not silently drop ports to "fix" the NaNs.
  expect(ports.length).toBeGreaterThanOrEqual(1055)

  const bad: string[] = []
  ;(circuitJson as Array<{ type: string }>).forEach((e, i) =>
    findNonFinite(e, `${e.type}[${i}]`, bad),
  )

  expect(bad.slice(0, 10)).toEqual([])
  expect(bad.length).toBe(0)
})
