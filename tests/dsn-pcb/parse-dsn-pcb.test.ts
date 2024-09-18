import { circuitJsonToPcbSvg } from "circuit-to-svg";
import { parseDSN } from "../../lib/common/parse-sexpr.ts";
import { dsnPcbToCircuitJson } from "../../lib/dsn-pcb/dsn-pcb-to-circuit-json.ts";
import testDsnFile from "../assets/testkicadproject/testkicadproject.dsn" with {
  type: "text",
};
// @ts-ignore
import { expect, test } from "bun:test";

test("parse s-expr to json", async () => {
  const pcbJson = parseDSN(testDsnFile);
  expect(pcbJson).toBeTruthy();
});

test("parse json to circuit json", async () => {
  const pcb = parseDSN(testDsnFile);
  const circuitJson = dsnPcbToCircuitJson(pcb);

  expect(circuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(import.meta.path);
});
