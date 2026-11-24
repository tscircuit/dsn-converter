import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import type { AnyCircuitElement, PcbSmtPad } from "circuit-json"
import {
  type DsnPcb,
  convertCircuitJsonToDsnJson,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
import React from "react"

test("rotated_rect smt pads at 45 degrees export rotated polygon padstacks and round-trip without double-rotating placement", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbRotation={45} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={3}
        pcbRotation={90}
      />
    </board>,
  )
  circuit.render()

  const circuitJson = circuit.getCircuitJson() as AnyCircuitElement[]
  const originalR1Pads = circuitJson.filter(
    (el): el is Extract<PcbSmtPad, { shape: "rotated_rect" }> =>
      el.type === "pcb_smtpad" &&
      el.shape === "rotated_rect" &&
      el.ccw_rotation === 45,
  )
  expect(originalR1Pads).toHaveLength(2)

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  // Component places must emit rotation 0 because pin coordinates are already rotated in world space
  for (const component of dsnJson.placement.components) {
    for (const place of component.places) {
      expect(place.rotation).toBe(0)
    }
  }

  const rotatedPadstack = dsnJson.library.padstacks.find((p) =>
    p.name.startsWith("Cust[T]Pad_rotated_rect_"),
  )
  expect(rotatedPadstack).toBeDefined()
  expect(rotatedPadstack?.shapes[0]?.shapeType).toBe("polygon")
  if (rotatedPadstack?.shapes[0]?.shapeType === "polygon") {
    const coords = rotatedPadstack.shapes[0].coordinates
    expect(coords).toHaveLength(10)
    // A 45-deg rotated non-square 540x640um rectangle is not axis-aligned
    const uniqueX = new Set(coords.filter((_, i) => i % 2 === 0))
    expect(uniqueX.size).toBe(4)
  }

  // 90-deg rotated_rect should swap width and height into an axis-aligned RoundRect
  const swapped90Padstack = dsnJson.library.padstacks.find(
    (p) => p.name === "RoundRect[T]Pad_640x540_um",
  )
  expect(swapped90Padstack).toBeDefined()

  const dsnString = convertCircuitJsonToDsnString(circuitJson)
  const parsedDsn = parseDsnToDsnJson(dsnString) as DsnPcb
  const roundTripped = convertDsnPcbToCircuitJson(parsedDsn)
  const roundTrippedRotatedPads = roundTripped.filter(
    (el): el is Extract<PcbSmtPad, { shape: "rotated_rect" }> =>
      el.type === "pcb_smtpad" && el.shape === "rotated_rect",
  )

  expect(roundTrippedRotatedPads).toHaveLength(2)
  expect(roundTrippedRotatedPads[0]?.ccw_rotation).toBe(45)
  expect(roundTrippedRotatedPads[0]?.width).toBeCloseTo(0.54, 4)
  expect(roundTrippedRotatedPads[0]?.height).toBeCloseTo(0.64, 4)
  expect(roundTrippedRotatedPads[0]?.x).toBeCloseTo(originalR1Pads[0]!.x, 3)
  expect(roundTrippedRotatedPads[0]?.y).toBeCloseTo(originalR1Pads[0]!.y, 3)
})

