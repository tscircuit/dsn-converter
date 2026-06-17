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

test("parse s-expr with semicolon comments", () => {
  const dsn = `(pcb commented.dsn
    ; exporter metadata can appear between top-level records
    (parser
      (string_quote ")
      (space_in_quoted_tokens on)
      (host_cad "KiCad")
      (host_version "8.0")
    )
    (resolution um 10) ; inline comment after a record
    (unit um)
    (structure
      (layer F.Cu
        (type signal)
        (property
          (index 0)
        )
      )
      ; comment inside a nested form
      (boundary
        (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
      )
      (via "Via[0-1]_600:300_um")
      (rule
        (width 100)
      )
    )
    (placement)
    (library)
    (network)
    (wiring)
  )`

  const pcbJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(pcbJson.filename).toBe("commented.dsn")
  expect(pcbJson.structure.layers[0].name).toBe("F.Cu")
  expect(pcbJson.structure.boundary.path.coordinates).toHaveLength(10)
})

test("parse json to circuit json", async () => {
  const pcb = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(pcb)

  expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
