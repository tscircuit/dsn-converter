import { expect, test } from "bun:test"
import type { PcbBoard, PcbSmtPad } from "circuit-json"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

// The smoothieboard DSN places several components with a non-zero place
// rotation, e.g.:
//   (place J10 211455 -120904 front 180 (PN POWER_JACKSMD))
//   (place Q2 131356 -124371 front 90 (PN 12MHz))
// Previously the pin offsets from the image definition were added to the
// component position without applying the place rotation, which pushed the
// pads of rotated components to the wrong side of the component — J10's
// pads ended up outside the board boundary.

function getCircuitJson() {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  return convertDsnPcbToCircuitJson(dsnJson)
}

function getSmtPadsForRefdes(
  circuitJson: ReturnType<typeof getCircuitJson>,
  refdes: string,
) {
  return circuitJson.filter(
    (el): el is PcbSmtPad =>
      el.type === "pcb_smtpad" &&
      Boolean(el.pcb_component_id?.endsWith(`_${refdes}`)),
  )
}

test("place rotation 180: J10 POWER_JACK pads stay inside the board", () => {
  const circuitJson = getCircuitJson()

  const board = circuitJson.find((el) => el.type === "pcb_board") as PcbBoard
  const minX = board.center.x - board.width! / 2
  const maxX = board.center.x + board.width! / 2
  const minY = board.center.y - board.height! / 2
  const maxY = board.center.y + board.height! / 2

  // (place J10 211455 -120904 front 180), image pins:
  //   P$4 (6100 -5700), VIN1 (6100 5700), GND (0 -5700), VIN0 (0 5700)
  const pads = getSmtPadsForRefdes(circuitJson, "J10")
  expect(pads.length).toBe(4)

  for (const pad of pads) {
    if (pad.shape !== "rect") throw new Error("expected rect pads on J10")
    // Previously the two x=6100 pads sat at x=217.555, past the board's
    // right edge at x=213.275
    expect(pad.x).toBeGreaterThanOrEqual(minX)
    expect(pad.x).toBeLessThanOrEqual(maxX)
    expect(pad.y).toBeGreaterThanOrEqual(minY)
    expect(pad.y).toBeLessThanOrEqual(maxY)
  }

  // Rotating (6100, ±5700) by 180° puts those pads at x = 211.455 - 6.1
  const padXs = [...new Set(pads.map((p) => (p as any).x.toFixed(3)))].sort()
  expect(padXs).toEqual(["205.355", "211.455"])
  const padYs = [...new Set(pads.map((p) => (p as any).y.toFixed(3)))].sort()
  expect(padYs).toEqual(["-115.204", "-126.604"])
})

test("place rotation 90: Q2 crystal pin offsets are rotated and pad dimensions swapped", () => {
  const circuitJson = getCircuitJson()

  // (place Q2 131356 -124371 front 90), image pins (Rect[T]Pad_1400x1200_um):
  //   GND2 (1100 -800), 1 (-1100 -800), 2 (1100 800), GND1 (-1100 800)
  const pads = getSmtPadsForRefdes(circuitJson, "Q2")
  expect(pads.length).toBe(4)

  const byPin = new Map(pads.map((p) => [p.port_hints![0], p as any]))
  const expected: Record<string, { x: number; y: number }> = {
    // (x, y) offset rotated 90° CCW becomes (-y, x)
    GND2: { x: 131.356 + 0.8, y: -124.371 + 1.1 },
    "1": { x: 131.356 + 0.8, y: -124.371 - 1.1 },
    "2": { x: 131.356 - 0.8, y: -124.371 + 1.1 },
    GND1: { x: 131.356 - 0.8, y: -124.371 - 1.1 },
  }

  for (const [pinNumber, { x, y }] of Object.entries(expected)) {
    const pad = byPin.get(pinNumber)
    expect(pad).toBeDefined()
    expect(pad.x).toBeCloseTo(x, 6)
    expect(pad.y).toBeCloseTo(y, 6)
    // The 1400x1200um pad is rotated 90°, so width and height swap
    expect(pad.width).toBeCloseTo(1.2, 6)
    expect(pad.height).toBeCloseTo(1.4, 6)
  }
})

test("back-side placement: SJ2 pin offsets are mirrored about the Y axis", () => {
  const circuitJson = getCircuitJson()

  // (place SJ2 104369 -148692 back 0), image pins (Rect[T]Pad_635x1270_um):
  //   3 (889 0), 2 (0 0), 1 (-889 0)
  // A back-side image is mirrored about its Y axis, so pins 1 and 3 swap x
  const pads = getSmtPadsForRefdes(circuitJson, "SJ2")
  expect(pads.length).toBe(3)

  const byPin = new Map(pads.map((p) => [p.port_hints![0], p as any]))
  expect(byPin.get("3").x).toBeCloseTo(104.369 - 0.889, 6)
  expect(byPin.get("2").x).toBeCloseTo(104.369, 6)
  expect(byPin.get("1").x).toBeCloseTo(104.369 + 0.889, 6)
})