test("non-orthogonally rotated components rotate pill and rectangular plated-hole padstacks", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="J1"
        pcbRotation={45}
        footprint={
          <footprint>
            <platedhole
              portHints={["1"]}
              shape="pill"
              outerWidth="2mm"
              outerHeight="1mm"
              innerWidth="1.2mm"
              innerHeight="0.6mm"
              pcbX={1}
              pcbY={0}
            />
          </footprint>
        }
      />
    </board>,
  )
  circuit.render()

  const circuitJson = circuit.getCircuitJson() as AnyCircuitElement[]
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  const rotatedOval = dsnJson.library.padstacks.find((p) =>
    p.name.includes("_rot45deg_um"),
  )
  expect(rotatedOval).toBeDefined()
  const pathShape = rotatedOval?.shapes[0]
  expect(pathShape?.shapeType).toBe("path")
  if (pathShape?.shapeType === "path") {
    const [x1, y1, x2, y2] = pathShape.coordinates
    // 1000um offset rotated 45 deg => (-353.553, -353.553) to (353.553, 353.553)
    expect(x1).toBeCloseTo(-353.553, 2)
    expect(y1).toBeCloseTo(-353.553, 2)
    expect(x2).toBeCloseTo(353.553, 2)
    expect(y2).toBeCloseTo(353.553, 2)
  }

  const dsnString = convertCircuitJsonToDsnString(circuitJson)
  const parsedDsn = parseDsnToDsnJson(dsnString) as DsnPcb
  const roundTripped = convertDsnPcbToCircuitJson(parsedDsn)
  const hole = roundTripped.find((el) => el.type === "pcb_plated_hole")
  expect(hole).toBeDefined()
  if (hole && hole.type === "pcb_plated_hole" && hole.shape === "oval") {
    expect(hole.ccw_rotation).toBeCloseTo(45, 3)
    expect(hole.outer_width).toBeCloseTo(2, 3)
    expect(hole.outer_height).toBeCloseTo(1, 3)
    expect(hole.hole_width).toBeCloseTo(1.2, 3)
    expect(hole.hole_height).toBeCloseTo(0.6, 3)
  }

  // Also verify circular_hole_with_rect_pad rotates its polygon padstack and 0° + 180° same-footprint components keep distinct pin orientations
  const mixedCircuitJson: AnyCircuitElement[] = [
    {
      type: "pcb_board",
      pcb_board_id: "pcb_board_0",
      center: { x: 0, y: 0 },
      width: 10,
      height: 10,
      num_layers: 2,
      thickness: 1.6,
      material: "fr4",
    },
    {
      type: "source_component",
      source_component_id: "src_hdr_0",
      ftype: "simple_pin_header",
      name: "H1",
    } as AnyCircuitElement,
    {
      type: "pcb_component",
      pcb_component_id: "pcb_hdr_0",
      source_component_id: "src_hdr_0",
      center: { x: 0, y: 0 },
      width: 2,
      height: 2,
      rotation: 45,
      layer: "top",
      obstructs_within_bounds: false,
    },
    {
      type: "pcb_plated_hole",
      pcb_plated_hole_id: "ph_rect_0",
      pcb_component_id: "pcb_hdr_0",
      shape: "circular_hole_with_rect_pad",
      hole_diameter: 0.8,
      rect_pad_width: 2,
      rect_pad_height: 1,
      x: 0,
      y: 0,
      layers: ["top", "bottom"],
    } as AnyCircuitElement,
  ]
  const rectHoleDsn = convertCircuitJsonToDsnJson(mixedCircuitJson)
  const rotatedRectHolePadstack = rectHoleDsn.library.padstacks.find(
    (p) => p.name === "RoundRect[A]Pad_2000x1000_rot45deg_um",
  )
  expect(rotatedRectHolePadstack).toBeDefined()
  const rectPoly = rotatedRectHolePadstack?.shapes[0]
  expect(rectPoly?.shapeType).toBe("polygon")
  if (rectPoly?.shapeType === "polygon") {
    const uniqueX = new Set(rectPoly.coordinates.filter((_, i) => i % 2 === 0))
    expect(uniqueX.size).toBe(4)
  }
})

test("same footprint placed at 0 and 180 degrees preserves distinct world-space pin positions", () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-2}
        pcbRotation={0}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={2}
        pcbRotation={180}
      />
    </board>,
  )
  circuit.render()

  const circuitJson = circuit.getCircuitJson() as AnyCircuitElement[]
  const dsnJson = convertCircuitJsonToDsnJson(circuitJson)
  expect(dsnJson.library.images).toHaveLength(2)
  const img0 = dsnJson.library.images[0]!
  const img180 = dsnJson.library.images[1]!
  const pin1At0 = img0.pins.find((p) => String(p.pin_number) === "1")!
  const pin1At180 = img180.pins.find((p) => String(p.pin_number) === "1")!
  expect(pin1At0.x).toBeCloseTo(-pin1At180.x, 3)
})
