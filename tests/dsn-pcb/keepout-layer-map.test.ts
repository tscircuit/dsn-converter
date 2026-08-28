import { expect, test } from "bun:test"
import { mapDsnLayerToCircuitLayer } from "../../lib/dsn-pcb/dsn-json-to-circuit-json/dsn-component-converters/convert-keepouts-to-pcb-keepouts.ts"
import type { Structure } from "../../lib/dsn-pcb/types.ts"

const structure = {
  layers: [
    { name: "Top", type: "signal", property: { index: 0 } },
    { name: "Route2", type: "power", property: { index: 1 } },
    { name: "Route15", type: "signal", property: { index: 2 } },
    { name: "Bottom", type: "signal", property: { index: 3 } },
  ],
} as unknown as Structure

test("maps DSN layer names to circuit-json layer names", () => {
  expect(mapDsnLayerToCircuitLayer("Top", structure)).toBe("top")
  expect(mapDsnLayerToCircuitLayer("Bottom", structure)).toBe("bottom")
  expect(mapDsnLayerToCircuitLayer("Route2", structure)).toBe("inner1")
  expect(mapDsnLayerToCircuitLayer("Route15", structure)).toBe("inner2")
  // unknown layer falls back to the raw name (never throws)
  expect(mapDsnLayerToCircuitLayer("Mystery", structure)).toBe("Mystery")
})
