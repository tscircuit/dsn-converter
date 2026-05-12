import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const rotatedPinDsn = `(pcb rotated-pin.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "test")
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
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (image "RotatedFootprint"
      (pin Oval[A]Pad_1000x500_um (rotate 270) 4 3810 -1250)
      (pin Round[A]Pad_1000_um 1 0 0)
    )
    (padstack Oval[A]Pad_1000x500_um
      (shape (circle F.Cu 1000))
      (attach off)
    )
    (padstack Round[A]Pad_1000_um
      (shape (circle F.Cu 1000))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

test("preserves DSN image pin rotation through stringify round trip", () => {
  const dsnJson = parseDsnToDsnJson(rotatedPinDsn) as DsnPcb
  const rotatedPin = dsnJson.library.images[0].pins[0]

  expect(rotatedPin).toEqual({
    padstack_name: "Oval[A]Pad_1000x500_um",
    pin_number: 4,
    rotation: 270,
    x: 3810,
    y: -1250,
  })

  const dsnString = stringifyDsnJson(dsnJson)
  expect(dsnString).toContain(
    "(pin Oval[A]Pad_1000x500_um (rotate 270) 4 3810 -1250)",
  )

  const reparsedJson = parseDsnToDsnJson(dsnString) as DsnPcb
  expect(reparsedJson.library.images[0].pins[0]).toEqual(rotatedPin)
})
