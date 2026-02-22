/**
 * Terrain file I/O — read, write, and manipulate .terrain JSON files.
 *
 * The .terrain format uses Newtonsoft.Json reference-preserving serialization
 * ($id / $ref). This module manages that system when adding/removing objects.
 */

import fs from "fs";
import { randomUUID } from "crypto";
import type { PortDef } from "./node-types.js";

// ─── Types (loosely typed to match dynamic JSON) ───

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface TerrainFile {
  raw: Json;
  /** Shortcut into Assets.$values[0] */
  asset: Json;
  /** Shortcut into asset.Terrain */
  terrain: Json;
  /** Shortcut into asset.Terrain.Nodes */
  nodes: Record<string, Json>;
  /** Path of the source file */
  filePath: string;
}

// ─── $id management ───

/** Scan the entire JSON tree and return the max numeric $id found. */
function findMaxId(obj: Json): number {
  let max = 0;
  if (obj === null || obj === undefined || typeof obj !== "object") return max;
  if (typeof obj["$id"] === "string") {
    const n = parseInt(obj["$id"], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  for (const val of Object.values(obj)) {
    const sub = findMaxId(val);
    if (sub > max) max = sub;
  }
  return max;
}

/** Create an ID allocator starting after the current max. */
function createIdAlloc(root: Json): () => string {
  let next = findMaxId(root) + 1;
  return () => String(next++);
}

// ─── Read ───

export function readTerrain(filePath: string): TerrainFile {
  const text = fs.readFileSync(filePath, "utf-8");
  const raw = JSON.parse(text);
  const asset = raw.Assets?.$values?.[0];
  if (!asset) throw new Error("Invalid .terrain file: no Assets.$values[0]");
  const terrain = asset.Terrain;
  if (!terrain) throw new Error("Invalid .terrain file: no Terrain section");
  const nodes: Record<string, Json> = terrain.Nodes ?? {};
  return { raw, asset, terrain, nodes, filePath };
}

// ─── Write ───

/**
 * Custom JSON serializer that ensures $id, $ref, $type, $values always appear
 * first in objects. JavaScript sorts numeric-string keys before other keys,
 * which pushes $id to the end of the Nodes dictionary. Newtonsoft.Json requires
 * $id to appear before any $ref that references it, so standard JSON.stringify
 * produces files that Gaea cannot open.
 */
function serializeJson(value: Json, indent: number = 2): string {
  return serializeValue(value, 0, indent);
}

function serializeValue(value: Json, depth: number, indent: number): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);

  const pad = " ".repeat(depth * indent);
  const innerPad = " ".repeat((depth + 1) * indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map(
      (item) => innerPad + serializeValue(item, depth + 1, indent)
    );
    return "[\n" + items.join(",\n") + "\n" + pad + "]";
  }

  // Object — enforce key ordering: $-prefixed keys first, then the rest
  const allKeys = Object.keys(value);
  if (allKeys.length === 0) return "{}";

  const PRIORITY = ["$id", "$ref", "$type", "$values"];
  const orderedKeys: string[] = [];
  for (const pk of PRIORITY) {
    if (pk in value) orderedKeys.push(pk);
  }
  for (const k of allKeys) {
    if (!PRIORITY.includes(k)) orderedKeys.push(k);
  }

  const entries = orderedKeys.map(
    (k) =>
      innerPad +
      JSON.stringify(k) +
      ": " +
      serializeValue(value[k], depth + 1, indent)
  );
  return "{\n" + entries.join(",\n") + "\n" + pad + "}";
}

export function writeTerrain(tf: TerrainFile): void {
  // Update timestamps
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
  if (tf.terrain.Metadata) {
    tf.terrain.Metadata.DateLastSaved = now;
  }
  if (tf.raw.Metadata) {
    tf.raw.Metadata.DateLastSaved = now;
  }
  fs.writeFileSync(tf.filePath, serializeJson(tf.raw), "utf-8");
}

// ─── Query helpers ───

export interface NodeSummary {
  id: number;
  name: string;
  type: string;       // short type name extracted from $type
  dotnetType: string;  // full $type
  position: { x: number; y: number };
  ports: { name: string; type: string; connectedFrom?: number }[];
  properties: Record<string, unknown>;
}

const INTERNAL_KEYS = new Set([
  "$id", "$type", "Id", "Name", "Position", "Ports", "Modifiers",
  "Version", "NodeSize", "GraphIndex",
]);

