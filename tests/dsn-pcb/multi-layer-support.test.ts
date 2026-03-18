import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToDsnJson } from "../../lib/dsn-pcb/circuit-json-to-dsn-json/convert-circuit-json-to-dsn-json"

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
