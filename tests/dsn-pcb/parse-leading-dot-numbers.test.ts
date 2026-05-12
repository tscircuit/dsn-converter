import { expect, test } from "bun:test"
import { type DsnPcb, parseDsnToDsnJson, stringifyDsnJson } from "lib"

test("parses leading-dot decimal DSN path coordinates", () => {
  const dsn = `(pcb leading-dot.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad")
    (host_version "8.0")
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
      (path F.Cu 0.15 .5 1.5 2 .25)
    )
    (via "")
    (rule
      (width 0.15)
    )
  )
  (placement
    (component C0603
      (place C1 0 0 front 0 (PN .1uF))
    )
  )
  (library)
  (network)
  (wiring
    (wire (path F.Cu 0.15 .5 .75 1.25 .25)(net "N1")(type route))
  )
)`

  const parsed = parseDsnToDsnJson(dsn) as DsnPcb

  expect(parsed.structure.boundary.path.coordinates).toEqual([
    0.5, 1.5, 2, 0.25,
  ])
  expect(parsed.wiring.wires[0].path?.coordinates).toEqual([
    0.5, 0.75, 1.25, 0.25,
  ])
  expect(parsed.placement.components[0].places[0].PN).toBe(".1uF")

  const reparsed = parseDsnToDsnJson(stringifyDsnJson(parsed)) as DsnPcb
  expect(reparsed.structure.boundary.path.coordinates).toEqual([
    0.5, 1.5, 2, 0.25,
  ])
  expect(reparsed.wiring.wires[0].path?.coordinates).toEqual([
    0.5, 0.75, 1.25, 0.25,
  ])
  expect(reparsed.placement.components[0].places[0].PN).toBe(".1uF")
})
