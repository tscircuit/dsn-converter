import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const imageUnitDsn = `(pcb image_unit_test
  (parser
    (space_in_quoted_tokens on)
    (host_cad "unit test")
    (host_version "1")
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
    (via Via)
    (rule
      (width 100)
      (clearance 100)
    )
  )
  (placement)
  (library
    (image U1
      (unit mil)
      (pin PAD 1 0 0)
    )
    (padstack PAD
      (shape (circle F.Cu 10))
      (attach off)
    )
  )
  (network)
  (wiring)
)`

test("preserves image-level unit descriptors", () => {
  const parsed = parseDsnToDsnJson(imageUnitDsn) as DsnPcb

  expect(parsed.library.images[0].unit).toBe("mil")

  const stringified = stringifyDsnJson(parsed)
  expect(stringified).toContain("(unit mil)")

  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb
  expect(reparsed.library.images[0].unit).toBe("mil")
})
