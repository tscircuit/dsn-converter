import { expect, test } from "bun:test"
import { parseDsnToDsnJson, stringifyDsnJson } from "lib"
import type { DsnPcb } from "lib"
import { readFileSync } from "fs"
import { join } from "path"

test("parse autoroute_settings from DSN", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "autoroute-test.dsn"
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
      (property (index 0))
    )
    (layer B.Cu
      (type signal)
      (property (index 1))
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
})

test("stringify and round-trip autoroute_settings", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "autoroute-roundtrip.dsn"
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
      (property (index 0))
    )
    (layer B.Cu
      (type signal)
      (property (index 1))
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
      (start_ripup_costs 100)
      (start_pass_no 4)
      (layer_rule F.Cu
        (active on)
        (preferred_direction horizontal)
        (preferred_direction_trace_costs 1.0)
        (against_preferred_direction_trace_costs 2.7)
      )
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.structure.autoroute_settings).toEqual(
    dsnJson.structure.autoroute_settings,
  )
})

test("parse plane from DSN structure", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "plane-test.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top
      (type signal)
      (property (index 0))
    )
    (layer Bottom
      (type signal)
      (property (index 1))
    )
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (plane AGND (polygon Route2 0 214249 -158877 82677 -159512 82550 -50673 214376 -50673 214249 -158877))
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  expect(dsnJson.structure.planes).toEqual([
    {
      name: "AGND",
      polygon: {
        layer: "Route2",
        width: 0,
        coordinates: [
          214249, -158877, 82677, -159512, 82550, -50673, 214376,
          -50673, 214249, -158877,
        ],
      },
    },
  ])
})

test("stringify and round-trip plane", () => {
  const dsnJson = parseDsnToDsnJson(`(pcb "plane-roundtrip.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "(5.1.9)-1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top
      (type signal)
      (property (index 0))
    )
    (layer Bottom
      (type signal)
      (property (index 1))
    )
    (boundary
      (path pcb 0 0 0 1000 0 1000 1000 0 1000 0 0)
    )
    (plane AGND (polygon Route2 0 214249 -158877 82677 -159512 82550 -50673 214376 -50673 214249 -158877))
    (via "Via[0-1]_600:300_um")
    (rule
      (width 200)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network)
  (wiring)
)`) as DsnPcb

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb

  expect(reparsedJson.structure.planes).toEqual(
    dsnJson.structure.planes,
  )
})

test("smoothie board DSN round-trip preserves all structure fields", () => {
  const dsnContent = readFileSync(
    join(__dirname, "../assets/repro/smoothieboard-repro.dsn"),
    "utf-8",
  )

  const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb
  const stringified = stringifyDsnJson(dsnJson)
  const reparsedJson = parseDsnToDsnJson(stringified) as DsnPcb

  // Verify plane is preserved in round-trip
  expect(reparsedJson.structure.planes).toEqual(dsnJson.structure.planes)

  // Verify all other structure fields are preserved
  expect(reparsedJson.structure.layers).toEqual(dsnJson.structure.layers)
  expect(reparsedJson.structure.boundary).toEqual(dsnJson.structure.boundary)
  expect(reparsedJson.structure.via).toEqual(dsnJson.structure.via)
  expect(reparsedJson.structure.rule).toEqual(dsnJson.structure.rule)

  // Verify the plane was parsed correctly
  expect(dsnJson.structure.planes).toBeDefined()
  expect(dsnJson.structure.planes!.length).toBe(1)
  expect(dsnJson.structure.planes![0].name).toBe("AGND")
  expect(dsnJson.structure.planes![0].polygon.layer).toBe("Route2")
})
