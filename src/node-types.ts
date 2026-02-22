/**
 * Gaea node type registry.
 *
 * Each entry describes a node's .NET $type, default ports, and category.
 * Port definitions are derived from scanning all 59 Gaea 2.0 example files
 * (106 node types discovered). Additional types not found in examples but
 * known to exist are also included.
 */

export interface PortDef {
  name: string;
  type:
    | "PrimaryIn"
    | "PrimaryIn, Required"
    | "PrimaryOut"
    | "In"
    | "In, Required"
    | "Out";
}

export interface NodeTypeDef {
  /** Short key used by the MCP tool (e.g. "Mountain") */
  key: string;
  /** Full .NET $type value */
  dotnetType: string;
  /** Human-readable category */
  category: string;
  /** Default ports for this node type */
  ports: PortDef[];
}

// Helper to build a $type string
const T = (name: string) => `QuadSpinner.Gaea.Nodes.${name}, Gaea.Nodes`;

// Standard port sets
const PRIMARY_ONLY: PortDef[] = [
  { name: "In", type: "PrimaryIn" },
  { name: "Out", type: "PrimaryOut" },
];

const PRIMARY_REQUIRED: PortDef[] = [
  { name: "In", type: "PrimaryIn, Required" },
  { name: "Out", type: "PrimaryOut" },
];

