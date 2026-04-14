import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieBoardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const findNaN = (
  value: unknown,
  path: string,
  hits: Array<{ path: string; value: unknown }>,
): void => {
  if (typeof value === "number" && Number.isNaN(value)) {
    hits.push({ path, value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => findNaN(v, `${path}[${i}]`, hits))
    return
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      findNaN(v, path ? `${path}.${k}` : k, hits)
    }
  }
}

test("repro16 smoothie-board: no NaN in any numeric field after DSN→CircuitJson", () => {
  const dsnJson = parseDsnToDsnJson(smoothieBoardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const hits: Array<{ path: string; value: unknown }> = []
  findNaN(circuitJson, "", hits)

  if (hits.length > 0) {
    const sample = hits.slice(0, 5).map((h) => h.path).join("\n  ")
    throw new Error(
      `Found ${hits.length} NaN value(s) in converted circuit JSON. First 5:\n  ${sample}`,
    )
  }
  expect(hits.length).toBe(0)
})
