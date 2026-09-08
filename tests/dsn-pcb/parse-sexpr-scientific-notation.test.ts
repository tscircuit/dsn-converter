import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"
import { parseDsnToDsnJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"
import { convertDsnJsonToCircuitJson } from "lib/dsn-pcb/dsn-json-to-circuit-json/convert-dsn-json-to-circuit-json"
import type { DsnPcb } from "lib/dsn-pcb/types"

test("tokenizes scientific-notation numbers as a single Number token", () => {
  expect(tokenizeDsn("(a 1.505e5 b)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "a" },
    { type: "Number", value: 150500 },
    { type: "Symbol", value: "b" },
    { type: "RParen" },
  ])

  expect(tokenizeDsn("(a 1E-3 b)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "a" },
    { type: "Number", value: 0.001 },
    { type: "Symbol", value: "b" },
    { type: "RParen" },
  ])

  expect(tokenizeDsn("(a 2.5e+3 b)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "a" },
    { type: "Number", value: 2500 },
    { type: "Symbol", value: "b" },
    { type: "RParen" },
  ])
})

test("an exponent-like symbol with no trailing digits still falls back to a symbol", () => {
  // "5e" has no digits after the "e", so only "5" is a number and "e" is a
  // separate symbol token (matches pre-existing behavior for non-numeric text).
  expect(tokenizeDsn("(a 5e b)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "a" },
    { type: "Number", value: 5 },
    { type: "Symbol", value: "e" },
    { type: "Symbol", value: "b" },
    { type: "RParen" },
  ])
})

const baseDsn = `(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "8.0.3")
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
      (path pcb 0  0 0  1000 0  1000 1000  0 1000  0 0)
    )
    (via "")
    (rule
      (width 200)
    )
  )
  (placement
  )
  (library
  )
  (network
  )
  (wiring
    (wire (path F.Cu 200  1.505e5 -105000  154540 -105000)(net "N1")(type route))
  )
)
`

test("scientific-notation coordinates in a wire path are not silently corrupted", () => {
  const dsnJson = parseDsnToDsnJson(baseDsn) as DsnPcb
  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)

  const trace = circuitJson.find((el: any) => el.type === "pcb_trace") as any
  expect(trace).toBeDefined()

  // 1.505e5 um == 150500 um == 150.5 mm. Before the fix, the exponent suffix
  // desynced the coordinate stream and produced x = 0.0015 instead.
  expect(trace.route[0].x).toBeCloseTo(150.5, 6)
  expect(trace.route[0].y).toBeCloseTo(-105, 6)
  expect(trace.route[1].x).toBeCloseTo(154.54, 6)
})
