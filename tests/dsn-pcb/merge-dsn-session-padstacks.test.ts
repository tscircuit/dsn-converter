import { expect, test } from "bun:test"
import { type DsnPcb, type DsnSession, mergeDsnSessionIntoDsnPcb } from "lib"

const circlePadstack = (name: string, attach = "off") => ({
  name,
  shapes: [{ shapeType: "circle" as const, layer: "F.Cu", diameter: 600 }],
  attach,
})

const basePcb: DsnPcb = {
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
    images: [],
    padstacks: [circlePadstack("ExistingVia")],
  },
  network: { nets: [], classes: [] },
  wiring: { wires: [] },
}

test("deduplicates new session library padstacks when merging", () => {
  const session: DsnSession = {
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
        images: [],
        padstacks: [
          circlePadstack("ExistingVia"),
          circlePadstack("NewVia", "off"),
          circlePadstack("NewVia", "on"),
        ],
      },
      network_out: { nets: [] },
    },
  }

  const mergedPcb = mergeDsnSessionIntoDsnPcb(basePcb, session)
  const newViaPadstacks = mergedPcb.library.padstacks.filter(
    (padstack) => padstack.name === "NewVia",
  )

  expect(mergedPcb.library.padstacks.map((padstack) => padstack.name)).toEqual([
    "ExistingVia",
    "NewVia",
  ])
  expect(newViaPadstacks).toHaveLength(1)
  expect(newViaPadstacks[0].attach).toBe("off")
})
