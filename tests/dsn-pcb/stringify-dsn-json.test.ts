import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"
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

test("preserves autoroute settings switches and layer rules", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "autoroute-settings.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(8.0.0)")
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
      (path pcb 0  0 0  1000 0  1000 1000  0 1000  0 0)
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
)`) as DsnPcb

  expect(dsnJson.structure.autoroute_settings).toEqual({
    fanout: "off",
    autoroute: "on",
    postroute: "on",
    vias: "on",
    start_ripup_costs: 100,
    start_pass_no: 4,
    layer_rules: [
      {
        layer: "F.Cu",
        active: "on",
        preferred_direction: "horizontal",
        preferred_direction_trace_costs: 1,
        against_preferred_direction_trace_costs: 2.7,
      },
      {
        layer: "B.Cu",
        active: "on",
        preferred_direction: "vertical",
        preferred_direction_trace_costs: 1,
        against_preferred_direction_trace_costs: 1.6,
      },
    ],
  })

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.structure.autoroute_settings).toEqual(
    dsnJson.structure.autoroute_settings,
  )
})
