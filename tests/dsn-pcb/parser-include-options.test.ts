import { expect, test } from "bun:test"
import { stringifyDsnJson } from "lib/dsn-pcb/circuit-json-to-dsn-json/stringify-dsn-json"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("preserves parser route and wire include options", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb board
  (parser
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
    (routes_include testpoint guides image_conductor)
    (wires_include testpoint)
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer F.Cu
      (type signal)
      (property (index 0))
    )
    (boundary
      (path pcb 0 0 0 100 0 100 100 0 100 0 0)
    )
    (via Via)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.parser.routes_include).toEqual([
    "testpoint",
    "guides",
    "image_conductor",
  ])
  expect(dsnJson.parser.wires_include).toEqual(["testpoint"])

  const stringified = stringifyDsnJson(dsnJson)
  expect(stringified).toContain(
    "(routes_include testpoint guides image_conductor)",
  )
  expect(stringified).toContain("(wires_include testpoint)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.parser.routes_include).toEqual([
    "testpoint",
    "guides",
    "image_conductor",
  ])
  expect(reparsed.parser.wires_include).toEqual(["testpoint"])
})