function extractShortType(dotnetType: string): string {
  // "QuadSpinner.Gaea.Nodes.Erosion2, Gaea.Nodes" → "Erosion2"
  const match = dotnetType?.match(/\.(\w+),/);
  return match ? match[1]! : dotnetType ?? "Unknown";
}

export function summarizeNode(nodeData: Json): NodeSummary {
  const ports = (nodeData.Ports?.$values ?? []).map((p: Json) => {
    const port: NodeSummary["ports"][number] = {
      name: p.Name,
      type: p.Type,
    };
    if (p.Record?.From !== undefined) {
      port.connectedFrom = p.Record.From;
    }
    return port;
  });

  const properties: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(nodeData)) {
    if (!INTERNAL_KEYS.has(k)) {
      properties[k] = v;
    }
  }

  return {
    id: nodeData.Id,
    name: nodeData.Name,
    type: extractShortType(nodeData.$type),
    dotnetType: nodeData.$type ?? "",
    position: {
      x: nodeData.Position?.X ?? 0,
      y: nodeData.Position?.Y ?? 0,
    },
    ports,
    properties,
  };
}

export function listConnections(tf: TerrainFile): { from: number; fromPort: string; to: number; toPort: string }[] {
  const connections: { from: number; fromPort: string; to: number; toPort: string }[] = [];
  for (const node of Object.values(tf.nodes)) {
    if (!node || node.$id === undefined && node.$ref !== undefined) continue;
    const ports = node.Ports?.$values ?? [];
    for (const port of ports) {
      if (port.Record && port.Record.IsValid) {
        connections.push({
          from: port.Record.From,
          fromPort: port.Record.FromPort,
          to: port.Record.To,
          toPort: port.Record.ToPort,
        });
      }
    }
  }
  return connections;
}

// ─── Mutation helpers ───

export function addNode(
  tf: TerrainFile,
  dotnetType: string,
  portDefs: PortDef[],
  options: {
    name?: string;
    position?: { x: number; y: number };
    properties?: Record<string, unknown>;
  } = {}
): number {
  const alloc = createIdAlloc(tf.raw);

  // Pick a new node ID (max existing + 1)
  let maxNodeId = 0;
  for (const key of Object.keys(tf.nodes)) {
    const n = parseInt(key, 10);
    if (!isNaN(n) && n > maxNodeId) maxNodeId = n;
  }
  const nodeId = maxNodeId + 1;

  const nodeRefId = alloc();
  const shortName = extractShortType(dotnetType);

  // Build ports array
  const portsValues: Json[] = portDefs.map((pd) => ({
    $id: alloc(),
    Name: pd.name,
    Type: pd.type,
    IsExporting: true,
    Parent: { $ref: nodeRefId },
  }));

  const node: Json = {
    $id: nodeRefId,
    $type: dotnetType,
    ...(options.properties ?? {}),
    Id: nodeId,
    Name: options.name ?? shortName,
    Position: {
      $id: alloc(),
      X: options.position?.x ?? 26500,
      Y: options.position?.y ?? 26250,
    },
    Ports: {
      $id: alloc(),
      $values: portsValues,
    },
    Modifiers: {
      $id: alloc(),
      $values: [],
    },
  };

  tf.nodes[String(nodeId)] = node;
  return nodeId;
}

export function removeNode(tf: TerrainFile, nodeId: number): void {
  const key = String(nodeId);
  if (!tf.nodes[key]) throw new Error(`Node ${nodeId} not found`);

  // Remove all connections pointing TO this node
  // (those are stored as Record on this node's ports — they go away with the node)

  // Remove all connections pointing FROM this node (stored on OTHER nodes' ports)
  for (const otherNode of Object.values(tf.nodes)) {
    if (!otherNode || otherNode.Id === nodeId) continue;
    const ports = otherNode.Ports?.$values;
    if (!ports) continue;
    for (const port of ports) {
      if (port.Record?.From === nodeId) {
        delete port.Record;
      }
    }
  }

  delete tf.nodes[key];

  // Update SelectedNode if it was this node
  if (tf.asset.State?.SelectedNode === nodeId) {
    tf.asset.State.SelectedNode = -1;
  }
}

