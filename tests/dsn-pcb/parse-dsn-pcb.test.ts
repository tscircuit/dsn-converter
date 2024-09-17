import { expect, test } from "bun:test";
import { parseDSN } from "../../lib/common/parse-sexpr.ts";
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
};

test("parseDSN", async () => {
  const sexpr = parseDSN(testDsnFile);
  expect(sexpr).toBeTruthy();
});
