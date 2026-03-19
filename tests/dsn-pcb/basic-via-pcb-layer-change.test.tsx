import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { su } from "@tscircuit/soup-util"
import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  type DsnPcb,
  convertCircuitJsonToDsnString,
  convertDsnPcbToCircuitJson,
  parseDsnToDsnJson,
} from "lib"
import looksSame from "looks-same"
import { getTestDebugUtils } from "tests/fixtures/get-test-debug-utils"

test("basic-via-pcb-layer-change", async () => {
  const { writeDebugFile, getDebugFilePath } = getTestDebugUtils(
    import.meta.path,
  )

  const circuit = new Circuit()

  circuit.add(
    <board width="6mm" height="6mm">
      <resistor name="R1" footprint="0402" resistance="1k" pcbX={-2} />
      <resistor
        name="R2"
        footprint="0402"
        resistance="1k"
        layer="bottom"
        pcbX={2}
        pcbRotation="90deg"
      />
      <trace from=".R1 .pin1" to=".R2 .pin1" />
    </board>,
  )

  const circuitJsonBefore =
    (await circuit.getCircuitJson()) as AnyCircuitElement[]

  const dsnFile = convertCircuitJsonToDsnString(circuitJsonBefore)

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb

  // console.log("DSN JSON\n--------\n", dsnJson)

  const circuitJsonAfter = convertDsnPcbToCircuitJson(dsnJson)

  const svgBefore = convertCircuitJsonToPcbSvg(circuitJsonBefore)
  const svgAfter = convertCircuitJsonToPcbSvg(circuitJsonAfter)

  writeDebugFile("circuit.before.svg", svgBefore)
  writeDebugFile("circuit.before.json", JSON.stringify(circuitJsonBefore))

  writeDebugFile("circuit.after.svg", svgAfter)
  writeDebugFile("circuit.after.json", JSON.stringify(circuitJsonAfter))

  const looksSameResult = await looksSame(
    getDebugFilePath("circuit.before.svg"),
    getDebugFilePath("circuit.after.svg"),
  )

  const beforeSmtPads = su(circuitJsonBefore).pcb_smtpad.list()
  const afterSmtPads = su(circuitJsonAfter).pcb_smtpad.list()

  // console.log("BEFORE\n-------\n", beforeSmtPads)
  // console.log("AFTER\n-------\n", afterSmtPads)

  expect(
    afterSmtPads.map((p) => p.layer).filter((l) => l === "bottom"),
  ).toHaveLength(
    beforeSmtPads.map((p) => p.layer).filter((l) => l === "bottom").length,
  )

  //
  // expect(looksSameResult.equal).toBe(true)
})
