import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson } from "lib"

test("parses delimiter-bounded leading-plus numeric coordinates", () => {
  const dsnJson = parseDsnToDsnJson(`
    (pcb plus-number.dsn
      (resolution um 10)
      (unit um)
      (structure
        (layer F.Cu (type signal) (property (index 0)))
        (boundary (path pcb 0 +100 +200 +300 +400))
        (via Via)
        (rule (width 100) (clearance 100))
      )
      (placement)
      (library)
      (network
        (net +5V (pins U1-1))
      )
      (wiring
        (wire (path F.Cu 100 +1.5 -2.5 +3 +4) (net +5V) (type route))
      )
    )
  `) as DsnPcb

  expect(dsnJson.structure.boundary.path.coordinates).toEqual([
    100, 200, 300, 400,
  ])
  expect(dsnJson.wiring.wires[0].path?.coordinates).toEqual([1.5, -2.5, 3, 4])
})

test("keeps nonnumeric plus-prefixed symbols intact", () => {
  const dsnJson = parseDsnToDsnJson(`
    (pcb plus-symbol.dsn
      (resolution um 10)
      (unit um)
      (structure
        (layer F.Cu (type signal) (property (index 0)))
        (boundary (path pcb 0 0 0 100 100))
        (via Via)
        (rule (width 100) (clearance 100))
      )
      (placement)
      (library)
      (network
        (net +5V (pins U1-1))
      )
      (wiring
        (wire (path F.Cu 100 0 0 100 100) (net +5V) (type route))
      )
    )
  `) as DsnPcb

  expect(dsnJson.network.nets[0].name).toBe("+5V")
  expect(dsnJson.wiring.wires[0].net).toBe("+5V")
})
