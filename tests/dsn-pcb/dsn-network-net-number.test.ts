import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithNetNumber = `(pcb "network-net-number.dsn"
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
    (net "Net-(R1-Pad1)" 7
      (pins
        C1-1
        R1-1
      )
    )
  )
  (wiring)
)`

test("preserve optional DSN network net numbers", () => {
  const parsed = parseDsnToDsnJson(dsnWithNetNumber) as DsnPcb

  expect(parsed.network.nets).toEqual([
    {
      name: "Net-(R1-Pad1)",
      net_number: 7,
      pins: ["C1-1", "R1-1"],
    },
  ])

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(parsed)) as DsnPcb

  expect(reparsed.network.nets).toEqual(parsed.network.nets)
})
