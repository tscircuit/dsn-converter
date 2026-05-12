import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { processPlatedHoles } from "lib/dsn-pcb/circuit-json-to-dsn-json/process-plated-holes"
import type { ComponentGroup, DsnPcb } from "lib/dsn-pcb/types"

test("uses source_port pin_number for plated-hole image pins", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      width: 10,
      height: 10,
      center: { x: 0, y: 0 },
      num_layers: 2,
    } as AnyCircuitElement,
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "J1",
      ftype: "simple_pin_header",
    } as AnyCircuitElement,
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 0, y: 0 },
      rotation: 0,
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp3",
      source_component_id: "sc1",
      name: "P3",
      pin_number: 3,
    } as AnyCircuitElement,
    {
      type: "source_port",
      source_port_id: "sp4",
      source_component_id: "sc1",
      name: "P4",
      pin_number: 4,
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp3",
      source_port_id: "sp3",
      pcb_component_id: "pc1",
      x: -0.5,
      y: 0,
      layers: ["top", "bottom"],
    } as AnyCircuitElement,
    {
      type: "pcb_port",
      pcb_port_id: "pp4",
      source_port_id: "sp4",
      pcb_component_id: "pc1",
      x: 0.5,
      y: 0,
      layers: ["top", "bottom"],
    } as AnyCircuitElement,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole3",
      pcb_component_id: "pc1",
      pcb_port_id: "pp3",
      shape: "circle",
      x: -0.5,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.5,
    } as AnyCircuitElement,
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "hole4",
      pcb_component_id: "pc1",
      pcb_port_id: "pp4",
      shape: "circle",
      x: 0.5,
      y: 0,
      outer_diameter: 1,
      hole_diameter: 0.5,
    } as AnyCircuitElement,
  ]
  const pcb: DsnPcb = {
    is_dsn_pcb: true,
    filename: "",
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
      rule: { clearances: [], width: 0 },
    },
    placement: { components: [] },
    library: { images: [], padstacks: [] },
    network: { nets: [], classes: [] },
    wiring: { wires: [] },
  }
  const componentGroups: ComponentGroup[] = [
    {
      pcb_component_id: "pc1",
      pcb_smtpads: [],
      pcb_plated_holes: circuitJson.filter(
        (element) => element.type === "pcb_plated_hole",
      ) as ComponentGroup["pcb_plated_holes"],
    },
  ]

  processPlatedHoles(componentGroups, circuitJson, pcb, 2)
  const imagePins = pcb.library.images[0].pins.map((pin) => pin.pin_number)

  expect(imagePins).toEqual([3, 4])
})
