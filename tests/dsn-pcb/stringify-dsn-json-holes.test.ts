import { expect, test } from "bun:test"
import { parseDsnToDsnJson, stringifyDsnJson, type DsnPcb } from "lib"

const dsnWithHoles = `(pcb test.dsn
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "KiCad's Pcbnew")
    (host_version "1.0")
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
    (via via)
    (rule
      (width 10)
      (clearance 10)
    )
  )
  (placement
  )
  (library
    (padstack "circ-hole"
      (shape (circle F.Cu 1000))
      (shape (circle B.Cu 1000))
      (attach off)
      (hole (circle 500))
    )
    (padstack "oval-hole"
      (shape (circle F.Cu 1200))
      (shape (circle B.Cu 1200))
      (attach off)
      (hole (oval 400 800))
    )
    (padstack "square-hole"
      (shape (circle F.Cu 800))
      (shape (circle B.Cu 800))
      (attach off)
      (hole (square 600))
    )
    (padstack "no-hole"
      (shape (circle F.Cu 600))
      (attach off)
    )
  )
  (network
  )
  (wiring
  )
)
`

test("stringify-dsn-json with holes", () => {
  const dsnJson = parseDsnToDsnJson(dsnWithHoles) as DsnPcb
  const stringified = stringifyDsnJson(dsnJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnPcb

  const padstacks = reparsed.library.padstacks

  expect(padstacks).toHaveLength(4)

  // Circle hole
  const ps1 = padstacks.find((p) => p.name === "circ-hole")!
  expect(ps1).toBeDefined()
  expect(ps1.hole?.shape).toBe("circle")
  expect(ps1.hole?.diameter).toBe(500)
  expect(ps1.hole?.width).toBeUndefined()
  expect(ps1.hole?.height).toBeUndefined()

  // Oval hole
  const ps2 = padstacks.find((p) => p.name === "oval-hole")!
  expect(ps2).toBeDefined()
  expect(ps2.hole?.shape).toBe("oval")
  expect(ps2.hole?.width).toBe(400)
  expect(ps2.hole?.height).toBe(800)
  expect(ps2.hole?.diameter).toBeUndefined()

  // Square hole
  const ps3 = padstacks.find((p) => p.name === "square-hole")!
  expect(ps3).toBeDefined()
  expect(ps3.hole?.shape).toBe("square")
  expect(ps3.hole?.width).toBe(600)
  expect(ps3.hole?.diameter).toBeUndefined()
  expect(ps3.hole?.height).toBeUndefined()

  // No hole
  const ps4 = padstacks.find((p) => p.name === "no-hole")!
  expect(ps4).toBeDefined()
  expect(ps4.hole).toBeUndefined()

  // Full structural equality
  expect(dsnJson.library.padstacks).toEqual(reparsed.library.padstacks)
})
