import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("library default via metadata survives DSN JSON stringify round trip", () => {
  const dsnFile = `
    (pcb library-default.dsn
      (parser
        (string_quote ")
        (space_in_quoted_tokens on)
        (host_cad "KiCad's Pcbnew")
        (host_version "")
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
        (layer B.Cu
          (type signal)
          (property
            (index 1)
          )
        )
        (boundary
          (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
        )
        (via "Via[0-1]_600:300_um")
        (rule
          (width 150)
          (clearance 150)
        )
      )
      (placement)
      (library
        default "Via[0-1]_600:300_um"
      )
      (network)
      (wiring)
    )
  `

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnJson.library.default_via).toBe("Via[0-1]_600:300_um")
  expect(dsnString).toContain('default "Via[0-1]_600:300_um"')
  expect(reparsedJson.library.default_via).toBe("Via[0-1]_600:300_um")
})
