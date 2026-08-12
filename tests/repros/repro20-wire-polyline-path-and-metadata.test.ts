import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * stringifyDsnJson's wiring section assumed every wire has a `.path`, wrote
 * `clearance_class` and `type` unconditionally as literal text (producing the
 * string "undefined" when either was actually absent), and had no handling
 * at all for `.polyline_path` (a distinct DSN node used by e.g. freerouting's
 * own output, see tests/assets/testkicadproject/freeroutingTraceAdded.dsn).
 * Any of these crashed or silently corrupted the round trip.
 *
 * Uses a real, otherwise-valid fixture with a hand-built wire injected, to
 * isolate this case rather than depend on another fixture/fix.
 */
test("wires with polyline_path, clearance_class, and no explicit type round trip cleanly", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb

  const wireUnderTest = {
    polyline_path: {
      layer: "F.Cu",
      width: 200,
      coordinates: [0, 0, 1000, 1000, 2000, 500],
    },
    net: "GND",
    clearance_class: "kicad_default",
    // no `type` — some real-world wires omit it
  }
  const withWire: DsnPcb = {
    ...dsnJson,
    wiring: { wires: [...dsnJson.wiring.wires, wireUnderTest as any] },
  }

  expect(() => stringifyDsnJson(withWire)).not.toThrow()

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(withWire)) as DsnPcb
  expect(reparsed.wiring.wires.at(-1)).toEqual(wireUnderTest as any)
})
