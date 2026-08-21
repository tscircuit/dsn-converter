import { expect, test } from "bun:test"
import { parseDsnToCircuitJson } from "lib"
import { any_circuit_element } from "circuit-json"

// @ts-ignore
import dsnFileWithFreeroutingTrace from "../assets/repro/smoothieboard-repro.dsn" with {
  type: "text",
}

test("issue54 smoothieboard port pin_number is not NaN", async () => {
  const circuitJson = parseDsnToCircuitJson(dsnFileWithFreeroutingTrace);
  
  // Verify that all elements conform to circuit-json schema
  // Specifically, source_port pin_number shouldn't be NaN
  let hasCopperPour = false;
  for (const element of circuitJson) {
    if (element.type === "source_port") {
      expect(element.pin_number).not.toBeNaN();
    }
    // @ts-ignore
    if (element.type === "pcb_copper_pour") {
      hasCopperPour = true;
    }
  }
  
  expect(hasCopperPour).toBe(true);
})
