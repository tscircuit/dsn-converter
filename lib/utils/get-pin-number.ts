import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

const isCanonicalIntegerString = (value: string) =>
  /^(?:0|[1-9]\d*)$/.test(value)

/**
 * Process pin identifier from AST nodes and preserve string identifiers.
 * Bare numeric DSN pins are already tokenized as numbers; string values came
 * from quoted identifiers or symbols and should not be coerced.
 */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  // Extract pin number from AST nodes
  let pinNumber: string | number | undefined

  if (nodes[2]?.type === "List" && nodes[2].children) {
    // Pin number is in a List structure
    pinNumber = nodes[2].children[0]?.value
  } else if (nodes[2]?.type === "Atom") {
    // Pin number is direct value
    pinNumber = nodes[2].value
  } else {
    debug("Unsupported pin number format:", nodes)
    return null
  }

  if (typeof pinNumber === "number") {
    return pinNumber
  }
  const pinString = String(pinNumber)
  return isCanonicalIntegerString(pinString) ? Number(pinString) : pinString
}
