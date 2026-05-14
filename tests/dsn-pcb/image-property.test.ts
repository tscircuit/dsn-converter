import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithImageProperties = `(pcb image-property.dsn
  (parser
    (string_quote "'")
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
    (via "")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (image "U1-footprint"
      (property
        (source_library "Connector.pretty")
        (pin_count 8)
      )
    )
  )
  (network)
  (wiring)
)`

test("preserves library image property metadata", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithImageProperties) as DsnPcb

  expect(dsnJson.library.images[0].properties).toEqual([
    { name: "source_library", value: "Connector.pretty" },
    { name: "pin_count", value: 8 },
  ])

  const dsnString = stringifyDsnJson(dsnJson)

  expect(dsnString).toContain('(source_library "Connector.pretty")')
  expect(dsnString).toContain("(pin_count 8)")
})
