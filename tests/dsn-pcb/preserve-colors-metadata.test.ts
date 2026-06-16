import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves top-level colors metadata through dsn json round trip", () => {
  const dsn = `
    (pcb "colors board.dsn"
      (parser
        (string_quote ')
        (space_in_quoted_tokens on)
        (host_cad "KiCad")
        (host_version "8.0")
      )
      (resolution um 10)
      (unit um)
      (colors
        (color signal 0 128 255)
        (set_color F.Cu red)
        (set_pattern signal solid)
      )
      (structure
        (layer F.Cu
          (type signal)
          (property
            (index 0)
          )
        )
        (via "Via[0-1]_600:300_um")
        (rule
          (width 150)
        )
      )
      (placement)
      (library)
      (network)
      (wiring)
    )
  `

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.colors).toEqual([
    { kind: "color", values: ["signal", 0, 128, 255] },
    { kind: "set_color", values: ["F.Cu", "red"] },
    { kind: "set_pattern", values: ["signal", "solid"] },
  ])

  const stringifiedDsn = stringifyDsnJson(dsnJson)
  expect(stringifiedDsn).toContain("(colors")
  expect(stringifiedDsn).toContain('(color "signal" 0 128 255)')
  expect(stringifiedDsn).toContain('(set_color "F.Cu" "red")')
  expect(stringifiedDsn).toContain('(set_pattern "signal" "solid")')

  const reparsedDsnJson = parseDsnToDsnJson(stringifiedDsn) as DsnPcb
  expect(reparsedDsnJson.colors).toEqual(dsnJson.colors)
})
