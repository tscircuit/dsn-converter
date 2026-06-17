import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("exports bottom plated-hole-only component placements as back side", () => {
  const circuitJson = [
    {
      type: "source_component",
      source_component_id: "source_component_j1",
      ftype: "simple_pin_header",
      name: "J1",
    },
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_j1",
      pin_number: 1,
      port_hints: ["1"],
    },
    {
      type: "source_port",
      source_port_id: "source_port_2",
      source_component_id: "source_component_j1",
      pin_number: 2,
      port_hints: ["2"],
    },
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 8,
      height: 6,
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_j1",
      source_component_id: "source_component_j1",
      center: { x: 1, y: -1 },
      width: 2.54,
      height: 1,
      layer: "bottom",
      rotation: 0,
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      pcb_component_id: "pcb_component_j1",
      source_port_id: "source_port_1",
      x: 0.5,
      y: -1,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_2",
      pcb_component_id: "pcb_component_j1",
      source_port_id: "source_port_2",
      x: 1.5,
      y: -1,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_1",
      pcb_component_id: "pcb_component_j1",
      pcb_port_id: "pcb_port_1",
      outer_diameter: 1,
      hole_diameter: 0.6,
      shape: "circle",
      port_hints: ["1"],
      x: 0.5,
      y: -1,
      layers: ["top", "bottom"],
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "pcb_plated_hole_2",
      pcb_component_id: "pcb_component_j1",
      pcb_port_id: "pcb_port_2",
      outer_diameter: 1,
      hole_diameter: 0.6,
      shape: "circle",
      port_hints: ["2"],
      x: 1.5,
      y: -1,
      layers: ["top", "bottom"],
    },
  ] as unknown as AnyCircuitElement[]

  const dsn = convertCircuitJsonToDsnJson(circuitJson)
  const placement = dsn.placement.components.find((component) =>
    component.name.startsWith("simple_pin_header:"),
  )

  expect(placement).toBeDefined()
  expect(placement!.places).toHaveLength(1)
  expect(placement!.places[0].refdes).toBe("J1_source_component_j1")
  expect(placement!.places[0].side).toBe("back")
})
