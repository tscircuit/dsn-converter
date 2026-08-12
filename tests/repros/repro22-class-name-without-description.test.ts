import { expect, test } from "bun:test"
import { parseDsnToDsnJson } from "lib"

/**
 * Part of https://github.com/tscircuit/dsn-converter/issues/54
 *
 * processClass only set `classObj.name` when nodes[1] AND nodes[2] were both
 * string atoms, treating nodes[2] as a required "description". But a class
 * with no description (nodes[2] is the first nested list, e.g.
 * `(clearance_class ...)`, not a string) is valid DSN -- see the `default`
 * class in tests/assets/testkicadproject/freeroutingTraceAdded.dsn. The
 * class's name was silently dropped whenever it had no description.
 */
test("a class with no description still gets its name parsed", () => {
  const dsn = `(pcb "test.dsn"
  (parser
    (string_quote ")
    (space_in_quoted_tokens on)
    (host_cad "test")
    (host_version "1")
  )
  (resolution um 10)
  (unit um)
  (structure
    (layer Top (type signal) (property (index 0)))
    (boundary (path pcb 0 0 0 0 100 0 100 100 0 100 0 0))
    (via "")
    (rule (width 200))
  )
  (placement)
  (library)
  (network
    (class default
      (clearance_class default)
      (rule (width 200))
    )
  )
  (wiring)
)`

  const dsnJson = parseDsnToDsnJson(dsn) as any
  expect(dsnJson.network.classes[0].name).toBe("default")
})
