import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-json"
import { processNets } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/process-nets"
import type { DsnPcb } from "../../lib/dsn-pcb/types"

test("multi-layer support - 2 layers (default)", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 2,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  expect(dsnJson.structure.layers).toHaveLength(2)
  expect(dsnJson.structure.layers[0].name).toBe("F.Cu")
  expect(dsnJson.structure.layers[0].property.index).toBe(0)
  expect(dsnJson.structure.layers[1].name).toBe("B.Cu")
  expect(dsnJson.structure.layers[1].property.index).toBe(1)
})

test("multi-layer support - 4 layers", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 4,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  expect(dsnJson.structure.layers).toHaveLength(4)
  expect(dsnJson.structure.layers[0].name).toBe("F.Cu")
  expect(dsnJson.structure.layers[0].property.index).toBe(0)
  expect(dsnJson.structure.layers[1].name).toBe("In1.Cu")
  expect(dsnJson.structure.layers[1].property.index).toBe(1)
  expect(dsnJson.structure.layers[2].name).toBe("In2.Cu")
  expect(dsnJson.structure.layers[2].property.index).toBe(2)
  expect(dsnJson.structure.layers[3].name).toBe("B.Cu")
  expect(dsnJson.structure.layers[3].property.index).toBe(3)
})

test("multi-layer support - 6 layers", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 6,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  expect(dsnJson.structure.layers).toHaveLength(6)
  expect(dsnJson.structure.layers[0].name).toBe("F.Cu")
  expect(dsnJson.structure.layers[0].property.index).toBe(0)
  expect(dsnJson.structure.layers[1].name).toBe("In1.Cu")
  expect(dsnJson.structure.layers[1].property.index).toBe(1)
  expect(dsnJson.structure.layers[2].name).toBe("In2.Cu")
  expect(dsnJson.structure.layers[2].property.index).toBe(2)
  expect(dsnJson.structure.layers[3].name).toBe("In3.Cu")
  expect(dsnJson.structure.layers[3].property.index).toBe(3)
  expect(dsnJson.structure.layers[4].name).toBe("In4.Cu")
  expect(dsnJson.structure.layers[4].property.index).toBe(4)
  expect(dsnJson.structure.layers[5].name).toBe("B.Cu")
  expect(dsnJson.structure.layers[5].property.index).toBe(5)
})

test("multi-layer support - 4 layer via padstack spans all layers", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 4,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  // Via name should reference layers 0-3
  expect(dsnJson.structure.via).toBe("Via[0-3]_600:300_um")

  // Default via padstack should have shapes on all 4 layers
  const viaPadstack = dsnJson.library.padstacks.find(
    (p) => p.name === "Via[0-3]_600:300_um",
  )
  expect(viaPadstack).toBeDefined()
  expect(viaPadstack!.shapes).toHaveLength(4)
  expect(viaPadstack!.shapes.map((s) => s.layer)).toEqual([
    "F.Cu",
    "In1.Cu",
    "In2.Cu",
    "B.Cu",
  ])

  // Net class should reference the same via
  expect(dsnJson.network.classes[0].circuit.use_via).toBe("Via[0-3]_600:300_um")
})

test("multi-layer support - custom trace width classes use board via padstack", () => {
  const pcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "test.dsn",
    parser: {
      string_quote: "",
      host_version: "",
      space_in_quoted_tokens: "",
      host_cad: "",
    },
    resolution: { unit: "um", value: 10 },
    unit: "um",
    structure: {
      layers: [
        { name: "F.Cu", type: "signal", property: { index: 0 } },
        { name: "In1.Cu", type: "signal", property: { index: 1 } },
        { name: "In2.Cu", type: "signal", property: { index: 2 } },
        { name: "B.Cu", type: "signal", property: { index: 3 } },
      ],
      boundary: { path: { layer: "pcb", width: 0, coordinates: [] } },
      via: "Via[0-3]_600:300_um",
      rule: { width: 0, clearances: [] },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: {
      nets: [],
      classes: [
        {
          name: "kicad_default",
          description: "",
          net_names: [],
          circuit: { use_via: "Via[0-3]_600:300_um" },
          rule: { width: 150, clearances: [{ value: 150 }] },
        },
      ],
    },
    wiring: { wires: [] },
  }

  const circuitElements: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "source_component_1",
      name: "R1",
    } as any,
    {
      type: "source_component",
      source_component_id: "source_component_2",
      name: "C1",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_1",
      port_hints: ["1"],
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_2",
      source_component_id: "source_component_2",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      source_port_id: "source_port_1",
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_2",
      source_port_id: "source_port_2",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_port_id: "pcb_port_1",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      pcb_port_id: "pcb_port_2",
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_net_ids: [],
      connected_source_port_ids: ["source_port_1", "source_port_2"],
      min_trace_thickness: 0.3,
    } as any,
  ]

  processNets(circuitElements, pcb)

  const customTraceClass = pcb.network.classes.find(
    (cls) => cls.name === "trace_width_300um",
  )
  expect(customTraceClass).toBeDefined()
  expect(customTraceClass!.circuit.use_via).toBe("Via[0-3]_600:300_um")
})

test("multi-layer support - 2 layer via padstack has F.Cu and B.Cu", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      num_layers: 2,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  expect(dsnJson.structure.via).toBe("Via[0-1]_600:300_um")

  const viaPadstack = dsnJson.library.padstacks.find(
    (p) => p.name === "Via[0-1]_600:300_um",
  )
  expect(viaPadstack).toBeDefined()
  expect(viaPadstack!.shapes).toHaveLength(2)
  expect(viaPadstack!.shapes.map((s) => s.layer)).toEqual(["F.Cu", "B.Cu"])
})

test("multi-layer support - no num_layers specified (default to 2)", () => {
  const circuitElements: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      thickness: 1.4,
      width: 34.48,
      height: 14.16,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitElements)

  expect(dsnJson.structure.layers).toHaveLength(2)
  expect(dsnJson.structure.layers[0].name).toBe("F.Cu")
  expect(dsnJson.structure.layers[0].property.index).toBe(0)
  expect(dsnJson.structure.layers[1].name).toBe("B.Cu")
  expect(dsnJson.structure.layers[1].property.index).toBe(1)
})
