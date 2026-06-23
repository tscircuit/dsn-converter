import { expect, test } from "bun:test"
import { parseDsnToDsnJson, stringifyDsnSession, type DsnSession } from "lib"

const sessionDsn = `(session test.dsn
  (base_design test.dsn)
  (placement
    (resolution um 10)
  )
  (was_is
  )
  (routes 
    (resolution um 10)
    (parser
      (host_cad "test")
      (host_version "1.0")
    )
    (library_out 
      (image "test_image"
        (outline (path signal 1 0 0 10 10))
        (pin padstack1 1 0 0)
      )
      (padstack "padstack1"
        (shape (polygon signal 10 0 0 10 0 10 10 0 10))
        (attach off)
        (hole (circle 5))
      )
      (padstack "padstack2"
        (shape (circle signal 10 0 0))
        (attach off)
        (hole (oval 5 10))
      )
      (padstack "padstack3"
        (shape (rect signal 0 0 10 10))
        (attach off)
        (hole (square 5))
      )
      (padstack "padstack4"
        (shape (path signal 1 0 0 10 10))
        (attach off)
      )
    )
    (network_out 
    )
  )
)
`

test("stringify-dsn-session-shapes-and-holes", () => {
  const sessionJson = parseDsnToDsnJson(sessionDsn) as DsnSession
  const stringified = stringifyDsnSession(sessionJson)
  const reparsed = parseDsnToDsnJson(stringified) as DsnSession

  const lib = reparsed.routes.library_out!
  const origLib = sessionJson.routes.library_out!

  // -- Images --
  expect(lib.images?.length).toBe(1)
  expect(lib.images?.[0].name).toBe("test_image")
  expect(lib.images?.[0].outlines).toHaveLength(1)
  expect(lib.images?.[0].outlines[0].path.layer).toBe("signal")
  expect(lib.images?.[0].outlines[0].path.width).toBe(1)
  expect(lib.images?.[0].outlines[0].path.coordinates).toEqual([0, 0, 10, 10])
  expect(lib.images?.[0].pins).toHaveLength(1)
  expect(lib.images?.[0].pins[0].padstack_name).toBe("padstack1")
  expect(lib.images?.[0].pins[0].pin_number).toBe(1)
  expect(lib.images?.[0].pins[0].x).toBe(0)
  expect(lib.images?.[0].pins[0].y).toBe(0)

  // -- Padstacks --
  expect(lib.padstacks?.length).toBe(4)

  // padstack1: polygon shape + circle hole
  const ps1 = lib.padstacks![0]
  expect(ps1.name).toBe("padstack1")
  expect(ps1.attach).toBe("off")
  expect(ps1.shapes).toHaveLength(1)
  expect(ps1.shapes[0].shapeType).toBe("polygon")
  if (ps1.shapes[0].shapeType === "polygon") {
    expect(ps1.shapes[0].layer).toBe("signal")
    expect(ps1.shapes[0].width).toBe(10)
    expect(ps1.shapes[0].coordinates).toEqual([0, 0, 10, 0, 10, 10, 0, 10])
  }
  expect(ps1.hole?.shape).toBe("circle")
  expect(ps1.hole?.diameter).toBe(5)
  expect(ps1.hole?.width).toBeUndefined()
  expect(ps1.hole?.height).toBeUndefined()

  // padstack2: circle shape + oval hole
  const ps2 = lib.padstacks![1]
  expect(ps2.name).toBe("padstack2")
  expect(ps2.attach).toBe("off")
  expect(ps2.shapes).toHaveLength(1)
  expect(ps2.shapes[0].shapeType).toBe("circle")
  if (ps2.shapes[0].shapeType === "circle") {
    expect(ps2.shapes[0].layer).toBe("signal")
    expect(ps2.shapes[0].diameter).toBe(10)
  }
  expect(ps2.hole?.shape).toBe("oval")
  expect(ps2.hole?.width).toBe(5)
  expect(ps2.hole?.height).toBe(10)
  expect(ps2.hole?.diameter).toBeUndefined()

  // padstack3: rect shape + square hole
  const ps3 = lib.padstacks![2]
  expect(ps3.name).toBe("padstack3")
  expect(ps3.attach).toBe("off")
  expect(ps3.shapes).toHaveLength(1)
  expect(ps3.shapes[0].shapeType).toBe("rect")
  if (ps3.shapes[0].shapeType === "rect") {
    expect(ps3.shapes[0].layer).toBe("signal")
    expect(ps3.shapes[0].coordinates).toEqual([0, 0, 10, 10])
  }
  expect(ps3.hole?.shape).toBe("square")
  expect(ps3.hole?.width).toBe(5)
  expect(ps3.hole?.diameter).toBeUndefined()
  expect(ps3.hole?.height).toBeUndefined()

  // padstack4: path shape, no hole
  const ps4 = lib.padstacks![3]
  expect(ps4.name).toBe("padstack4")
  expect(ps4.attach).toBe("off")
  expect(ps4.shapes).toHaveLength(1)
  expect(ps4.shapes[0].shapeType).toBe("path")
  if (ps4.shapes[0].shapeType === "path") {
    expect(ps4.shapes[0].layer).toBe("signal")
    expect(ps4.shapes[0].width).toBe(1)
    expect(ps4.shapes[0].coordinates).toEqual([0, 0, 10, 10])
  }
  expect(ps4.hole).toBeUndefined()

  // Full round-trip structural equality
  expect(reparsed.filename).toBe(sessionJson.filename)
  expect(reparsed.placement.components).toEqual(sessionJson.placement.components)
  expect(reparsed.routes.network_out.nets).toEqual(
    sessionJson.routes.network_out.nets,
  )
})
