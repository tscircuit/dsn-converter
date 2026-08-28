import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

/**
 * Regression guard for #54: pads of back-placed components must land on the
 * bottom copper layer.
 *
 * The Smoothie Board places the SJ1/SJ2/SJ3 solder jumpers on the DSN `back`
 * side, but getSmtPadLayer previously derived the layer only from the padstack
 * shape name ("Top") and ignored the component's placement side, so every
 * back-side pad was emitted on layer "top".
 */
test("back-placed component pads are emitted on the bottom layer", () => {
  const circuitJson = convertDsnPcbToCircuitJson(
    parseDsnToDsnJson(smoothieDsn) as DsnPcb,
  ) as Array<Record<string, any>>

  const smtpads = circuitJson.filter((e) => e.type === "pcb_smtpad")
  // SJ1/SJ2/SJ3 are placed on the DSN `back` side in this fixture; the smtpad id
  // encodes the refdes as `pcb_smtpad_<image>_<refdes>_<pin>`.
  const backPads = smtpads.filter((p) =>
    /_(SJ1|SJ2|SJ3)_/.test(String(p.pcb_smtpad_id)),
  )

  expect(backPads.length).toBeGreaterThan(0)
  expect(backPads.every((p) => p.layer === "bottom")).toBe(true)
  // Sanity: front-placed pads still land on top, so this is not trivially passing.
  expect(smtpads.some((p) => p.layer === "top")).toBe(true)
})
