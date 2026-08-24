import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib"
import type { AnyCircuitElement } from "circuit-json"

test("source net names are used as DSN net labels", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "source_component",
      source_component_id: "source_component_1",
      name: "U1",
      ftype: "simple_chip",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_component_1",
      source_component_id: "source_component_1",
      center: { x: 0, y: 0 },
      rotation: 0,
      layer: "top",
    } as any,
    {
      type: "source_port",
      source_port_id: "source_port_1",
      source_component_id: "source_component_1",
      name: "pin1",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pcb_port_1",
      source_port_id: "source_port_1",
      x: 0,
      y: 0,
      layers: ["top"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pcb_smtpad_1",
      pcb_component_id: "pcb_component_1",
      pcb_port_id: "pcb_port_1",
      layer: "top",
      shape: "rect",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    } as any,
    {
      type: "source_net",
      source_net_id: "source_net_0",
      name: "GND",
    } as any,
    {
      type: "source_trace",
      source_trace_id: "source_trace_1",
      connected_source_net_ids: ["source_net_0"],
      connected_source_port_ids: ["source_port_1"],
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const netNames = dsnJson.network.nets.map((net) => net.name)

  expect(netNames).toContain("GND")
  expect(netNames).not.toContain("GND_source_net_0")
  expect(
    dsnJson.network.classes.some((cls) => cls.net_names.includes("GND")),
  ).toBe(true)
})
