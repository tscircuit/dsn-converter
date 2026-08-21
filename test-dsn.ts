import { readFileSync } from "fs"
import { parseDsnToCircuitJson } from "./lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-circuit-json"
import { parseDsnToDsnJson } from "./lib/dsn-pcb/dsn-json-to-circuit-json/parse-dsn-to-dsn-json"

const dsnContent = readFileSync("tests/assets/Issue145-smoothieboard.dsn", "utf-8")
console.log("Parsing DSN...")
try {
  const result = parseDsnToCircuitJson(dsnContent)
  console.log("Success! Array length:", result.length)
  
  const vias = result.filter(r => r.type === "pcb_via")
  console.log("First via:", JSON.stringify(vias[0], null, 2))
  
  const smtpads = result.filter(r => r.type === "pcb_smtpad")
  console.log("First smtpad:", JSON.stringify(smtpads[0], null, 2))

  const types = result.reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log("Element types:", types)
} catch (err) {
  console.error("Error parsing DSN:", err)
}