export const NODE_TYPES: NodeTypeDef[] = [
  // ══════════════════════════════════════════════════════════════════════
  // Primitive / Generator
  // ══════════════════════════════════════════════════════════════════════
  { key: "Perlin", dotnetType: T("Perlin"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Noise", dotnetType: T("Noise"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Voronoi", dotnetType: T("Voronoi"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Cellular", dotnetType: T("Cellular"), category: "Primitive", ports: PRIMARY_ONLY },
  {
    key: "Cellular3D", dotnetType: T("Cellular3D"), category: "Primitive",
    ports: [
      { name: "In", type: "PrimaryIn" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Gap", type: "In" },
      { name: "Hashmap", type: "Out" },
    ],
  },
  { key: "RadialGradient", dotnetType: T("RadialGradient"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "LinearGradient", dotnetType: T("LinearGradient"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "Constant", dotnetType: T("Constant"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "File", dotnetType: T("File"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "MultiFractal", dotnetType: T("MultiFractal"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "DriftNoise", dotnetType: T("DriftNoise"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "WaveShine", dotnetType: T("WaveShine"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "DotNoise", dotnetType: T("DotNoise"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "LineNoise", dotnetType: T("LineNoise"), category: "Primitive", ports: PRIMARY_ONLY },
  { key: "RockNoise", dotnetType: T("RockNoise"), category: "Primitive", ports: PRIMARY_ONLY },
  {
    key: "Gabor", dotnetType: T("Gabor"), category: "Primitive",
    ports: [
      { name: "In", type: "PrimaryIn" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Modulation", type: "In" },
    ],
  },
  { key: "Draw", dotnetType: T("Draw"), category: "Primitive", ports: PRIMARY_ONLY },

  // ══════════════════════════════════════════════════════════════════════
  // Terrain
  // ══════════════════════════════════════════════════════════════════════
  { key: "Mountain", dotnetType: T("Mountain"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "MountainRange", dotnetType: T("MountainRange"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "MountainSide", dotnetType: T("MountainSide"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Ridge", dotnetType: T("Ridge"), category: "Terrain", ports: PRIMARY_ONLY },
  {
    key: "Canyon", dotnetType: T("Canyon"), category: "Terrain",
    ports: [
      { name: "In", type: "PrimaryIn" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Depth", type: "Out" },
    ],
  },
  { key: "Plates", dotnetType: T("Plates"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Volcano", dotnetType: T("Volcano"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Island", dotnetType: T("Island"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Crater", dotnetType: T("Crater"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "CraterField", dotnetType: T("CraterField"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Uplift", dotnetType: T("Uplift"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Rugged", dotnetType: T("Rugged"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Rockscape", dotnetType: T("Rockscape"), category: "Terrain", ports: PRIMARY_ONLY },
  { key: "Accumulator", dotnetType: T("Accumulator"), category: "Terrain", ports: PRIMARY_ONLY },

  // ══════════════════════════════════════════════════════════════════════
  // Simulate
  // ══════════════════════════════════════════════════════════════════════
  {
    key: "Erosion", dotnetType: T("Erosion"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "AreaMask", type: "In" },
      { name: "SedimentRemoval", type: "In" },
      { name: "Wear", type: "Out" },
      { name: "Deposits", type: "Out" },
      { name: "Flow", type: "Out" },
    ],
  },
  {
    key: "Erosion2", dotnetType: T("Erosion2"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
      { name: "Precipitation", type: "In" },
      { name: "Flow", type: "Out" },
      { name: "Wear", type: "Out" },
      { name: "Deposits", type: "Out" },
    ],
  },
  { key: "Thermal", dotnetType: T("Thermal"), category: "Simulate", ports: PRIMARY_REQUIRED },
  {
    key: "Thermal2", dotnetType: T("Thermal2"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "AreaMask", type: "In" },
      { name: "SedimentRemoval", type: "In" },
      { name: "Wear", type: "Out" },
      { name: "Deposits", type: "Out" },
    ],
  },
  {
    key: "Crumble", dotnetType: T("Crumble"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "AreaMask", type: "In" },
      { name: "Wear", type: "Out" },
    ],
  },
  {
    key: "Weathering", dotnetType: T("Weathering"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Height", type: "In" },
    ],
  },
  {
    key: "Snowfield", dotnetType: T("Snowfield"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Snow", type: "Out" },
      { name: "Hard", type: "Out" },
      { name: "Depth", type: "Out" },
    ],
  },
  {
    key: "Snow", dotnetType: T("Snow"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "SnowMap", type: "In" },
      { name: "MeltMap", type: "In" },
      { name: "Snow", type: "Out" },
      { name: "Hard", type: "Out" },
      { name: "Depth", type: "Out" },
    ],
  },
  {
    key: "Glacier", dotnetType: T("Glacier"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Reference", type: "In" },
      { name: "Snow", type: "Out" },
    ],
  },
  {
    key: "Rivers", dotnetType: T("Rivers"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Headwaters", type: "In" },
      { name: "Rivers", type: "Out" },
      { name: "Depth", type: "Out" },
      { name: "Surface", type: "Out" },
      { name: "Direction", type: "Out" },
    ],
  },
  {
    key: "Lake", dotnetType: T("Lake"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Precipitation", type: "In" },
      { name: "Water", type: "Out" },
      { name: "Depth", type: "Out" },
      { name: "Shore", type: "Out" },
      { name: "Surface", type: "Out" },
    ],
  },
  {
    key: "Sea", dotnetType: T("Sea"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Edge", type: "In" },
      { name: "Water", type: "Out" },
      { name: "Depth", type: "Out" },
      { name: "Shore", type: "Out" },
      { name: "Surface", type: "Out" },
    ],
  },
  {
    key: "Trees", dotnetType: T("Trees"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Inhibition", type: "In" },
      { name: "DeadZones", type: "Out" },
      { name: "Trees", type: "Out" },
      { name: "FreshWater", type: "Out" },
    ],
  },
  {
    key: "Sediments", dotnetType: T("Sediments"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Sediments", type: "Out" },
      { name: "Deposits", type: "Out" },
    ],
  },
  {
    key: "Anastomosis", dotnetType: T("Anastomosis"), category: "Simulate",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Flow", type: "Out" },
    ],
  },
  { key: "HydroFix", dotnetType: T("HydroFix"), category: "Simulate", ports: PRIMARY_REQUIRED },

  // ══════════════════════════════════════════════════════════════════════
  // Surface
  // ══════════════════════════════════════════════════════════════════════
  { key: "Craggy", dotnetType: T("Craggy"), category: "Surface", ports: PRIMARY_ONLY },
  {
    key: "Sandstone", dotnetType: T("Sandstone"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Layers", type: "Out" },
    ],
  },
  {
    key: "Stratify", dotnetType: T("Stratify"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Layers", type: "Out" },
    ],
  },
  {
    key: "Terraces", dotnetType: T("Terraces"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Modulation", type: "In" },
    ],
  },
  {
    key: "FractalTerraces", dotnetType: T("FractalTerraces"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Modulation", type: "In" },
      { name: "Layers", type: "Out" },
    ],
  },
  { key: "Roughen", dotnetType: T("Roughen"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Outcrops", dotnetType: T("Outcrops"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Slump", dotnetType: T("Slump"), category: "Surface", ports: PRIMARY_ONLY },
  { key: "Stones", dotnetType: T("Stones"), category: "Surface", ports: PRIMARY_REQUIRED },
  {
    key: "Fold", dotnetType: T("Fold"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Folds", type: "In" },
    ],
  },
  { key: "Pockmarks", dotnetType: T("Pockmarks"), category: "Surface", ports: PRIMARY_REQUIRED },
  { key: "Texturizer", dotnetType: T("Texturizer"), category: "Surface", ports: PRIMARY_REQUIRED },
  {
    key: "Scree", dotnetType: T("Scree"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Guide", type: "In" },
      { name: "Stones", type: "Out" },
    ],
  },
  {
    key: "Debris", dotnetType: T("Debris"), category: "Surface",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Emitter", type: "In" },
      { name: "ColorIndex", type: "Out" },
      { name: "Debris", type: "Out" },
    ],
  },
  { key: "Distress", dotnetType: T("Distress"), category: "Surface", ports: PRIMARY_REQUIRED },

  // ══════════════════════════════════════════════════════════════════════
  // Modify
  // ══════════════════════════════════════════════════════════════════════
  {
    key: "Warp", dotnetType: T("Warp"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Modulator", type: "In" },
    ],
  },
  {
    key: "DirectionalWarp", dotnetType: T("DirectionalWarp"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Custom", type: "In" },
    ],
  },
  {
    key: "SlopeWarp", dotnetType: T("SlopeWarp"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Guide", type: "In, Required" },
    ],
  },
  {
    key: "SlopeBlur", dotnetType: T("SlopeBlur"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Guide", type: "In, Required" },
    ],
  },
  { key: "Shaper", dotnetType: T("Shaper"), category: "Modify", ports: PRIMARY_REQUIRED },
  {
    key: "ThermalShaper", dotnetType: T("ThermalShaper"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Intensity", type: "In" },
    ],
  },
  {
    key: "Transform", dotnetType: T("Transform"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Base", type: "In" },
    ],
  },
  { key: "Blur", dotnetType: T("Blur"), category: "Modify", ports: PRIMARY_REQUIRED },
  {
    key: "Clamp", dotnetType: T("Clamp"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
    ],
  },
  { key: "Curve", dotnetType: T("Curve"), category: "Modify", ports: PRIMARY_REQUIRED },
  {
    key: "Seamless", dotnetType: T("Seamless"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Color", type: "In" },
      { name: "Texture", type: "Out" },
    ],
  },
  {
    key: "Repeat", dotnetType: T("Repeat"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Color", type: "In" },
      { name: "Texture", type: "Out" },
    ],
  },
  { key: "Deflate", dotnetType: T("Deflate"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Swirl", dotnetType: T("Swirl"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Dilate", dotnetType: T("Dilate"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Median", dotnetType: T("Median"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Autolevel", dotnetType: T("Autolevel"), category: "Modify", ports: PRIMARY_REQUIRED },
  {
    key: "GraphicEQ", dotnetType: T("GraphicEQ"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
    ],
  },
  { key: "Threshold", dotnetType: T("Threshold"), category: "Modify", ports: PRIMARY_REQUIRED },
  { key: "Filter", dotnetType: T("Filter"), category: "Modify", ports: PRIMARY_REQUIRED },
  {
    key: "Adjust", dotnetType: T("Adjust"), category: "Modify",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Derive / Data
  // ══════════════════════════════════════════════════════════════════════
  { key: "Slope", dotnetType: T("Slope"), category: "Derive", ports: PRIMARY_REQUIRED },
  {
    key: "Height", dotnetType: T("Height"), category: "Derive",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
    ],
  },
  { key: "Curvature", dotnetType: T("Curvature"), category: "Derive", ports: PRIMARY_REQUIRED },
  {
    key: "FlowMap", dotnetType: T("FlowMap"), category: "Derive",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Precipitation", type: "In" },
    ],
  },
  { key: "Occlusion", dotnetType: T("Occlusion"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "RockMap", dotnetType: T("RockMap"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "Distance", dotnetType: T("Distance"), category: "Derive", ports: PRIMARY_REQUIRED },
  { key: "DataExtractor", dotnetType: T("DataExtractor"), category: "Derive", ports: PRIMARY_REQUIRED },

  // ══════════════════════════════════════════════════════════════════════
  // Colorize
  // ══════════════════════════════════════════════════════════════════════
  { key: "SatMap", dotnetType: T("SatMap"), category: "Colorize", ports: PRIMARY_REQUIRED },
  { key: "Synth", dotnetType: T("Synth"), category: "Colorize", ports: PRIMARY_REQUIRED },
  { key: "CLUTer", dotnetType: T("CLUTer"), category: "Colorize", ports: PRIMARY_REQUIRED },
  {
    key: "ColorErosion", dotnetType: T("ColorErosion"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Height", type: "In" },
      { name: "Precipitation", type: "In" },
    ],
  },
  { key: "Tint", dotnetType: T("Tint"), category: "Colorize", ports: PRIMARY_REQUIRED },
  {
    key: "Shade", dotnetType: T("Shade"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Height", type: "In" },
    ],
  },
  {
    key: "SuperColor", dotnetType: T("SuperColor"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Texture", type: "In" },
    ],
  },
  {
    key: "WaterColor", dotnetType: T("WaterColor"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Guide", type: "In, Required" },
      { name: "Color", type: "Out" },
      { name: "M\u0251sk", type: "Out" },
      { name: "Stillwater", type: "Out" },
      { name: "Rivers", type: "Out" },
    ],
  },
  {
    key: "Cartography", dotnetType: T("Cartography"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Water", type: "In" },
      { name: "LandColor", type: "In" },
      { name: "WaterColor", type: "In" },
      { name: "Decorations", type: "Out" },
      { name: "LandContours", type: "Out" },
      { name: "WaterContours", type: "Out" },
      { name: "Grid", type: "Out" },
    ],
  },
  {
    key: "TextureBase", dotnetType: T("TextureBase"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Guide", type: "In" },
    ],
  },
  {
    key: "GroundTexture", dotnetType: T("GroundTexture"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Mask", type: "In" },
    ],
  },
  {
    key: "LightX", dotnetType: T("LightX"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Texture", type: "In" },
      { name: "Diffuse", type: "Out" },
      { name: "Shadow", type: "Out" },
      { name: "AO", type: "Out" },
    ],
  },
  { key: "HSL", dotnetType: T("HSL"), category: "Colorize", ports: PRIMARY_REQUIRED },
  {
    key: "RGBSplit", dotnetType: T("RGBSplit"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "R", type: "Out" },
      { name: "G", type: "Out" },
      { name: "B", type: "Out" },
    ],
  },
  {
    key: "RGBMerge", dotnetType: T("RGBMerge"), category: "Colorize",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "In2", type: "In, Required" },
      { name: "In3", type: "In, Required" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Utility
  // ══════════════════════════════════════════════════════════════════════
  {
    key: "Combine", dotnetType: T("Combine"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Input2", type: "In" },
      { name: "Input3", type: "In" },
      { name: "Input4", type: "In" },
      { name: "Mask", type: "In" },
    ],
  },
  {
    key: "Switch", dotnetType: T("Switch"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Alternate", type: "In" },
    ],
  },
  {
    key: "Route", dotnetType: T("Route"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Input2", type: "In" },
      { name: "Input3", type: "In" },
      { name: "Input4", type: "In" },
      { name: "Input5", type: "In" },
      { name: "Input6", type: "In" },
      { name: "Input7", type: "In" },
      { name: "Input8", type: "In" },
      { name: "Input9", type: "In" },
      { name: "Input10", type: "In" },
    ],
  },
  { key: "Chokepoint", dotnetType: T("Chokepoint"), category: "Utility", ports: PRIMARY_REQUIRED },
  {
    key: "Mixer", dotnetType: T("Mixer"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Terrain", type: "In" },
      { name: "Layer1", type: "In" },
      { name: "Mask1", type: "In" },
      { name: "MaskOut1", type: "Out" },
      { name: "Layer2", type: "In" },
      { name: "Mask2", type: "In" },
      { name: "MaskOut2", type: "Out" },
      { name: "Layer3", type: "In" },
      { name: "Mask3", type: "In" },
      { name: "MaskOut3", type: "Out" },
      { name: "Layer4", type: "In" },
      { name: "Mask4", type: "In" },
      { name: "MaskOut4", type: "Out" },
    ],
  },
  {
    key: "Mask", dotnetType: T("Mask"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "In2", type: "In" },
      { name: "Mask", type: "In" },
    ],
  },
  {
    key: "Transpose", dotnetType: T("Transpose"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Reference", type: "In, Required" },
      { name: "Mask", type: "In" },
    ],
  },
  {
    key: "Compare", dotnetType: T("Compare"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "In2", type: "In, Required" },
    ],
  },
  {
    key: "LoopBegin", dotnetType: T("LoopBegin"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Processes", type: "In" },
    ],
  },
  {
    key: "LoopEnd", dotnetType: T("LoopEnd"), category: "Utility",
    ports: [
      { name: "In", type: "PrimaryIn, Required" },
      { name: "Out", type: "PrimaryOut" },
      { name: "Processes", type: "In" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // Output
  // ══════════════════════════════════════════════════════════════════════
  { key: "Export", dotnetType: T("Export"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Mesher", dotnetType: T("Mesher"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Unreal", dotnetType: T("Unreal"), category: "Output", ports: PRIMARY_REQUIRED },
  { key: "Unity", dotnetType: T("Unity"), category: "Output", ports: PRIMARY_REQUIRED },
];

/** Lookup by key (case-insensitive) */
export function findNodeType(key: string): NodeTypeDef | undefined {
  const lower = key.toLowerCase();
  return NODE_TYPES.find((n) => n.key.toLowerCase() === lower);
}

/** Lookup by $type string */
export function findNodeTypeByDotnet(dotnetType: string): NodeTypeDef | undefined {
  return NODE_TYPES.find((n) => n.dotnetType === dotnetType);
}
