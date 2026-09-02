import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename } from "node:path"
import Debug from "debug"
import { Resvg } from "@resvg/resvg-js"
import looksSame from "looks-same"

const renderSvgToPng = (svgPath: string) => {
  const svg = readFileSync(svgPath, "utf8")
  return new Resvg(svg, {
    fitTo: { mode: "width", value: 800 },
  }).render().asPng()
}

/**
 * Usage:
 *
 * const { debug, writeDebugFile, getDebugFilePath } = getTestDebugUtils(import.meta.path)
 *
 * writeDebugFile("circuit.before.json", JSON.stringify(circuitJsonBefore))
 * writeDebugFile("circuit.after.json", JSON.stringify(circuitJsonAfter))
 *
 * export DEBUG=dsn-converter:my-test-name
 * debug("my output!")
 *
 * const looksSameResult = await looksSameSvg(
 *   getDebugFilePath("circuit.before.svg"),
 *   getDebugFilePath("circuit.after.svg"),
 * )
 */
export const getTestDebugUtils = (testPath: string) => {
  const testFileDir = basename(testPath).split(".")[0]
  mkdirSync(`./debug-files/${testFileDir}`, { recursive: true })
  return {
    debug: Debug(`dsn-converter:${testFileDir}`),
    writeDebugFile: (name: string, content: string) => {
      writeFileSync(`./debug-files/${testFileDir}/${name}`, content)
    },
    getDebugFilePath: (name: string) => {
      return `./debug-files/${testFileDir}/${name}`
    },
    /**
     * Compare two SVG debug files by rasterizing them to PNG first —
     * looks-same only understands raster images and throws
     * ERR_BUFFER_OUT_OF_BOUNDS when handed SVG paths.
     */
    looksSameSvg: async (svgPath1: string, svgPath2: string) => {
      const png1 = svgPath1.replace(/\.svg$/, ".png")
      const png2 = svgPath2.replace(/\.svg$/, ".png")
      await Bun.write(png1, renderSvgToPng(svgPath1))
      await Bun.write(png2, renderSvgToPng(svgPath2))
      return looksSame(png1, png2)
    },
  }
}