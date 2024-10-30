import { circuitJsonToPcbSvg } from "circuit-to-svg";
import { parseDSN } from "../../lib/common/parse-sexpr.ts";
import { circuitJsonToDsnJson, dsnJsonToCircuitJson } from "../../lib/dsn-pcb";
// @ts-ignore
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
};
// @ts-ignore
import { expect, test } from "bun:test";

test("circuit json to dsn json", async () => {
  const dsnJson = parseDSN(testDsnFile);
  const circuitJson = dsnJsonToCircuitJson(dsnJson);
  const backToDsnJson = circuitJsonToDsnJson(circuitJson);
  const validationCircuitJson = dsnJsonToCircuitJson(backToDsnJson);

  expect(circuitJsonToPcbSvg(validationCircuitJson)).toMatchSvgSnapshot(import.meta.path);
});
