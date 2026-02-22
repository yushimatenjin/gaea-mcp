import fs from "fs";
import path from "path";

const dir = "C:/Users/hagar/AppData/Local/Programs/Gaea 2.0/Examples";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".terrain"));

interface NodeInfo {
  dotnetType: string;
  ports: Map<string, string>;
  properties: Set<string>;
  count: number;
}

const nodeTypes = new Map<string, NodeInfo>();

for (const file of files) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodes: Record<string, any> = raw.Assets?.$values?.[0]?.Terrain?.Nodes ?? {};

    for (const [key, node] of Object.entries(nodes)) {
      if (key === "$id" || !node?.$type) continue;
      const shortName = (node.$type as string).match(/\.(\w+),/)?.[1] ?? node.$type;

      let info = nodeTypes.get(shortName);
      if (!info) {
        info = { dotnetType: node.$type, ports: new Map(), properties: new Set(), count: 0 };
        nodeTypes.set(shortName, info);
      }
      info.count++;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ports: any[] = node.Ports?.$values ?? [];
      for (const p of ports) {
        if (p.Name && p.Type) info.ports.set(p.Name, p.Type);
      }

      const internal = new Set([
        "$id", "$type", "Id", "Name", "Position", "Ports", "Modifiers",
        "Version", "NodeSize", "GraphIndex",
      ]);
      for (const k of Object.keys(node)) {
        if (!internal.has(k)) info.properties.add(k);
      }
    }
  } catch (e) {
    console.error("ERR:", file, e);
  }
}

console.log(`Scanned ${files.length} files, found ${nodeTypes.size} node types\n`);

const sorted = [...nodeTypes.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [name, info] of sorted) {
  const ports = [...info.ports.entries()].map(([n, t]) => `${n}:${t}`).join(", ");
  console.log(`${name} (${info.count}x)`);
  console.log(`  $type: ${info.dotnetType}`);
  console.log(`  ports: ${ports}`);
  console.log(`  props: ${[...info.properties].sort().join(", ")}`);
  console.log();
}
