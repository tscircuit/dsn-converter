import { expect, test } from "bun:test"
import type { DsnPcb } from "lib"
import { convertPadstacksToSmtPads } from "lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-padstacks-to-smtpads"
import { scale } from "transformation-matrix"

const transform = scale(1 / 1000)

// A 3-pad footprint placed rotated 90°: without applying place.rotation,
// the pads stay at their unrotated offsets.
const pcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "rot-test.dsn",
  parser: {
    string_quote: '"',
    host_version: "8.0",
    space_in_quoted_tokens: "on",
    host_cad: "KiCad's Pcbnew",
  },
  resolution: { unit: "um", value: 10 },
  unit: "um",
  structure: {
    layers: [{ name: "F.Cu", type: "signal", property: { index: 0 } }],
    boundary: {
      path: {
        layer: "F.Cu",
        width: 0,
        coordinates: [0, 0, 10000, 0, 10000, 10000, 0, 10000],
      },
    },
    via: "Via[0-1]_600:400_um",
    rule: { clearances: [{ value: 200 }], width: 200 },
  },
  placement: {
    components: [
      {
        name: "test:footprint",
        places: [
          { refdes: "R1", x: 5000, y: 5000, side: "front", rotation: 90 },
        ],
      },
    ],
  },
  library: {
    images: [
      {
        name: "test:footprint",
        outlines: [],
        pins: [
          {
            padstack_name: "Rect[T]Pad_1000x500_um",
            pin_number: 1,
            x: 1000,
            y: 0,
          },
          {
            padstack_name: "Rect[T]Pad_1000x500_um",
            pin_number: 2,
            x: -1000,
            y: 0,
          },
        ],
      },
    ],
    padstacks: [
      {
        name: "Rect[T]Pad_1000x500_um",
        shapes: [
          {
            shapeType: "rect",
            layer: "F.Cu",
            width: 0,
            coordinates: [-500, -250, 500, 250],
          },
        ],
        attach: "off",
      },
    ],
  },
  network: { nets: [], classes: [] },
  wiring: { wires: [] },
} as unknown as DsnPcb

test("place.rotation rotates pad offsets around the component center", () => {
  const elements = convertPadstacksToSmtPads(pcb, transform)
  const pads = elements.filter((e: any) => e.type === "pcb_smtpad") as any[]

  expect(pads.length).toBe(2)

  // Pad 1 at local (1000, 0) um rotated 90° CCW around component center
  // in DSN space (y-up): offset becomes (0, 1000) → mm: (5, 6)
  const pad1 = pads.find((p) => p.port_hints[0] === "1")
  const pad2 = pads.find((p) => p.port_hints[0] === "2")

  // DSN y-up → circuit y-down flip happens in the transform; verify offsets
  // are perpendicular to the original axis (x-offset rotates onto y-axis)
  const mm = (v: number) => v / 1000
  const compX = mm(5000)
  const compY = mm(5000)
  const d1x = pad1.x - compX
  const d1y = pad1.y - compY
  const d2x = pad2.x - compX
  const d2y = pad2.y - compY

  // Rotation must move the ±1000um x-offsets onto the y-axis (±1mm)
  expect(Math.abs(d1x) < 0.001 && Math.abs(d1y) - 1 < 0.01).toBe(true)
  expect(Math.abs(d2x) < 0.001 && Math.abs(d2y) - 1 < 0.01).toBe(true)
})
