import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const minusPinDsn = `(pcb minus-pin.dsn
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
    (image "PolarizedFootprint"
      (pin Rect[T]Pad_3000x1400_um - -2400 0)
      (pin Rect[T]Pad_3000x1400_um + 2400 0)
    )
    (padstack Rect[T]Pad_3000x1400_um
      (shape (rect F.Cu -1500 -700 1500 700))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

test("preserves bare minus DSN pin labels without confusing negative coordinates", () => {
  const dsnJson = parseDsnToDsnJson(minusPinDsn) as DsnPcb
  const [minusPin, plusPin] = dsnJson.library.images[0].pins

  expect(minusPin).toEqual({
    padstack_name: "Rect[T]Pad_3000x1400_um",
    pin_number: "-",
    x: -2400,
    y: 0,
  })
  expect(plusPin.pin_number).toBe("+")
  expect(plusPin.x).toBe(2400)

  const reparsedJson = parseDsnToDsnJson(stringifyDsnJson(dsnJson)) as DsnPcb
  expect(reparsedJson.library.images[0].pins[0]).toEqual(minusPin)
})
