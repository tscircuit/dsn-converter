import fs from "fs"
import path from "path"
import {
  parseDsnToDsnJson,
  convertDsnPcbToCircuitJson,
  type DsnPcb,
} from "../lib"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

async function main() {
  const dsnPath = path.join(
    __dirname,
    "assets",
    "repro",
    "smoothieboard-repro.dsn",
  )
  const dsnContent = fs.readFileSync(dsnPath, "utf-8")

  console.log("Parsing DSN to DsnJson...")
  const dsnJson = parseDsnToDsnJson(dsnContent) as DsnPcb

  console.log("Converting DsnJson to Circuit JSON...")
  const circuitJson = convertDsnPcbToCircuitJson(dsnJson)

  console.log("Converting Circuit JSON to PCB SVG...")
  const svg = convertCircuitJsonToPcbSvg(circuitJson)

  const outputPath = path.join(__dirname, "assets", "smoothieboard_repro.svg")
  fs.writeFileSync(outputPath, svg, "utf-8")
  console.log("SVG successfully saved to:", outputPath)
}

main().catch(console.error)
