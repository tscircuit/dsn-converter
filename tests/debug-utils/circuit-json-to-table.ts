import type { AnyCircuitElement, PcbPort, PcbSmtPad, PcbTrace, PcbTraceRoutePoint } from "circuit-json";
import fs from "node:fs"
import path from "node:path"

function formatNumber(num: number) {
  return typeof num === 'number' ? Number(num.toFixed(1)) : 'N/A';
}

function formatPoint(x: number, y: number) {
  return `(${formatNumber(x)}, ${formatNumber(y)})`;
}

function convertCircuitJsonToMarkdown(circuitJson: any, title?: string) {
  let markdown = title ? `# ${title}\n\n` : '# Circuit Component Analysis\n\n';

  // Source Components
  const sourceComponents = circuitJson.filter((item: any) => item.type === "source_component");
  if (sourceComponents.length > 0) {
    markdown += '## Source Components\n';
    markdown += '| ID | Name | Type |\n';
    markdown += '|----|------|------|\n';
    sourceComponents.forEach((comp: any) => {
      const shortId = comp.source_component_id.split(':').pop();
      markdown += `| ${shortId} | ${comp.name} | ${comp.ftype} |\n`;
    });
    markdown += '\n';
  }

  // PCB Ports
  const ports = circuitJson.filter((item: AnyCircuitElement) => item.type === "pcb_port");
  if (ports.length > 0) {
    markdown += '## PCB Ports\n';
    markdown += '| ID | Position (x,y) |\n';
    markdown += '|-----|---------------|\n';
    ports.forEach((port: PcbPort) => {
      const shortId = port.pcb_port_id.split('-').slice(-2).join('-');
      markdown += `| ${shortId} | ${formatPoint(port.x, port.y)} |\n`;
    });
    markdown += '\n';
  }

  // SMT Pads
  const pads = circuitJson.filter((item: AnyCircuitElement) => item.type === "pcb_smtpad");
  if (pads.length > 0) {
    markdown += '## SMT Pads\n';
    markdown += '| Component | Position (x,y) | Size (w×h) |\n';
    markdown += '|-----------|---------------|-------------|\n';
    pads.forEach((pad: PcbSmtPad) => {
      const shortId = pad.pcb_smtpad_id.split('_').slice(-3).join('-');
      if ('width' in pad && 'height' in pad) {
        markdown += `| ${shortId} | ${formatPoint(pad.x, pad.y)} | ${formatNumber(pad.width)} × ${formatNumber(pad.height)} |\n`;
      } else {
        markdown += `| ${shortId} | ${formatPoint(pad.x, pad.y)} | N/A |\n`;
      }
    });
    markdown += '\n';
  }

  // Traces
  const traces = circuitJson.filter((item: AnyCircuitElement) => item.type === "pcb_trace");
  if (traces.length > 0) {
    markdown += '## Trace Route Points\n';
    markdown += '| Point | Position (x,y) | Width |\n';
    markdown += '|-------|---------------|--------|\n';
    traces.forEach((trace: PcbTrace) => {
      trace.route.forEach((point: PcbTraceRoutePoint, index: number) => {
        if (point.route_type === "wire") {
          markdown += `| ${index + 1} | ${formatPoint(point.x, point.y)} | ${formatNumber(point.width)} |\n`;
        }
      });
    });
  }

  return markdown;
}

export function circuitJsonToTable(circuitJson: any, outputPath: string, title?: string) {
  try {
    const markdown = convertCircuitJsonToMarkdown(circuitJson, title);
    // Resolve the output path relative to the current file's directory
    const resolvedOutputPath = path.resolve(__dirname, outputPath);
    console.log(`Resolved output path: ${resolvedOutputPath}`);
    fs.writeFileSync(resolvedOutputPath, markdown);
    console.log(`Circuit JSON has been written to ${resolvedOutputPath}`);
    return markdown;
  } catch (error) {
    console.error('Error processing circuit JSON:', error);
    throw error;
  }
}