import { mkdirSync } from "node:fs"
import Debug from "debug"

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
 * const looksSameResult = await looksSame(
 *   getDebugFilePath("circuit.before.svg"),
 *   getDebugFilePath("circuit.after.svg"),
 * )
 */
export const getTestDebugUtils = (testPath: string) => {
  const testFileDir = testPath.split("/").pop()?.split(".")[0]
  mkdirSync(`./debug-files/${testFileDir}`, { recursive: true })
  return {
    debug: Debug(`dsn-converter:${testFileDir}`),
    writeDebugFile: (name: string, content: string) => {
      Bun.write(`./debug-files/${testFileDir}/${name}`, content)
    },
    getDebugFilePath: (name: string) => {
      return `./debug-files/${testFileDir}/${name}`
    },
  }
}
