import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"

test("should tokenize net names with leading digits as symbols", () => {
  // Net names like "3.3V", "5V", "12VREG" must be single symbol tokens
  const t1 = tokenizeDsn("(net 3.3V (pins IC1-1))")
  const symbols = t1.filter((t) => t.type === "Symbol")
  expect(symbols.map((s) => s.value)).toContain("3.3V")

  const t2 = tokenizeDsn("(net 5V (pins R1-1))")
  const symbols2 = t2.filter((t) => t.type === "Symbol")
  expect(symbols2.map((s) => s.value)).toContain("5V")

  const t3 = tokenizeDsn("(net 12VREG (pins R1-1))")
  const symbols3 = t3.filter((t) => t.type === "Symbol")
  expect(symbols3.map((s) => s.value)).toContain("12VREG")
})

test("should tokenize scientific notation as numbers", () => {
  const t1 = tokenizeDsn("(pin Pad 1 5.6843418860808015e-11 3594.95)")
  const nums = t1.filter((t) => t.type === "Number")
  expect(nums[0].value).toBe(1)
  expect(nums[1].value).toBe(5.6843418860808015e-11)
  expect(nums[2].value).toBeCloseTo(3594.95)
})

test("should tokenize plain negative numbers correctly", () => {
  const t = tokenizeDsn("(path Top 250 -52508.3)")
  const nums = t.filter((t) => t.type === "Number")
  expect(nums[0].value).toBe(250)
  expect(nums[1].value).toBe(-52508.3)
})
