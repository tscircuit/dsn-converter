import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"

test("parses DSN pin identifiers with transforms, dashes, and quoted suffixes", () => {
  const dsn = `
    (pcb test-board
      (library
        (image TESTPKG
          (pin Rect[T]Pad_1600x1400_um (rotate 90) A 1400 0)
          (pin Rect[T]Pad_3800x1400_um - -3000 0)
          (pin RoundRect[T]Pad_2200x3700_1104.19_um 2@1 0 940)
        )
      )
      (network
        (net AGND
          (pins C1-- IC11-2@1 RJ1-"RD-")
        )
      )
    )
  `

  const dsnJson = parseDsnToDsnJson(dsn) as DsnPcb

  expect(dsnJson.library.images[0].pins.map((pin) => pin.pin_number)).toEqual([
    "A",
    "-",
    "2@1",
  ])
  expect(dsnJson.network.nets[0].pins).toEqual(["C1--", "IC11-2@1", "RJ1-RD-"])
})
