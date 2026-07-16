import { expect, test } from "bun:test"
import { parseDsnToCircuitJson } from "lib"

// Minimal DSN with two keepout circles inside an image definition,
// mirroring the structure found in freerouting's Issue145-smoothieboard.dsn
const minimalDsn = `(pcb "keepout-test.dsn"
  (resolution um 10)
  (unit um)
  (structure
    (boundary
      (path pcb 0  0 0  20000 0  20000 20000  0 20000  0 0)
    )
  )
  (placement
    (component "test:FOOT"
      (place U1 5000 5000 front 0)
    )
  )
  (library
    (image "test:FOOT"
      (keepout "" (circle Top 1600 0 -1000))
      (keepout "" (circle Bottom 3600))
    )
  )
  (network
  )
)`

test("image keepout circles become pcb_keepout elements", () => {
  const cj = parseDsnToCircuitJson(minimalDsn)
  const keepouts = cj.filter((e) => e.type === "pcb_keepout") as any[]

  expect(keepouts.length).toBe(2)

  const top = keepouts.find((k) => k.layers.includes("top"))
  expect(top).toBeDefined()
  expect(top.shape).toBe("circle")
  expect(top.radius).toBeCloseTo(0.8) // діаметр 1600 μm → радіус 0.8 мм
  expect(top.center.x).toBeCloseTo(5) // 5000 + 0
  expect(top.center.y).toBeCloseTo(4) // 5000 + (-1000)

  const bottom = keepouts.find((k) => k.layers.includes("bottom"))
  expect(bottom).toBeDefined()
  expect(bottom.radius).toBeCloseTo(1.8)
  expect(bottom.center.x).toBeCloseTo(5)
  expect(bottom.center.y).toBeCloseTo(5)
})
