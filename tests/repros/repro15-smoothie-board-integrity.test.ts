import { expect, test } from "bun:test"
import { convertDsnPcbToCircuitJson, parseDsnToDsnJson, type DsnPcb } from "lib"

// @ts-ignore
import dsnFile from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("smoothie board: no NaN in element IDs", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const nanElements = circuitJson.filter((el: any) => {
    const id =
      el.pcb_smtpad_id ||
      el.pcb_via_id ||
      el.source_port_id ||
      el.pcb_port_id ||
      ""
    return id.includes("NaN")
  })

  expect(nanElements.length).toBe(0)
})

test("smoothie board: unique pcb_smtpad IDs", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const smtpads = circuitJson.filter((el: any) => el.type === "pcb_smtpad")
  const ids = smtpads.map((el: any) => el.pcb_smtpad_id)
  const uniqueIds = new Set(ids)

  expect(uniqueIds.size).toBe(ids.length)
})

test("smoothie board: unique pcb_via IDs", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const vias = circuitJson.filter((el: any) => el.type === "pcb_via")
  const ids = vias.map((el: any) => el.pcb_via_id)
  const uniqueIds = new Set(ids)

  expect(uniqueIds.size).toBe(ids.length)
})

test("smoothie board: no null pin_number in source_ports", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourcePorts = circuitJson.filter((el: any) => el.type === "source_port")
  const nullPins = sourcePorts.filter(
    (el: any) => el.pin_number === null || Number.isNaN(el.pin_number),
  )

  expect(nullPins.length).toBe(0)
})

test("smoothie board: rotated component pins positioned correctly", () => {
  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  // IC1 (LQFP100) is at (136436, -112306) with rotation 315
  // With 100 pins, each should be at a unique position
  const ic1Pads = circuitJson.filter(
    (el: any) =>
      el.type === "pcb_smtpad" && el.pcb_component_id?.includes("IC1"),
  )

  // Check that rotated pads are at distinct positions
  const positions = ic1Pads.map(
    (el: any) => `${el.x.toFixed(2)},${el.y.toFixed(2)}`,
  )
  const uniquePositions = new Set(positions)

  // All pads should be at unique positions
  expect(uniquePositions.size).toBe(positions.length)
})
