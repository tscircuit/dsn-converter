import { expect, test } from "bun:test"
import { type DsnPcb, type DsnSession, mergeDsnSessionIntoDsnPcb } from "lib"

const makeBasePcb = (): DsnPcb => ({
  is_dsn_pcb: true,
  filename: "board.dsn",
  parser: {
    string_quote: "",
    host_version: "",
    space_in_quoted_tokens: "",
    host_cad: "",
  },
  resolution: { unit: "um", value: 10 },
  unit: "um",
  structure: {
    layers: [],
    boundary: { path: { layer: "pcb", width: 0, coordinates: [] } },
    via: "",
    rule: { width: 0, clearances: [] },
  },
  placement: { components: [] },
  library: {
    images: [{ name: "ExistingImage", outlines: [], pins: [] }],
    padstacks: [],
  },
  network: { nets: [], classes: [] },
  wiring: { wires: [] },
})

const makeSession = (): DsnSession => ({
  is_dsn_session: true,
  filename: "board.ses",
  placement: {
    resolution: { unit: "um", value: 10 },
    components: [],
  },
  routes: {
    resolution: { unit: "um", value: 10 },
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    library_out: {
      images: [
        { name: "ExistingImage", outlines: [], pins: [] },
        {
          name: "SessionImage",
          outlines: [
            {
              path: {
                layer: "F.Cu",
                width: 0,
                coordinates: [0, 0, 100, 0, 100, 100],
              },
            },
          ],
          pins: [{ padstack_name: "PadA", pin_number: 1, x: 10, y: 20 }],
        },
      ],
      padstacks: [],
    },
    network_out: { nets: [] },
  },
})

test("merge dsn session preserves library_out images", () => {
  const mergedPcb = mergeDsnSessionIntoDsnPcb(makeBasePcb(), makeSession())

  expect(mergedPcb.library.images.map((image) => image.name)).toEqual([
    "ExistingImage",
    "SessionImage",
  ])
  expect(mergedPcb.library.images[1].outlines[0].path.coordinates).toEqual([
    0, 0, 100, 0, 100, 100,
  ])
  expect(mergedPcb.library.images[1].pins[0]).toEqual({
    padstack_name: "PadA",
    pin_number: 1,
    x: 10,
    y: 20,
  })
})
