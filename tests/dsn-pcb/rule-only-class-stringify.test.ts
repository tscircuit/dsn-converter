import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("stringifies rule-only network classes without requiring circuit metadata", () => {
  const dsn = `(pcb rule-only-class.dsn
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
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 150)
      (clearance 75)
    )
  )
  (placement)
  (library)
  (network
    (net "N1"
      (pins U1-1)
    )
    (class "rule_only" "" "N1"
      (rule
        (width 150)
        (clearance 75)
      )
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb
  const dsnString = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb

  expect(dsnString).not.toContain("use_via")
  expect(reparsedJson.network.classes[0].name).toBe("rule_only")
  expect(reparsedJson.network.classes[0].rule.width).toBe(150)
})
