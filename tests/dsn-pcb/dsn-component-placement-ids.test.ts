import { expect, test } from "bun:test"
import { scale } from "transformation-matrix"

import { convertDsnPcbComponentsToSourceComponentsAndPorts } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-dsn-pcb-components-to-source-components-and-ports"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

test("creates pcb_component entries with ids shared by ports and pads", () => {
  const dsnPcb = {
    library: {
      images: [
        {
          name: "Resistor_SMD",
          outlines: [
            {
              path: {
                layer: "signal",
                width: 0,
                coordinates: [-1500, -500, 1500, -500, 1500, 500, -1500, 500],
              },
            },
          ],
          pins: [
            { padstack_name: "pad", pin_number: 1, x: -1000, y: 0 },
            { padstack_name: "pad", pin_number: 2, x: 1000, y: 0 },
          ],
        },
      ],
      padstacks: [],
    },
    placement: {
      components: [
        {
          name: "Resistor_SMD",
          places: [
            {
              refdes: "R1",
              PN: "10k",
              x: 5000,
              y: 7000,
              side: "front",
              rotation: 90,
            },
          ],
        },
      ],
    },
  } as DsnPcb

  const elements = convertDsnPcbComponentsToSourceComponentsAndPorts({
    dsnPcb,
    transformDsnUnitToMm: scale(1 / 1000),
  }) as any[]

  const pcbComponent = elements.find(
    (element) => element.type === "pcb_component",
  )
  expect(pcbComponent).toMatchObject({
    pcb_component_id: "Resistor_SMD_R1",
    source_component_id: "sc_Resistor_SMD_R1",
    center: { x: 5, y: 7 },
    width: 3,
    height: 1,
    layer: "top",
    rotation: 90,
  })

  const pcbPorts = elements.filter((element) => element.type === "pcb_port")
  expect(pcbPorts).toHaveLength(2)
  expect(
    pcbPorts.every((port) => port.pcb_component_id === "Resistor_SMD_R1"),
  ).toBe(true)
})
