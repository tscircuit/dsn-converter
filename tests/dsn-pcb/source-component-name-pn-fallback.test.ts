import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-json"

test("uses source component name as placement PN fallback", () => {
  const circuitJson: any[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
    },
    {
      type: "source_component",
      source_component_id: "source_component_0",
      ftype: "simple_chip",
      name: "LED",
    },
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_0",
      source_component_id: "source_component_0",
      center: { x: 0, y: 0 },
      width: 1.6,
      height: 0.8,
      rotation: 0,
      layer: "top",
    },
    {
      type: "source_port",
      source_port_id: "source_port_0",
      source_component_id: "source_component_0",
      port_hints: ["1"],
    },
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_0",
      source_port_id: "source_port_0",
      pcb_component_id: "pcb_component_0",
    },
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_0",
      pcb_component_id: "pcb_component_0",
      pcb_port_id: "pcb_port_0",
      shape: "rect",
      x: 0,
      y: 0,
      width: 0.6,
      height: 0.4,
      layer: "top",
    },
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.placement.components).toHaveLength(1)
  expect(dsnJson.placement.components[0].places).toHaveLength(1)
  expect(dsnJson.placement.components[0].places[0].PN).toBe("LED")
})
