import { expect, test, describe } from "bun:test"
import { tokenizeDsn, parseSexprToAst } from "../../lib/common/parse-sexpr"

describe("tokenizer handles symbol pin names", () => {
  test("standalone '-' is tokenized as a symbol, not a number", () => {
    const tokens = tokenizeDsn("(pin Pad_3000x1400_um - -2400 0)")
    // Should be: LParen, pin, Pad..., -, -2400, 0, RParen
    const symbolToken = tokens.find(
      (t) => t.type === "Symbol" && t.value === "-",
    )
    expect(symbolToken).toBeDefined()

    // Should NOT have NaN in any token
    const nanToken = tokens.find(
      (t) => t.type === "Number" && isNaN(t.value as number),
    )
    expect(nanToken).toBeUndefined()
  })

  test("standalone '+' is tokenized as a symbol, not a number", () => {
    const tokens = tokenizeDsn("(pin Pad_3800x1400_um + 3000 0)")
    const symbolToken = tokens.find(
      (t) => t.type === "Symbol" && t.value === "+",
    )
    expect(symbolToken).toBeDefined()
  })

  test("'-2400' is still tokenized as a negative number", () => {
    const tokens = tokenizeDsn("(pin Pad_3000x1400_um - -2400 0)")
    const negToken = tokens.find(
      (t) => t.type === "Number" && t.value === -2400,
    )
    expect(negToken).toBeDefined()
  })

  test("pin with (rotate N) parses correctly", () => {
    const tokens = tokenizeDsn(
      "(pin Rect[T]Pad_1600x1400_um (rotate 90) A 1400 0)",
    )
    const ast = parseSexprToAst(tokens)
    // nodes[2] should be a List with "rotate" and 90
    expect(ast.children![2].type).toBe("List")
    expect(ast.children![2].children![0].value).toBe("rotate")
    expect(ast.children![2].children![1].value).toBe(90)
    // nodes[3] should be the pin name "A"
    expect(ast.children![3].value).toBe("A")
    // nodes[4], [5] are coordinates
    expect(ast.children![4].value).toBe(1400)
    expect(ast.children![5].value).toBe(0)
  })
})
