// Define token types
type TokenType = "LParen" | "RParen" | "Symbol" | "String" | "Number"

// Define Token interface
interface Token {
  type: TokenType
  value?: string | number
}

// **Tokenizer Function**
export function tokenizeDsn(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  const length = input.length

  while (i < length) {
    const char = input[i]

    if (char === "(") {
      tokens.push({ type: "LParen" })
      i++
    } else if (char === ")") {
      tokens.push({ type: "RParen" })
      i++
    } else if (/\s/.test(char)) {
      // Ignore whitespace
      i++
    } else if (char === '"') {
      // Parse quoted string
      let value = ""
      i++ // Skip the opening quote
      while (i < length && input[i] !== '"') {
        if (input[i] === "\\") {
          // Handle escape sequences
          i++
          if (i < length) {
            value += input[i]
            i++
          }
        } else {
          value += input[i]
          i++
        }
      }
      i++ // Skip the closing quote
      tokens.push({ type: "String", value })
    } else if (char === "-" || /\d/.test(char)) {
      // Parse number (integer or float)
      let numStr = ""
      if (char === "-") {
        numStr += "-"
        i++
      }
      while (i < length && /[\d.]/.test(input[i])) {
        numStr += input[i]
        i++
      }
      tokens.push({ type: "Number", value: parseFloat(numStr) })
    } else {
      // Parse symbol
      let sym = ""
      while (i < length && !/\s|\(|\)/.test(input[i])) {
        sym += input[i]
        i++
      }
      tokens.push({ type: "Symbol", value: sym })
    }
  }

  return tokens
}

// **Parser Function**
export interface ASTNode {
  type: "List" | "Atom"
  value?: string | number
  children?: ASTNode[]
}

export function parseSexprToAst(tokens: Token[]): ASTNode {
  let i = 0

  function parseExpression(): ASTNode {
    const token = tokens[i]

    if (!token) {
      throw new Error("Unexpected end of input")
    }

    if (token.type === "LParen") {
      i++ // Consume '('
      const node: ASTNode = { type: "List", children: [] }
      while (i < tokens.length && tokens[i].type !== "RParen") {
        node.children!.push(parseExpression())
      }
      if (tokens[i]?.type !== "RParen") {
        throw new Error('Expected ")"')
      }
      i++ // Consume ')'
      return node
    } else if (
      token.type === "Symbol" ||
      token.type === "String" ||
      token.type === "Number"
    ) {
      i++ // Consume token
      return { type: "Atom", value: token.value }
    } else {
      throw new Error(`Unexpected token: ${JSON.stringify(token)}`)
    }
  }

  const ast = parseExpression()

  if (i < tokens.length) {
    throw new Error("Unexpected tokens after end of expression")
  }

  return ast
}
