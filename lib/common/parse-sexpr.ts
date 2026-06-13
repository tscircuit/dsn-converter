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
  let lastSymbol = ""

  while (i < length) {
    const char = input[i]

    if (char === "(") {
      tokens.push({ type: "LParen" })
      i++
      lastSymbol = ""
    } else if (char === ")") {
      tokens.push({ type: "RParen" })
      i++
      lastSymbol = ""
    } else if (/\s/.test(char)) {
      // Ignore whitespace
      i++
    } else if (char === '"') {
      // Special case for (string_quote ")
      if (lastSymbol === "string_quote") {
        tokens.push({ type: "Symbol", value: '"' })
        i++
        lastSymbol = ""
        continue
      }
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
      lastSymbol = ""
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
      if (numStr === "-") {
        tokens.push({ type: "Symbol", value: "-" })
        lastSymbol = "-"
      } else {
        tokens.push({ type: "Number", value: parseFloat(numStr) })
        lastSymbol = ""
      }
    } else {
      // Parse symbol
      let sym = ""
      while (i < length && !/\s|\(|\)/.test(input[i])) {
        sym += input[i]
        i++
      }
      tokens.push({ type: "Symbol", value: sym })
      lastSymbol = sym
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
  const stack: ASTNode[] = []
  let root: ASTNode | null = null

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type === "LParen") {
      const newNode: ASTNode = { type: "List", children: [] }
      if (stack.length > 0) {
        stack[stack.length - 1].children!.push(newNode)
      } else if (!root) {
        root = newNode
      } else {
        throw new Error("Unexpected extra root node (LParen)")
      }
      stack.push(newNode)
    } else if (token.type === "RParen") {
      if (stack.length === 0) {
        throw new Error('Unexpected ")" without opening parenthesis')
      }
      stack.pop()
    } else {
      // Atom (Symbol, String, or Number)
      const newNode: ASTNode = { type: "Atom", value: token.value }
      if (stack.length > 0) {
        stack[stack.length - 1].children!.push(newNode)
      } else if (!root) {
        // A single atom can be a valid S-expression root
        root = newNode
      } else {
        throw new Error(`Unexpected extra root node (Atom: ${token.value})`)
      }
    }
  }

  if (stack.length > 0) {
    throw new Error('Expected ")"')
  }

  if (!root) {
    throw new Error("Empty input")
  }

  return root
}
