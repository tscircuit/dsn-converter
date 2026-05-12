// @ts-ignore
import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { type DsnPcb, parseDsnToDsnJson } from "lib"
import { convertDsnJsonToCircuitJson } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json.ts"
// @ts-ignore
import freeroutingDsnFile from "../assets/testkicadproject/freeroutingTraceAdded-2.dsn" with {
  type: "text",
}
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

// @ts-ignore

test("parse s-expr to json", async () => {
  const pcbJson = parseDsnToDsnJson(testDsnFile)
  expect(pcbJson).toBeTruthy()
})

test("parse json to circuit json", async () => {
  const pcb = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(pcb)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})

test("parse network classes without descriptions", async () => {
  const pcb = parseDsnToDsnJson(freeroutingDsnFile) as DsnPcb

  expect(pcb.network.classes[0].name).toBe("default")
  expect(pcb.network.classes[0].description).toBe("")

  expect(pcb.network.classes[1].name).toBe("kicad_default")
  expect(pcb.network.classes[1].description).toBe("")
  expect(pcb.network.classes[1].net_names[0]).toBe("Net-(R1-Pad1)")
})

test("parse descriptionless network classes before net declarations", async () => {
  const pcb = parseDsnToDsnJson(`(pcb test
    (network
      (class kicad_default N1 (rule (width 1)))
      (net N1 (pins U1-1))
    )
  )`) as DsnPcb

  expect(pcb.network.classes[0].name).toBe("kicad_default")
  expect(pcb.network.classes[0].description).toBe("")
  expect(pcb.network.classes[0].net_names).toEqual(["N1"])
})
