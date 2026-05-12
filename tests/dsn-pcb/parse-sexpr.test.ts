import { expect, test } from "bun:test"
import { tokenizeDsn } from "lib/common/parse-sexpr"

test("quoted DSN strings preserve literal Windows backslashes", () => {
  const filename = String.raw`F:\Spiwocoal\Documentos\board.dsn`
  const tokens = tokenizeDsn(
    String.raw`(pcb "F:\Spiwocoal\Documentos\board.dsn")`,
  )

  expect(tokens).toEqual([
    { type: "LParen" },
    { type: "Symbol", value: "pcb" },
    { type: "String", value: filename },
    { type: "RParen" },
  ])
})

test("quoted DSN strings still unescape quotes and escaped backslashes", () => {
  const tokens = tokenizeDsn(String.raw`(value "has \"quote\" and C:\\tmp")`)

  expect(tokens[2]).toEqual({
    type: "String",
    value: String.raw`has "quote" and C:\tmp`,
  })
})
