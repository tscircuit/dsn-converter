import { test, expect } from "bun:test"
import { parseDsnToCircuitJson } from "lib"

// @ts-ignore
import fakeFreeroutingExample1Dsn from "../assets/fake-freerouting-example-1/fake-freerouting-example-1.dsn" with {
  type: "text",
}

test("repro1 fake-freerouting-example-1", () => {
  const dsnPcb = parseDsnToCircuitJson(fakeFreeroutingExample1Dsn)
})
