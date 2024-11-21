import fs from "node:fs"
import path from "node:path"

function formatNumber(num: number) {
  return parseFloat(num.toFixed(2)).toString().padStart(8, ' ');
}

function convertRouteJsonToMarkdown(routeJson: any, title?: string) {
  let markdown = title ? `# ${title}\n\n` : '# Simple Route JSON Analysis\n\n';

  // Basic Information
  markdown += '## General Information\n';
  markdown += `- Minimum Trace Width: ${routeJson.minTraceWidth}mm\n`;
  markdown += `- Layer Count: ${routeJson.layerCount}\n\n`;

  // Bounds Information
  markdown += '## Board Bounds\n';
  markdown += '| Dimension | Min (mm) | Max (mm) |\n';
  markdown += '|-----------|----------|----------|\n';
  markdown += `| X         |${formatNumber(routeJson.bounds.minX)}|${formatNumber(routeJson.bounds.maxX)}|\n`;
  markdown += `| Y         |${formatNumber(routeJson.bounds.minY)}|${formatNumber(routeJson.bounds.maxY)}|\n\n`;

  // Obstacles
  markdown += '## Obstacles\n';
  markdown += '| Type  | Layer | X (mm) | Y (mm) | Width (mm) | Height (mm) | Connected To |\n';
  markdown += '|-------|--------|---------|---------|------------|-------------|-------------|\n';
  
  routeJson.obstacles.forEach((obstacle: any) => {
    markdown += `| ${obstacle.type} | ${obstacle.layers.join(', ')} |`;
    markdown += `${formatNumber(obstacle.center.x)}|${formatNumber(obstacle.center.y)}|`;
    markdown += `${formatNumber(obstacle.width)}|${formatNumber(obstacle.height)}|`;
    markdown += ` ${obstacle.connectedTo.map((conn: any) => `\n- ${conn}`).join('')} |\n`;
  });
  markdown += '\n';

  // Connections
  markdown += '## Connections\n';
  routeJson.connections.forEach((connection: any, index: number) => {
    markdown += `### Connection ${index + 1}: ${connection.name}\n`;
    markdown += '| Point | X (mm) | Y (mm) | Layer | Port ID |\n';
    markdown += '|--------|---------|---------|--------|----------|\n';
    
    connection.pointsToConnect.forEach((point: any, pointIndex: number) => {
      markdown += `| ${pointIndex + 1} |`;
      markdown += `${formatNumber(point.x)}|${formatNumber(point.y)}|`;
      markdown += ` ${point.layer} | ${point.pcb_port_id} |\n`;
    });
    markdown += '\n';
  });

  return markdown;
}

export function simpleRouteJsonToTable(routeJson: any, outputPath: string, title?: string) {
  try {
    const markdown = convertRouteJsonToMarkdown(routeJson, title);
    // Resolve the output path relative to the current file's directory
    const resolvedOutputPath = path.resolve(__dirname, outputPath);
    fs.writeFileSync(resolvedOutputPath, markdown);
    console.log(`Route analysis has been written to ${resolvedOutputPath}`);
    return markdown;
  } catch (error) {
    console.error('Error processing route JSON:', error);
    throw error;
  }
}

