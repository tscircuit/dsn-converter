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

test("parse placement with coordinates but no side or rotation", () => {
  const dsn = `(pcb minimal-place.dsn
    (parser
      (string_quote ")
      (space_in_quoted_tokens on)
      (host_cad "KiCad")
      (host_version "8.0")
    )
    (resolution um 10)
    (unit um)
    (structure
      (layer F.Cu
        (type signal)
        (property
          (index 0)
        )
      )
      (boundary
        (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
      )
      (via "Via[0-1]_600:300_um")
      (rule
        (width 100)
      )
    )
    (placement
      (component U_LIB
        (place U1 125 250)
      )
    )
    (library)
    (network)
    (wiring)
  )`

  const pcbJson = parseDsnToDsnJson(dsn) as DsnPcb
  const place = pcbJson.placement.components[0].places[0]

  expect(place.x).toBe(125)
  expect(place.y).toBe(250)
  expect(place.side).toBe("front")
  expect(place.rotation).toBe(0)
})

test("parse json to circuit json", async () => {
  const pcb = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(pcb)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
