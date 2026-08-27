import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnString, parseDsnToDsnJson } from "lib"
import type { AnyCircuitElement } from "circuit-json"
import type { DsnPcb } from "lib"

const circuitJsonWithHole: AnyCircuitElement[] = [
  {
    type: "pcb_board",
    pcb_board_id: "board1",
    center: { x: 0, y: 0 },
    width: 40,
    height: 30,
    thickness: 1.6,
    num_layers: 2,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole1",
    hole_shape: "circle",
    hole_diameter: 3.2,
    x: 18,
    y: 13,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole2",
    hole_shape: "circle",
    hole_diameter: 3.2,
    x: -18,
    y: -13,
  } as any,
  {
    type: "pcb_hole",
    pcb_hole_id: "hole3",
    hole_shape: "circle",
    hole_diameter: 1.5,
    x: 0,
    y: 0,
  } as any,
]

test("pcb_hole elements are exported to DSN as NPTH placements", () => {
  const dsnFile = convertCircuitJsonToDsnString(circuitJsonWithHole)
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // Two unique diameters → two NPTH padstacks
  const npthPadstacks = dsnJson.library.padstacks.filter((p) =>
    p.name.startsWith("NPTH_"),
  )
  expect(npthPadstacks.length).toBe(2)

  const npth3200 = npthPadstacks.find((p) => p.name === "NPTH_3200")
  expect(npth3200).toBeDefined()
  // NPTH padstack has no copper shapes
  expect(npth3200?.shapes.length).toBe(0)
  expect(npth3200?.attach).toBe("off")

  // Three holes → three placement entries
  const npthComponents = dsnJson.placement.components.filter((c) =>
    c.name.startsWith("NPTH_"),
  )
  const totalHolePlacements = npthComponents.reduce(
    (sum, c) => sum + c.places.length,
    0,
  )
  expect(totalHolePlacements).toBe(3)

  // Check coordinates (mm → μm: 18 mm = 18 000 μm)
  const npth3200Component = npthComponents.find((c) => c.name === "NPTH_3200")
  expect(npth3200Component).toBeDefined()
  expect(npth3200Component?.places.length).toBe(2)
  expect(npth3200Component?.places[0].x).toBe(18000)
  expect(npth3200Component?.places[0].y).toBe(13000)
})
