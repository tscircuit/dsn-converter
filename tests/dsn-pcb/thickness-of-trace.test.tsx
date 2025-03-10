import { Circuit } from "@tscircuit/core";
import { expect, test } from "bun:test"
import { convertCircuitJsonToDsnJson } from "lib";

test("circuit json thickness converted to dsn file", () => {
  const circuit = new Circuit();

  circuit.add(
    <board width={100} height={100}>
      <resistor resistance={1000} name="R1" footprint={"0402"} pcbX={-25} />
      <resistor resistance={1000} name="R2" footprint={"0402"} pcbX={25} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" thickness={1.6} />
      <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    </board>
  );

  circuit.render();

  const circuitJson = circuit.getCircuitJson();
  const source_trace = circuitJson.filter((element) => element.type === "source_trace")[0];
  expect(source_trace.min_trace_thickness).toBe(1.6);

  const dsnJson = convertCircuitJsonToDsnJson(circuitJson);

  const network = dsnJson.network.classes
  expect(network.length).toBe(2)

  const trace_width_1600um = network.find((c) => c.name === "trace_width_1600um")
  expect(trace_width_1600um).toBeDefined()
  expect(trace_width_1600um?.rule.width).toBe(1600)

  const kicad_default = network.find((c) => c.name === "kicad_default")
  expect(kicad_default).toBeDefined()
  expect(kicad_default?.rule.width).toBe(100)
})
