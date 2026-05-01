import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

const circuitJsonWithPcbHoles: AnyCircuitElement[] = [
  {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 0, y: 0 },
    width: 30,
    height: 30,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "circle",
    hole_diameter: 3.2,
    x: 5,
    y: 5,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole2",
    hole_shape: "circle",
    hole_diameter: 3.2,
    x: -5,
    y: -5,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole3",
    hole_shape: "circle",
    hole_diameter: 2.0,
    x: 0,
    y: 5,
  } as any,
]

test("circuit json with pcb_hole -> dsn file", () => {
  const dsnFile = convertCircuitJsonToDsnString(circuitJsonWithPcbHoles)
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // Should have NPTH padstacks for each unique hole diameter
  const npthPadstacks = dsnJson.library.padstacks.filter((p) =>
    p.name.startsWith("NPTH_"),
  )
  expect(npthPadstacks.length).toBe(2) // 3.2mm and 2.0mm

  // Check the 3200um padstack exists
  const padstack3200 = npthPadstacks.find((p) => p.name === "NPTH_3200")
  expect(padstack3200).toBeDefined()
  expect(padstack3200!.attach).toBe("off")
  expect(padstack3200!.shapes).toHaveLength(1)
  expect((padstack3200!.shapes[0] as any).diameter).toBe(3200)

  // Check the 2000um padstack exists
  const padstack2000 = npthPadstacks.find((p) => p.name === "NPTH_2000")
  expect(padstack2000).toBeDefined()
  expect((padstack2000!.shapes[0] as any).diameter).toBe(2000)

  // Should have library images for each hole type
  const npthImages = dsnJson.library.images.filter((img) =>
    img.name.startsWith("NPTH_"),
  )
  expect(npthImages.length).toBe(2)

  // Check placement components for holes
  const holeComponents = dsnJson.placement.components.filter((c) =>
    c.name.startsWith("NPTH_"),
  )
  expect(holeComponents.length).toBe(2) // one entry per unique hole size

  // The 3200um component should have 2 places (hole1 and hole2)
  const comp3200 = holeComponents.find((c) => c.name === "NPTH_3200_mm")
  expect(comp3200).toBeDefined()
  expect(comp3200!.places).toHaveLength(2)

  // The 2000um component should have 1 place (hole3)
  const comp2000 = holeComponents.find((c) => c.name === "NPTH_2000_mm")
  expect(comp2000).toBeDefined()
  expect(comp2000!.places).toHaveLength(1)
})
