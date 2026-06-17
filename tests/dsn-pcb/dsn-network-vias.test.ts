import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithNetworkVias = `(pcb "network-vias.dsn"
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
      (width 200)
      (clearance 200)
    )
  )
  (placement)
  (library)
  (network
    (via "Via[0-1]_600:300_um" "Via[0-1]_600:300_um" default)
    (via "Via[0-1]_600:300_um-kicad_default" "Via[0-1]_600:300_um" default)
  )
  (wiring)
)`

test("preserve top-level DSN network via definitions", () => {
  const parsed = parseDsnToDsnJson(dsnWithNetworkVias) as DsnPcb

  expect(parsed.network.vias).toEqual([
    {
      name: "Via[0-1]_600:300_um",
      padstack: "Via[0-1]_600:300_um",
      clearance_class: "default",
    },
    {
      name: "Via[0-1]_600:300_um-kicad_default",
      padstack: "Via[0-1]_600:300_um",
      clearance_class: "default",
    },
  ])

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(parsed)) as DsnPcb

  expect(reparsed.network.vias).toEqual(parsed.network.vias)
})
