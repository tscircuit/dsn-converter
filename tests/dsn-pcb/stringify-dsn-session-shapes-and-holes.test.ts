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

  expect(reparsed.routes.library_out?.images?.length).toBe(1)
  expect(reparsed.routes.library_out?.images?.[0].name).toBe("test_image")
  expect(reparsed.routes.library_out?.padstacks?.length).toBe(4)
  expect(reparsed.routes.library_out?.padstacks?.[0].hole?.shape).toBe("circle")
  expect(reparsed.routes.library_out?.padstacks?.[1].hole?.shape).toBe("oval")
  expect(reparsed.routes.library_out?.padstacks?.[2].hole?.shape).toBe("square")
})
