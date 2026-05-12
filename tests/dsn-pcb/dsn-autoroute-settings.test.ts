import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("preserves autoroute settings and layer rules when stringifying dsn json", () => {
  const dsnString = `(pcb "router-output.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
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
      (width 200)
      (clearance 200)
    )
    (autoroute_settings
      (fanout off)
      (autoroute on)
      (postroute on)
      (vias on)
      (via_costs 50)
      (plane_via_costs 5)
      (start_ripup_costs 100)
      (start_pass_no 4)
      (layer_rule F.Cu
        (active on)
        (preferred_direction horizontal)
        (preferred_direction_trace_costs 1.0)
        (against_preferred_direction_trace_costs 2.7)
      )
      (layer_rule B.Cu
        (active on)
        (preferred_direction vertical)
        (preferred_direction_trace_costs 1.0)
        (against_preferred_direction_trace_costs 1.6)
      )
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsnString) as DsnPcb
  const dsnOutput = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(dsnOutput) as DsnPcb

  expect(dsnOutput).toContain("(autoroute_settings")
  expect(reparsedJson.structure.autoroute_settings).toEqual(
    dsnJson.structure.autoroute_settings,
  )
})
