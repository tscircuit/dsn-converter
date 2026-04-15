import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
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
    const sample = hits
      .slice(0, 5)
      .map((h) => h.path)
      .join("\n  ")
    throw new Error(
      `Found ${hits.length} NaN value(s) in converted circuit JSON. First 5:\n  ${sample}`,
    )
  }
  expect(hits.length).toBe(0)
})

test("repro16 smoothie-board: PCB SVG snapshot (no visual regression from fix)", () => {
  // The fix touches data fields (pin_number, pcb_smtpad_id) that are not
  // rendered to the PCB SVG, so this snapshot also serves as a guard
  // that the fix does not introduce any unintended geometric regression.
  const dsnJson = parseDsnToDsnJson(smoothieBoardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("repro16 smoothie-board: source_port.pin_number samples are real values, not NaN", () => {
  const dsnJson = parseDsnToDsnJson(smoothieBoardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const firstTenSourcePorts = circuitJson
    .filter(
      (
        el,
      ): el is Extract<(typeof circuitJson)[number], { type: "source_port" }> =>
        el.type === "source_port",
    )
    .slice(0, 10)
    .map((p) => ({
      name: p.name,
      pin_number: p.pin_number,
      pin_number_is_nan:
        typeof p.pin_number === "number" && Number.isNaN(p.pin_number),
    }))

  // Every pin_number must be either a real number or a non-empty string.
  for (const p of firstTenSourcePorts) {
    expect(p.pin_number_is_nan).toBe(false)
    expect(p.pin_number).toBeDefined()
  }

  // Inline textual snapshot so the review diff shows "NaN → real values"
  // directly when someone regenerates the snapshot against `main`.
  expect(firstTenSourcePorts).toMatchSnapshot()
})
