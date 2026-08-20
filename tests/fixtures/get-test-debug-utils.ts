import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
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
  const testFileName = testPath.split(/[\\/]/).pop() ?? "unknown-test"
  const testFileDir = testFileName.split(".")[0] ?? "unknown-test"
  const debugDir = join(".", "debug-files", testFileDir)
  mkdirSync(debugDir, { recursive: true })
  return {
    debug: Debug(`dsn-converter:${testFileDir}`),
    writeDebugFile: (name: string, content: string) => {
      writeFileSync(join(debugDir, name), content)
    },
    getDebugFilePath: (name: string) => {
      return join(debugDir, name)
    },
  }
}
