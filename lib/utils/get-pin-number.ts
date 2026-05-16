import Debug from "debug"
import type { ASTNode } from "../common/parse-sexpr"

const debug = Debug("dsn-converter:getPinNum")

const parsePinIdentifier = (
  value: string | number | undefined,
): number | string | null => {
  if (value === undefined) return null
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value
  }

  const str = String(value)
  if (/^-?\d+$/.test(str)) {
    return Number.parseInt(str, 10)
  }
  return str
}

const parseCoordinate = (
  node: ASTNode | undefined,
  nextNode: ASTNode | undefined,
): number | undefined => {
  if (!node || node.type !== "Atom") return undefined
  if (typeof node.value === "number") {
    if (
      nextNode?.type === "Atom" &&
      String(nextNode.value).toLowerCase().startsWith("e")
    ) {
      return Number(`${node.value}${nextNode.value}`)
    }
    return node.value
  }
  return undefined
}

export type ParsedPinDefinition = {
  pinNumber: number | string
  x: number
  y: number
  rotation?: number
}

/**
 * Parses `(pin padstack [rotate N] pinId x y)` from DSN image definitions.
 */
export function parsePinDefinition(
  nodes: ASTNode[],
): ParsedPinDefinition | null {
  if (nodes[1]?.type !== "Atom") {
    debug("Unsupported pin padstack_name format:", nodes)
    return null
  }

  let index = 2
  let rotation: number | undefined

  if (
    nodes[index]?.type === "List" &&
    nodes[index].children?.[0]?.type === "Atom" &&
    nodes[index].children?.[0].value === "rotate"
  ) {
    const rotationValue = nodes[index].children?.[1]?.value
    rotation =
      typeof rotationValue === "number"
        ? rotationValue
        : Number.parseFloat(String(rotationValue))
    index++
  }

  let pinNumber = parsePinIdentifier(nodes[index]?.value)
  if (pinNumber === null) return null

  index++

  const pinSuffixNode = nodes[index]
  if (
    pinSuffixNode?.type === "Atom" &&
    typeof pinSuffixNode.value === "string" &&
    pinSuffixNode.value.startsWith("@")
  ) {
    pinNumber = `${pinNumber}${pinSuffixNode.value}`
    index++
  }

  let xValue: number | undefined
  let yValue: number | undefined

  for (let i = index; i < nodes.length; i++) {
    const node = nodes[i]
    const nextNode = nodes[i + 1]

    if (xValue === undefined) {
      const parsed = parseCoordinate(node, nextNode)
      if (parsed !== undefined) {
        xValue = parsed
        if (
          node?.type === "Atom" &&
          nextNode?.type === "Atom" &&
          String(nextNode.value).toLowerCase().startsWith("e")
        ) {
          i++
        }
      }
      continue
    }

    if (yValue === undefined) {
      const parsed = parseCoordinate(node, nextNode)
      if (parsed !== undefined) {
        yValue = parsed
        if (
          node?.type === "Atom" &&
          nextNode?.type === "Atom" &&
          String(nextNode.value).toLowerCase().startsWith("e")
        ) {
          i++
        }
      }
    }
  }

  if (typeof xValue !== "number" || typeof yValue !== "number") {
    return null
  }

  return {
    pinNumber,
    x: xValue,
    y: yValue,
    rotation,
  }
}

/** @deprecated Use parsePinDefinition */
export function getPinNum(nodes: ASTNode[]): number | string | null {
  return parsePinDefinition(nodes)?.pinNumber ?? null
}
