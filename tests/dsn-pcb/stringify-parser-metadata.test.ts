import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("stringify DSN JSON preserves parser metadata fields", () => {
  const dsnFile = `
    (pcb parser-metadata.dsn
      (parser
        (string_quote ')
        (space_in_quoted_tokens off)
        (host_cad "Allegro PCB Designer")
        (host_version "17.4")
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
      (library)
      (network)
      (wiring)
    )
  `

  const dsnJson = parseDsnToDsnJson(dsnFile) as DsnPcb
  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.parser.string_quote).toBe("'")
  expect(reparsedJson.parser.space_in_quoted_tokens).toBe("off")
  expect(reparsedJson.parser.host_cad).toBe("Allegro PCB Designer")
})
