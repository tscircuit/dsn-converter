import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import Debug from "debug"

export const getTestDebugUtils = (testPath: string) => {
  const testFileDir = path.basename(testPath).split(".")[0]
  mkdirSync(`./debug-files/${testFileDir}`, { recursive: true })
  return {
    debug: Debug(`dsn-converter:${testFileDir}`),
    writeDebugFile: (name: string, content: string) => {
      writeFileSync(`./debug-files/${testFileDir}/${name}`, content)
    },
    getDebugFilePath: (name: string) => {
      return path.resolve(`./debug-files/${testFileDir}/${name}`)
    },
  }
}
