import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { convertDsnPcbToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-pcb-to-circuit-json"
import { expect, test, describe } from "bun:test"
import { parseDsnToDsnJson, type DsnPcb } from "lib"
import * as fs from "fs"

const dsnContent = fs.readFileSync(
  "tests/assets/repro/smoothieboard-repro.dsn",
  "utf-8",
)

describe("Smoothie Board DSN conversion", () => {
  test("parses DSN without errors", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
    expect(dsnJson.library.images.length).toBe(54)
    expect(dsnJson.library.padstacks.length).toBe(58)
    expect(dsnJson.placement.components.length).toBe(54)
    expect(dsnJson.network.nets.length).toBe(245)
    expect(dsnJson.wiring.wires.length).toBe(42)
  })

  test("handles pin (rotate N) syntax correctly", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb

    // No pins should have "rotate" as their pin_number
    for (const image of dsnJson.library.images) {
      for (const pin of image.pins) {
        expect(String(pin.pin_number)).not.toBe("rotate")
      }
    }

    // EIA3216 should have pins A and C (not "rotate")
    const eia = dsnJson.library.images.find((i) =>
      i.name.includes("EIA3216"),
    )!
    expect(eia.pins[0].pin_number).toBe("A")
    expect(eia.pins[1].pin_number).toBe("C")
    expect(eia.pins[0].rotation).toBe(90)

    // TACTILE_SWITCH should have pins 4,3,2,1 (not "rotate")
    const tac = dsnJson.library.images.find((i) =>
      i.name.includes("TACTILE"),
    )!
    expect(tac.pins.map((p) => p.pin_number)).toEqual([4, 3, 2, 1])
    expect(tac.pins[0].x).toBe(2540)
    expect(tac.pins[0].y).toBe(-1905)
  })

  test("handles +/- pin names (standalone minus not treated as number)", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb

    // PANASONIC_D should have pins "-" and "+"
    const panD = dsnJson.library.images.find(
      (i) => i.name === "smoothieboard-5driver:PANASONIC_D",
    )!
    expect(panD.pins[0].pin_number).toBe("-")
    expect(panD.pins[1].pin_number).toBe("+")

    // PANASONIC_E should have pins "+" and "-"
    const panE = dsnJson.library.images.find(
      (i) => i.name === "smoothieboard-5driver:PANASONIC_E",
    )!
    expect(panE.pins[0].pin_number).toBe("+")
    expect(panE.pins[1].pin_number).toBe("-")
  })

  test("converts to circuit JSON with no NaN values", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
    const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

    // Check no NaN in any numeric field
    let nanCount = 0
    for (const el of circuitJson) {
      const checkNaN = (obj: any) => {
        for (const key in obj) {
          const val = obj[key]
          if (typeof val === "number" && isNaN(val)) {
            nanCount++
          } else if (typeof val === "object" && val !== null) {
            checkNaN(val)
          }
        }
      }
      checkNaN(el)
    }
    expect(nanCount).toBe(0)
  })

  test("generates unique IDs for all elements", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
    const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

    // Collect all primary IDs (e.g., pcb_smtpad_id, pcb_via_id, etc.)
    const primaryIds = new Map<string, number>()
    for (const el of circuitJson) {
      const idKey = Object.keys(el).find((k) => k === `${el.type}_id`)
      if (idKey) {
        const val = (el as any)[idKey]
        if (typeof val === "string") {
          primaryIds.set(val, (primaryIds.get(val) || 0) + 1)
        }
      }
    }

    let dupCount = 0
    for (const [, count] of primaryIds) {
      if (count > 1) dupCount++
    }
    expect(dupCount).toBe(0)
  })

  test("generates expected element counts", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
    const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

    const types = new Map<string, number>()
    for (const el of circuitJson) {
      types.set(el.type, (types.get(el.type) || 0) + 1)
    }

    expect(types.get("pcb_board")).toBe(1)
    expect(types.get("pcb_smtpad")).toBe(1055)
    expect(types.get("pcb_via")).toBe(42)
    expect(types.get("source_component")).toBe(322)
    expect(types.get("source_port")).toBe(1055)
    expect(types.get("pcb_port")).toBe(1055)
    expect(types.get("source_net")).toBe(245)
    expect(types.get("source_trace")).toBe(245)
  })

  test("renders SVG without errors", () => {
    const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
    const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

    const svg = convertCircuitJsonToPcbSvg(circuitJson)
    expect(svg).toContain("<svg")
    expect(svg.length).toBeGreaterThan(1000)
  })
})