export function connectNodes(
  tf: TerrainFile,
  fromNodeId: number,
  fromPortName: string,
  toNodeId: number,
  toPortName: string,
): void {
  const toNode = tf.nodes[String(toNodeId)];
  if (!toNode) throw new Error(`Destination node ${toNodeId} not found`);
  const fromNode = tf.nodes[String(fromNodeId)];
  if (!fromNode) throw new Error(`Source node ${fromNodeId} not found`);

  // Verify the source port exists
  const fromPorts: Json[] = fromNode.Ports?.$values ?? [];
  const srcPort = fromPorts.find((p: Json) => p.Name === fromPortName);
  if (!srcPort) throw new Error(`Port "${fromPortName}" not found on node ${fromNodeId}`);

  // Find the destination port
  const toPorts: Json[] = toNode.Ports?.$values ?? [];
  const dstPort = toPorts.find((p: Json) => p.Name === toPortName);
  if (!dstPort) throw new Error(`Port "${toPortName}" not found on node ${toNodeId}`);

  const alloc = createIdAlloc(tf.raw);

  // Set the Record on the destination port
  dstPort.Record = {
    $id: alloc(),
    From: fromNodeId,
    To: toNodeId,
    FromPort: fromPortName,
    ToPort: toPortName,
    IsValid: true,
  };
}

export function disconnectPort(
  tf: TerrainFile,
  nodeId: number,
  portName: string,
): void {
  const node = tf.nodes[String(nodeId)];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const ports: Json[] = node.Ports?.$values ?? [];
  const port = ports.find((p: Json) => p.Name === portName);
  if (!port) throw new Error(`Port "${portName}" not found on node ${nodeId}`);
  if (!port.Record) throw new Error(`Port "${portName}" on node ${nodeId} is not connected`);

  delete port.Record;
}

export function setNodeProperty(
  tf: TerrainFile,
  nodeId: number,
  property: string,
  value: unknown,
): void {
  const node = tf.nodes[String(nodeId)];
  if (!node) throw new Error(`Node ${nodeId} not found`);
  node[property] = value;
}

// ─── Create new terrain ───

export function createEmptyTerrain(filePath: string): TerrainFile {
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
  const projectId = randomUUID().slice(0, 8);
  const terrainId = randomUUID();

  // Structure matches Gaea 2.2.9 native output exactly
  const raw: Json = {
    $id: "1",
    Assets: {
      $id: "2",
      $values: [
        {
          $id: "3",
          Terrain: {
            $id: "4",
            Id: terrainId,
            Metadata: {
              $id: "5",
              Name: "",
              Description: "",
              Version: "2.2.9.0",
              DateCreated: now,
              DateLastBuilt: now,
              DateLastSaved: now,
            },
            Nodes: { $id: "6" },
            Groups: { $id: "7" },
            Notes: { $id: "8" },
            GraphTabs: {
              $id: "9",
              $values: [
                {
                  $id: "10",
                  Name: "Graph 1",
                  Color: "Brass",
                  ZoomFactor: 1.0,
                  ViewportLocation: { $id: "11", X: 26000.0, Y: 26000.0 },
                },
              ],
            },
            Width: 5000.0,
            Height: 2500.0,
            Ratio: 0.5,
            Regions: { $id: "12", $values: [] },
          },
          Automation: {
            $id: "13",
            Bindings: { $id: "14", $values: [] },
            Expressions: { $id: "15" },
            Variables: { $id: "16" },
          },
          BuildDefinition: {
            $id: "17",
            Type: "Standard",
            Destination: "<Builds>\\[Filename]\\[+++]",
            Resolution: 1024,
            BakeResolution: 2048,
            TileResolution: 1024,
            BucketResolution: 2048,
            NumberOfTiles: 3,
            EdgeBlending: 0.25,
            TileZeroIndex: true,
            TilePattern: "_y%Y%_x%X%",
            OrganizeFiles: "NodeSubFolder",
            ColorSpace: "sRGB",
          },
          State: {
            $id: "18",
            BakeResolution: 2048,
            PreviewResolution: 1024,
            HDResolution: 4096,
            SelectedNode: -1,
            NodeBookmarks: { $id: "19", $values: [] },
            Viewport: {
              $id: "20",
              CameraPosition: { $id: "21", $values: [] },
              Camera: { $id: "22" },
              RenderMode: "Realistic",
              AmbientOcclusion: true,
              Shadows: true,
            },
          },
          BuildProfiles: { $id: "23" },
        },
      ],
    },
    Id: projectId,
    Branch: 1,
    Metadata: {
      $id: "24",
      Name: "",
      Description: "",
      Version: "2.2.9.0",
      Edition: "Community",
      Owner: "",
      DateCreated: now,
      DateLastBuilt: now,
      DateLastSaved: now,
      ModifiedVersion: "2.2.9.0",
    },
  };

  const asset = raw.Assets.$values[0];
  const terrain = asset.Terrain;
  const nodes: Record<string, Json> = terrain.Nodes;

  return { raw, asset, terrain, nodes, filePath };
}
