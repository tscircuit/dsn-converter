import { parseDsnToCircuitJson } from "../lib"
import { readFileSync } from "fs"

test("smoothieboard converts correctly (unrouted board)", () => {
  const dsn = readFileSync("tests/smoothieboard.dsn", "utf-8")
  const result = parseDsnToCircuitJson(dsn)

  const counts: Record<string, number> = {}
  for (const el of result as any[]) counts[el.type] = (counts[el.type] ?? 0) + 1
  console.log("=== النتيجة النهائية ===")
  console.log(JSON.stringify(counts, null, 2))

  // board
  expect(counts["pcb_board"]).toBe(1)
  // components - الـ Smoothieboard فيه 322 component
  expect(counts["pcb_component"]).toBeGreaterThan(50)
  expect(counts["source_component"]).toBeGreaterThan(50)
  // pads
  expect(counts["pcb_smtpad"]).toBeGreaterThan(100)
  // nets
  expect(counts["source_net"]).toBeGreaterThan(10)
  // vias (pre-placed)
  expect(counts["pcb_via"]).toBeGreaterThan(0)
  // traces = 0 لأن الملف unrouted - ده صح!
  expect(counts["pcb_trace"] ?? 0).toBe(0)

  // تحقق إن الإحداثيات معقولة (مش ضربة 1000)
  const board = (result as any[]).find((el) => el.type === "pcb_board")
  console.log("Board center:", board.center)
  console.log("Board size:", board.width, "x", board.height, "mm")
  expect(board.width).toBeGreaterThan(10) // أكبر من 1 سم
  expect(board.width).toBeLessThan(1000) // أصغر من 1 متر
})
