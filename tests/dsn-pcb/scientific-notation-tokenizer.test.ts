import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"
import {
  type DsnPcb,
  convertDsnJsonToCircuitJson,
  parseDsnToDsnJson,
} from "lib"

test("tokenizes scientific-notation numbers as a single Number token", () => {
  expect(tokenizeDsn("(a 1.505e5 b)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "a" },
    { type: "Number", value: 150500 },
    { type: "Symbol", value: "b" },
    { type: "RParen" },
  ])

  expect(tokenizeDsn("(coords 1e5 -1.5E-3 2.5e+3)")).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "coords" },
    { type: "Number", value: 100000 },
    { type: "Number", value: -0.0015 },
    { type: "Number", value: 2500 },
    { type: "RParen" },
  ])
})

test("preserves wire path coordinates containing scientific-notation numbers", () => {
  const dsn = `(pcb "test.dsn"
    (resolution um 10)
    (unit um)
    (structure
      (layer F.Cu (type signal) (property (index 0)))
      (layer B.Cu (type signal) (property (index 1)))
      (boundary (path pcb 0 0 0 200000 0 200000 -200000 0 -200000 0 0))
    )
    (placement)
    (library)
    (network
      (net "N1" (pins))
    )
    (wiring
      (wire (path F.Cu 200 1.505e5 -105000 154540 -105000)(net "N1")(type route))
    )
  )`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  expect(dsnJson.wiring.wires[0]?.path?.coordinates).toEqual([
    150500, -105000, 154540, -105000,
  ])

  const circuitJson = convertDsnJsonToCircuitJson(dsnJson)
  const pcbTrace = circuitJson.find((el) => el.type === "pcb_trace")
  expect(pcbTrace).toBeDefined()
  if (pcbTrace && pcbTrace.type === "pcb_trace") {
    expect(pcbTrace.route[0]).toMatchObject({
      route_type: "wire",
      x: 150.5,
      y: -105,
    })
    expect(pcbTrace.route[1]).toMatchObject({
      route_type: "wire",
      x: 154.54,
      y: -105,
    })
  }
})
