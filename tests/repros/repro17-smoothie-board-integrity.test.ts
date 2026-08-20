import { expect, test } from "bun:test"
import { type DsnPcb, convertDsnPcbToCircuitJson, parseDsnToDsnJson } from "lib"

// @ts-ignore
import dsnFile from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const getCircuitJson = () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  return { dsnJson, circuitJson: convertDsnPcbToCircuitJson(dsnJson) }
}

test("smoothieboard: pins with (rotate ...) clause parse correctly", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // e.g. (pin Rect[T]Pad_1600x1400_um (rotate 90) A 1400 0)
  const imageWithRotatedPins = dsnJson.library.images.find((img) =>
    img.pins?.some((pin) => pin.rotation !== undefined),
  )
  expect(imageWithRotatedPins).toBeDefined()

  const rotatedPins = imageWithRotatedPins!.pins!.filter(
    (pin) => pin.rotation !== undefined,
  )
  expect(rotatedPins.length).toBeGreaterThan(0)
  for (const pin of rotatedPins) {
    // The pin name must be the atom AFTER the (rotate N) clause, never the
    // literal string "rotate"
    expect(pin.pin_number).not.toBe("rotate")
    expect([90, 180, 270]).toContain(pin.rotation!)
    expect(Number.isFinite(pin.x)).toBe(true)
    expect(Number.isFinite(pin.y)).toBe(true)
  }

  // Named pins keep their string names (e.g. "GND2", "A", "-", "2@1")
  const allPinNames = dsnJson.library.images.flatMap((img) =>
    (img.pins ?? []).map((pin) => pin.pin_number),
  )
  expect(allPinNames).toContain("GND2")
  expect(allPinNames).toContain("A")
  expect(allPinNames).toContain("-")
  expect(allPinNames).toContain("2@1")
})

test("smoothieboard: circuit json contains no NaN or null pin numbers", () => {
  const { circuitJson } = getCircuitJson()

  const walk = (value: any): boolean => {
    if (typeof value === "number") return Number.isNaN(value)
    if (Array.isArray(value)) return value.some(walk)
    if (value && typeof value === "object") {
      return Object.values(value).some(walk)
    }
    return false
  }
  expect(circuitJson.some(walk)).toBe(false)

  const sourcePorts = circuitJson.filter((e) => e.type === "source_port")
  expect(sourcePorts.length).toBeGreaterThan(1000)
  for (const port of sourcePorts) {
    if ((port as any).pin_number !== undefined) {
      expect(typeof (port as any).pin_number).toBe("number")
    }
  }
})

test("smoothieboard: all net pins resolve to source ports", () => {
  const { dsnJson, circuitJson } = getCircuitJson()

  const sourcePorts = circuitJson.filter((e) => e.type === "source_port")
  const portNames = new Set(sourcePorts.map((p) => (p as any).name))

  let totalNetPins = 0
  const unmatched: string[] = []
  for (const net of dsnJson.network.nets) {
    if (!net.name || net.name.startsWith("unconnected-")) continue
    for (const pin of net.pins ?? []) {
      totalNetPins++
      if (!portNames.has(pin)) unmatched.push(`${net.name}:${pin}`)
    }
  }

  expect(totalNetPins).toBeGreaterThan(1000)
  expect(unmatched).toEqual([])

  // Every source trace should connect at least one port
  const sourceTraces = circuitJson.filter((e) => e.type === "source_trace")
  for (const trace of sourceTraces) {
    expect(
      (trace as any).connected_source_port_ids.length,
    ).toBeGreaterThanOrEqual(1)
  }
})

test("smoothieboard: element ids are unique", () => {
  const { circuitJson } = getCircuitJson()

  for (const elementType of [
    "pcb_smtpad",
    "pcb_plated_hole",
    "pcb_via",
    "source_port",
    "pcb_port",
  ]) {
    const ids = circuitJson
      .filter((e) => e.type === elementType)
      .map((e) => (e as any)[`${elementType}_id`])
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).not.toContain("NaN")
    }
  }
})

test("smoothieboard: placement rotation is applied to pad positions", () => {
  const { dsnJson, circuitJson } = getCircuitJson()

  // IC1 is placed with a 45-degree-class rotation; its pads must not be
  // axis-aligned around the placement origin anymore. Compare against the
  // unrotated positions: at least one pad must differ.
  const ic1Component = dsnJson.placement.components.find((c) =>
    c.places.some((p) => p.refdes === "IC1"),
  )!
  const ic1Place = ic1Component.places.find((p) => p.refdes === "IC1")!
  expect(ic1Place.rotation % 360).not.toBe(0)

  const ic1Pads = circuitJson.filter(
    (e) =>
      e.type === "pcb_smtpad" &&
      (e as any).pcb_component_id === `${ic1Component.name}_IC1`,
  )
  expect(ic1Pads.length).toBeGreaterThan(0)

  const image = dsnJson.library.images.find(
    (img) => img.name === ic1Component.name,
  )!
  const theta = (ic1Place.rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)

  // Check each pad sits at the rotated pin position (within 1e-3 mm)
  for (const pad of ic1Pads) {
    const padX = (pad as any).x as number
    const padY = (pad as any).y as number
    const matchingPin = image.pins!.some((pin) => {
      const rotatedX = ic1Place.x + pin.x * cos - pin.y * sin
      const rotatedY = ic1Place.y + pin.x * sin + pin.y * cos
      return (
        Math.abs(padX - rotatedX / 1000) < 1e-3 &&
        Math.abs(padY - rotatedY / 1000) < 1e-3
      )
    })
    expect(matchingPin).toBe(true)
  }
})
