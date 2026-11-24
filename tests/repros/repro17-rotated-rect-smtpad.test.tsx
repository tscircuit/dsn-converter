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
