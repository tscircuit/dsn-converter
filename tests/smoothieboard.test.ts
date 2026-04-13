import { parseDsnToCircuitJson } from "../lib"
import { readFileSync } from "fs"

test("smoothieboard converts without error", () => {
  const dsn = readFileSync("tests/smoothieboard.dsn", "utf-8")
  const result = parseDsnToCircuitJson(dsn)
  expect(result).toBeTruthy()
  expect(result.length).toBeGreaterThan(0)
})
