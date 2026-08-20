import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

const minimalDsn = `(pcb "test.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "TestCAD")
    (host_version "1.0")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top
      (type signal)
      (property
        (index 0)
      )
    )
    (layer Bottom
      (type signal)
      (property
        (index 1)
      )
    )
    (via "Via[0-1]_600:300_um")
    (rule
      (width 250)
      (clearance 200.1)
    )
  )
  (placement)
  (library
    (padstack "Via[0-1]_600:300_um"
      (shape (circle Top 600))
      (shape (circle Bottom 600))
      (attach off)
    )
  )
  (network
    (net "GND"
      (pins)
    )
    (class "kicad_default" "Default class" "GND"
      (rule
        (width 250)
        (clearance 200.1)
      )
    )
  )
  (wiring)
)
`

test("class without circuit block does not crash stringifyDsnJson", () => {
  const dsnJson = parseDsnToDsnJson(minimalDsn) as DsnPcb

  expect(dsnJson.network.classes[0].circuit).toBeUndefined()

  const str = stringifyDsnJson(dsnJson)
  expect(str).toContain("(class")
  expect(str).not.toContain("(circuit")

  const reparsed = parseDsnToDsnJson(str) as DsnPcb
  expect(reparsed.network.classes[0].name).toBe("kicad_default")
})
