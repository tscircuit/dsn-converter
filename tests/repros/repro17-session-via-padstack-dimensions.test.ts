import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import {
  type DsnPcb,
  type DsnSession,
  convertDsnSessionToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

const baseDsnPcb: DsnPcb = {
  is_dsn_pcb: true,
  filename: "session-via-padstack-dimensions",
  parser: {
    string_quote: '"',
    host_version: "",
    space_in_quoted_tokens: "",
    host_cad: "",
  },
  resolution: { unit: "um", value: 10 },
  unit: "um",
  structure: {
    layers: [
      { name: "F.Cu", type: "signal", property: { index: 0 } },
      { name: "B.Cu", type: "signal", property: { index: 1 } },
    ],
    boundary: {
      path: {
        layer: "pcb",
        width: 0,
        coordinates: [-100000, -100000, 100000, -100000, 100000, 100000],
      },
    },
    via: "Via[0-1]_600:300_um",
    rule: { clearances: [], width: 2000 },
  },
  placement: { components: [] },
  library: { images: [], padstacks: [] },
  network: {
    nets: [{ name: "GND", pins: [] }],
    classes: [],
  },
  wiring: { wires: [] },
}

const sessionWithTwoViaPadstacks: DsnSession = {
  is_dsn_session: true,
  filename: "session-via-padstack-dimensions",
  placement: {
    resolution: { unit: "um", value: 10 },
    components: [],
  },
  routes: {
    resolution: { unit: "um", value: 10 },
    parser: {
      string_quote: '"',
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    library_out: {
      images: [],
      padstacks: [
        {
          name: "Via[0-1]_600:300_um",
          shapes: [
            { shapeType: "circle", layer: "F.Cu", diameter: 6000 },
            { shapeType: "circle", layer: "B.Cu", diameter: 6000 },
          ],
          attach: "off",
        },
        {
          name: "Via[0-1]_800:400_um",
          shapes: [
            { shapeType: "circle", layer: "F.Cu", diameter: 8000 },
            { shapeType: "circle", layer: "B.Cu", diameter: 8000 },
          ],
          attach: "off",
        },
      ],
    },
    network_out: {
      nets: [
        {
          name: "GND",
          wires: [
            {
              path: {
                layer: "F.Cu",
                width: 2000,
                coordinates: [0, 0, 10000, 0],
              },
              net: "GND",
              type: "route",
            },
          ],
          vias: [{ padstack_name: "Via[0-1]_800:400_um", x: 10000, y: 0 }],
        },
      ],
    },
  },
}

test("parses session via padstack names", () => {
  const session = parseDsnToDsnJson(`
    (session "session-via-padstack-dimensions"
      (base_design "session-via-padstack-dimensions")
      (placement
        (resolution um 10)
      )
      (routes
        (resolution um 10)
        (parser
          (host_cad "KiCad's Pcbnew")
          (host_version)
        )
        (library_out
          (padstack "Via[0-1]_600:300_um"
            (shape (circle F.Cu 6000 0 0))
            (shape (circle B.Cu 6000 0 0))
            (attach off)
          )
          (padstack "Via[0-1]_800:400_um"
            (shape (circle F.Cu 8000 0 0))
            (shape (circle B.Cu 8000 0 0))
            (attach off)
          )
        )
        (network_out
          (net GND
            (wire
              (path F.Cu 2000
                0 0
                10000 0
              )
            )
            (via "Via[0-1]_800:400_um" 10000 0)
          )
        )
      )
    )
  `) as DsnSession

  expect(session.routes.network_out.nets[0].vias?.[0]?.padstack_name).toBe(
    "Via[0-1]_800:400_um",
  )
})

test("uses each session via padstack dimensions when converting to circuit json", () => {
  const circuitJson = convertDsnSessionToCircuitJson(
    baseDsnPcb,
    sessionWithTwoViaPadstacks,
  )
  const vias = su(circuitJson).pcb_via.list()

  expect(vias).toHaveLength(1)
  expect(vias[0].outer_diameter).toBe(0.8)
  expect(vias[0].hole_diameter).toBe(0.4)
})
