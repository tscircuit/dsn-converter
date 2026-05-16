import { expect, test } from "bun:test"
import {
  type DsnPcb,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
import type { AnyCircuitElement } from "circuit-json"

// @ts-ignore
import smoothieDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

const hasNaN = (value: unknown): boolean => {
  if (typeof value === "number") return Number.isNaN(value)
  if (Array.isArray(value)) return value.some(hasNaN)
  if (value && typeof value === "object") {
    return Object.values(value).some(hasNaN)
  }
  return false
}

const getPrimaryId = (element: AnyCircuitElement): string | undefined => {
  const key = `${element.type}_id` as keyof AnyCircuitElement
  const id = element[key]
  return typeof id === "string" ? id : undefined
}

test("issue #54: smoothie board produces complete valid circuit json", () => {
  const dsnJson = parseDsnToDsnJson(smoothieDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  const sourceComponents = circuitJson.filter(
    (element) => element.type === "source_component",
  )
  const pcbComponents = circuitJson.filter(
    (element) => element.type === "pcb_component",
  )
  const smtPads = circuitJson.filter((element) => element.type === "pcb_smtpad")

  expect(sourceComponents.length).toBeGreaterThan(0)
  expect(pcbComponents.length).toBe(sourceComponents.length)
  expect(smtPads.length).toBeGreaterThan(0)

  const elementsWithNaN = circuitJson.filter((element) => hasNaN(element))
  expect(elementsWithNaN).toHaveLength(0)

  const primaryIds = circuitJson
    .map(getPrimaryId)
    .filter((id): id is string => Boolean(id))
  expect(new Set(primaryIds).size).toBe(primaryIds.length)
})
