import { expect, test } from "bun:test"
import { convertWiresToPcbTraces } from "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-wires-to-traces"
import { getComponentValue } from "lib/utils/get-component-value"
import { scale } from "transformation-matrix"

test("getComponentValue formats sub-nF capacitances in pF and supports inductance values", () => {
  expect(getComponentValue({ capacitance: 100e-12 })).toBe("100pF")
  expect(getComponentValue({ capacitance: 22e-12 })).toBe("22pF")
  expect(getComponentValue({ capacitance: 100e-9 })).toBe("0.100uF")
  expect(getComponentValue({ inductance: 10e-6 })).toBe("10uH")
  expect(getComponentValue({ inductance: 4.7e-3 })).toBe("4.7mH")
  expect(getComponentValue({ inductance: 100e-9 })).toBe("100nH")
})

test("convertWiresToPcbTraces assigns unique pcb_via_id when a net has multiple wiring vias", () => {
  const elements = convertWiresToPcbTraces(
    {
      wires: [
        {
          type: "via",
          net: "GND",
          path: { layer: "all", width: 0, coordinates: [1000, 2000] },
        },
        {
          type: "via",
          net: "GND",
          path: { layer: "all", width: 0, coordinates: [3000, 4000] },
        },
      ],
    },
    { nets: [], classes: [] },
    scale(1 / 1000),
  )

  const vias = elements.filter((e) => e.type === "pcb_via")
  expect(vias).toHaveLength(2)
  expect(vias[0]).toMatchObject({
    pcb_via_id: "pcb_via_GND",
    x: 1,
    y: 2,
  })
  expect(vias[1]).toMatchObject({
    pcb_via_id: "pcb_via_GND_1",
    x: 3,
    y: 4,
  })
})
