import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"

test("parses DSN component placement coordinates when rotation is omitted", () => {
  const dsn = `
    (pcb rotationless-placement
      (parser
        (string_quote ")
        (space_in_quoted_tokens on)
        (host_cad "fixture")
        (host_version "1")
      )
      (resolution um 10)
      (structure
        (layer F.Cu (type signal))
        (layer B.Cu (type signal))
        (boundary (path pcb 0 0 0 10000 0 10000 10000 0 10000 0 0))
      )
      (placement
        (component R_0603
          (place R1 1234 -5678 front)
        )
      )
      (library
        (image R_0603
          (pin Round[T]Pad_1000_1000_um 1 0 0)
        )
        (padstack Round[T]Pad_1000_1000_um
          (shape (circle F.Cu 1000))
          (attach off)
        )
      )
      (network
        (net N1 (pins R1-1))
      )
      (wiring)
    )
  `

  const parsed = parseDsnToDsnJson(dsn) as DsnPcb
  const place = parsed.placement.components[0].places[0]

  expect(place.x).toBe(1234)
  expect(place.y).toBe(-5678)
  expect(place.side).toBe("front")
  expect(place.rotation).toBe(0)
})
