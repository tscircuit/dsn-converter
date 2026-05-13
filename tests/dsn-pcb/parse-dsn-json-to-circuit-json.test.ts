// @ts-ignore
import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

// @ts-ignore

test("parse s-expr to json", async () => {
  const pcbJson = parseDsnToDsnJson(testDsnFile)
  expect(pcbJson).toBeTruthy()
})

test("parse uppercase PCB root", async () => {
  const lowerRootPcb = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const upperRootDsn = testDsnFile.replace(/^\(pcb\b/, "(PCB")
  const upperRootPcb = parseDsnToDsnJson(upperRootDsn) as DsnPcb

  expect(upperRootPcb.is_dsn_pcb).toBe(true)
  expect(upperRootPcb.filename).toBe(lowerRootPcb.filename)
  expect(upperRootPcb.structure.layers.length).toBe(
    lowerRootPcb.structure.layers.length,
  )
  expect(upperRootPcb.library.images.length).toBe(
    lowerRootPcb.library.images.length,
  )
})

test("parse json to circuit json", async () => {
  const pcb = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(pcb)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
