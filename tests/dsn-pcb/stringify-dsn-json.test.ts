import { expect, test } from "bun:test"
import {
  type DsnPcb,
  type DsnSession,
  parseDsnToDsnJson,
  stringifyDsnJson,
  stringifyDsnSession,
} from "lib"
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
}

test("stringify dsn json", () => {
  const dsnJson = parseDsnToDsnJson(testDsnFile) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  for (const key of Object.keys(reparsedJson) as Array<keyof DsnPcb>) {
    expect(reparsedJson[key]).toEqual(dsnJson[key] as any)
  }

  // Test that we can parse the generated string back to the same structure
  // expect(reparsedJson).toEqual(dsnJson)
})

test("preserves omitted padstack attach in pcb round trips", () => {
  const dsnFile = `(pcb attach-test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "test")
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
      (path F.Cu 0 0 0 1000 1000)
    )
    (via Via)
    (rule
      (width 100)
    )
  )
  (placement)
  (library
    (padstack NoAttach
      (shape (circle F.Cu 100))
    )
    (padstack ExplicitAttach
      (shape (circle F.Cu 100))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  expect(dsnJson.library.padstacks[0].attach).toBeUndefined()
  expect(dsnJson.library.padstacks[1].attach).toBe("off")

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString.match(/\(attach/g)).toHaveLength(1)

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.library.padstacks[0].attach).toBeUndefined()
  expect(reparsedJson.library.padstacks[1].attach).toBe("off")
})

test("preserves omitted padstack attach in session round trips", () => {
  const session: DsnSession = {
    is_dsn_session: true,
    filename: "attach-test",
    placement: {
      resolution: { unit: "um", value: 10 },
      components: [],
    },
    routes: {
      resolution: { unit: "um", value: 10 },
      parser: {
        string_quote: "",
        host_cad: "Freerouting",
        host_version: "test",
        space_in_quoted_tokens: "",
      },
      library_out: {
        images: [],
        padstacks: [
          {
            name: "NoAttach",
            shapes: [{ shapeType: "circle", layer: "F.Cu", diameter: 100 }],
          },
          {
            name: "ExplicitAttach",
            shapes: [{ shapeType: "circle", layer: "F.Cu", diameter: 100 }],
            attach: "off",
          },
        ],
      },
      network_out: {
        nets: [],
      },
    },
  }

  const sessionString = stringifyDsnSession(session)
  expect(sessionString.match(/\(attach/g)).toHaveLength(1)

  const reparsedSession = parseDsnToDsnJson(sessionString) as DsnSession
  expect(
    reparsedSession.routes.library_out?.padstacks[0].attach,
  ).toBeUndefined()
  expect(reparsedSession.routes.library_out?.padstacks[1].attach).toBe("off")
})
