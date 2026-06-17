import { expect, test } from "bun:test"
import { pcb_keepout } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothie board converts image-level keepouts to pcb_keepout", () => {
  const circuitJson = convertDsnPcbToCircuitJson(
    parseDsnToDsnJson(smoothieDsn) as DsnPcb,
  ) as Array<Record<string, any>>

  const keepouts = circuitJson.filter((e) => e.type === "pcb_keepout")
  expect(keepouts.length).toBeGreaterThan(0) // the main branch dropped keepouts entirely (emitted 0)

  for (const k of keepouts) {
    expect(k.shape).toBe("circle")
    expect(Number.isFinite(k.center.x)).toBe(true)
    expect(Number.isFinite(k.center.y)).toBe(true)
    expect(k.radius).toBeGreaterThan(0)
    expect(Array.isArray(k.layers) && k.layers.length > 0).toBe(true)
    // schema validity: throws if the emitted element is malformed
    expect(() => pcb_keepout.parse(k)).not.toThrow()
  }
})
