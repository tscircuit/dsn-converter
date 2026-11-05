import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import {
  type DsnPcb,
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

test("preserves PCB components without source_component and pads without source_port when converting circuit json to dsn", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 20,
      height: 20,
      thickness: 1.6,
      num_layers: 2,
      material: "fr4",
    },
    // Component 1: Standard SMT resistor with source_component and source_ports using pin_number (empty port_hints)
    {
      type: "source_component",
      source_component_id: "source_component_0",
      ftype: "simple_resistor",
      name: "R1",
      resistance: 1000,
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
      name: "pin1",
      pin_number: 1,
      port_hints: ["pin1"],
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_0",
      name: "pin2",
      pin_number: 2,
      port_hints: ["pin2"],
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: -4, y: 0 },
      width: 2,
      height: 1,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_0",
      x: -4.5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      pcb_component_id: "pcb_component_0",
      source_port_id: "source_port_1",
      x: -3.5,
      y: 0,
      layers: ["top"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_0",
      shape: "rect",
      x: -4.5,
      y: 0,
      width: 0.6,
      height: 0.6,
      layer: "top",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_1",
      shape: "rect",
      x: -3.5,
      y: 0,
      width: 0.6,
      height: 0.6,
      layer: "top",
    },
    // Component 2: PCB-only SMT component without source_component or source_port
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_unlinked_smd",
      source_component_id: "",
      center: { x: 4, y: 0 },
      width: 3,
      height: 1.5,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_2",
      pcb_component_id: "pcb_component_unlinked_smd",
      shape: "rect",
      x: 3,
      y: 0,
      width: 0.8,
      height: 0.8,
      layer: "top",
      port_hints: ["1"],
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_3",
      pcb_component_id: "pcb_component_unlinked_smd",
      shape: "rect",
      x: 5,
      y: 0,
      width: 0.8,
      height: 0.8,
      layer: "top",
    },
    // Component 3: Plated-hole component without source_component
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_unlinked_th",
      source_component_id: "",
      center: { x: 0, y: 5 },
      width: 2.54,
      height: 2.54,
      layer: "top",
      rotation: 0,
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_0",
      pcb_component_id: "pcb_component_unlinked_th",
      shape: "circle",
      x: 0,
      y: 5,
      outer_diameter: 1.6,
      hole_diameter: 1.0,
      layers: ["top", "bottom"],
      port_hints: ["1"],
    },
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const placedRefdes = dsnJson.placement.components.flatMap((comp) =>
    comp.places.map((place) => place.refdes),
  )

  expect(placedRefdes).toContain("R1_source_component_0")
  expect(placedRefdes).toContain("pcb_component_unlinked_smd")
  expect(placedRefdes).toContain("pcb_component_unlinked_th")

  const r1Image = dsnJson.library.images.find(
    (img) => img.name === "simple_resistor:2.0000x1.0000_mm",
  )
  expect(r1Image?.pins.map((p) => Number(p.pin_number))).toEqual([1, 2])

  const unlinkedSmdImage = dsnJson.library.images.find(
    (img) => img.name === "pcb_component_unlinked_smd:3.0000x1.5000_mm",
  )
  expect(unlinkedSmdImage?.pins).toHaveLength(2)
  expect(unlinkedSmdImage?.pins.map((p) => Number(p.pin_number))).toEqual([
    1, 2,
  ])

  // Verify round-trip via DSN string preserves all pads and plated holes
  const dsnString = convertCircuitJsonToDsnString(circuitJson)
  const parsedDsn = parseDsnToDsnJson(dsnString) as DsnPcb
  const roundTripped = convertDsnPcbToCircuitJson(parsedDsn)

  const roundTrippedSmtPads = roundTripped.filter(
    (el) => el.type === "pcb_smtpad",
  )
  const roundTrippedPlatedHoles = roundTripped.filter(
    (el) => el.type === "pcb_plated_hole",
  )
  expect(roundTrippedSmtPads).toHaveLength(4)
  expect(roundTrippedPlatedHoles).toHaveLength(1)
})
