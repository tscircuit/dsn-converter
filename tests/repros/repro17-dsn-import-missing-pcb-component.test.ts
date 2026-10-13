import { expect, test } from "bun:test"
import { su } from "@tscircuit/soup-util"
import {
  type DsnPcb,
  convertCircuitJsonToDsnJson,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

// @ts-ignore
import smoothieboardDsn from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("dsn import emits pcb_component elements (round trip no longer crashes)", () => {
  const dsnJson = parseDsnToDsnJson(smoothieboardDsn) as DsnPcb
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson) as any[]

  const sourceComponents = su(circuitJson).source_component.list()
  const pcbComponents = su(circuitJson).pcb_component.list()

  // every placed component gets a pcb_component with matching source id
  expect(pcbComponents.length).toBe(sourceComponents.length)
  expect(pcbComponents.length).toBeGreaterThan(0)
  for (const pcbComponent of pcbComponents) {
    expect(Number.isFinite(pcbComponent.center.x)).toBe(true)
    expect(Number.isFinite(pcbComponent.center.y)).toBe(true)
    expect(
      sourceComponents.some(
        (sc: any) =>
          sc.source_component_id === pcbComponent.source_component_id,
      ),
    ).toBe(true)
  }

  // converting back to DSN must not throw (previously crashed with
  // "undefined is not an object (evaluating 'pcbComponent.center')")
  const backToDsn = convertCircuitJsonToDsnJson(circuitJson as any)
  expect(backToDsn.placement.components.length).toBeGreaterThan(0)
})
