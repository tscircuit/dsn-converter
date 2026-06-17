import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "lib"

test("uses kicad_default for the default 150um trace width", () => {
  const circuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "board1",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
    },
    {
      type: "source_component",
      source_component_id: "sc1",
      name: "U1",
      ftype: "simple_chip",
    } as any,
    {
      type: "source_component",
      source_component_id: "sc2",
      name: "U2",
      ftype: "simple_chip",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pc1",
      source_component_id: "sc1",
      center: { x: 1, y: 2 },
      rotation: 0,
      layer: "top",
    } as any,
    {
      type: "pcb_component",
      pcb_component_id: "pc2",
      source_component_id: "sc2",
      center: { x: 4, y: 2 },
      rotation: 0,
      layer: "top",
    } as any,
    {
      type: "source_port",
      source_port_id: "sp1",
      source_component_id: "sc1",
      name: "1",
      port_hints: ["1"],
    } as any,
    {
      type: "source_port",
      source_port_id: "sp2",
      source_component_id: "sc2",
      name: "1",
      port_hints: ["1"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pp1",
      source_port_id: "sp1",
      pcb_component_id: "pc1",
      x: 1,
      y: 2,
      layers: ["top"],
    } as any,
    {
      type: "pcb_port",
      pcb_port_id: "pp2",
      source_port_id: "sp2",
      pcb_component_id: "pc2",
      x: 4,
      y: 2,
      layers: ["top"],
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad1",
      pcb_component_id: "pc1",
      pcb_port_id: "pp1",
      shape: "rect",
      x: 1,
      y: 2,
      width: 0.6,
      height: 0.4,
      layer: "top",
    } as any,
    {
      type: "pcb_smtpad",
      pcb_smtpad_id: "pad2",
      pcb_component_id: "pc2",
      pcb_port_id: "pp2",
      shape: "rect",
      x: 4,
      y: 2,
      width: 0.6,
      height: 0.4,
      layer: "top",
    } as any,
    {
      type: "source_trace",
      source_trace_id: "st1",
      connected_source_port_ids: ["sp1", "sp2"],
      connected_source_net_ids: [],
      min_trace_thickness: 0.15,
    } as any,
  ]

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)

  expect(dsnJson.network.classes.map((cls) => cls.name)).not.toContain(
    "trace_width_150um",
  )
  expect(
    dsnJson.network.classes.find((cls) => cls.name === "kicad_default")
      ?.net_names,
  ).toHaveLength(1)
})
