import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const dsnWithQuotedNumericPin = `(pcb "quoted-pin.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "9.0")
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
      (path F.Cu 0 0 0 1000 0 1000 1000 0 1000)
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement
    (component U
      (place U1 0 0 front 0)
    )
  )
  (library
    (image U
      (pin Rect[T]Pad_1000x1000_um "01" 0 0)
    )
    (padstack Rect[T]Pad_1000x1000_um
      (shape (rect F.Cu -500 -500 500 500))
      (attach off)
    )
  )
  (network
    (net N1
      (pins U1-"01")
    )
    (class default default N1
      (circuit
        (use_via "Via[0-1]_600:300_um")
      )
      (rule
        (width 100)
        (clearance 100)
      )
    )
  )
  (wiring)
)`

test("preserves quoted numeric image pin labels", () => {
  const parsed = parseDsnToDsnJson(dsnWithQuotedNumericPin) as DsnPcb

  expect(parsed.library.images[0].pins[0].pin_number).toBe("01")

  const stringified = stringifyDsnJson(parsed)
  expect(stringified).toContain('(pin Rect[T]Pad_1000x1000_um "01" 0 0)')

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.images[0].pins[0].pin_number).toBe("01")
})
