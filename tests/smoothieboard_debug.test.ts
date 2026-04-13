import { parseDsnToDsnJson } from "../lib"
import { readFileSync } from "fs"

test("debug smoothieboard wiring", () => {
  const dsn = readFileSync("tests/smoothieboard.dsn", "utf-8")
  const dsnJson = parseDsnToDsnJson(dsn)

  // كم wire فيه؟
  const wires = dsnJson.wiring?.wires ?? []
  console.log("عدد الـ wires:", wires.length)

  // شوف أول 3 wires عشان نفهم شكلهم
  console.log("أول 3 wires:")
  console.log(JSON.stringify(wires.slice(0, 3), null, 2))

  // أنواع الـ wires
  const types = wires.map((w: any) => w.type ?? "no-type")
  const typeCounts: Record<string, number> = {}
  for (const t of types) typeCounts[t] = (typeCounts[t] ?? 0) + 1
  console.log("أنواع الـ wires:", typeCounts)

  // هل فيه path أو polyline_path؟
  const withPath = wires.filter((w: any) => "path" in w).length
  const withPolyline = wires.filter((w: any) => "polyline_path" in w).length
  console.log("wires فيها path:", withPath)
  console.log("wires فيها polyline_path:", withPolyline)

  expect(wires.length).toBeGreaterThan(0)
})
