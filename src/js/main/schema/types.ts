import { z } from "zod";

// --- Easing ---

export const EasingSchema = z.enum(["linear", "easeIn", "easeOut", "easeInOut", "hold"]);

export type Easing = z.infer<typeof EasingSchema>;

// --- Keyframes ---

export const TupleKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.tuple([z.number(), z.number()]),
  easing: EasingSchema.optional(),
});

export const ScalarKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.number(),
  easing: EasingSchema.optional(),
});

export const OpacityKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.number().min(0).max(100),
  easing: EasingSchema.optional(),
});

export const ColorKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.tuple([z.number(), z.number(), z.number()]),  // RGB 0-1 range
  easing: EasingSchema.optional(),
});

// --- Transform ---

export const TransformExpressionsSchema = z.object({
  anchorPoint: z.string().optional(),
  position: z.string().optional(),
  positionX: z.string().optional(),
  positionY: z.string().optional(),
  positionZ: z.string().optional(),
  scale: z.string().optional(),
  rotation: z.string().optional(),
  rotationX: z.string().optional(),
  rotationY: z.string().optional(),
  opacity: z.string().optional(),
}).strict().optional();

export const TransformSchema = z
  .object({
    anchorPoint: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    position: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    positionX: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    positionY: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    positionZ: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    scale: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    rotation: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    rotationX: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    rotationY: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    opacity: z
      .union([z.number().min(0).max(100), z.array(OpacityKeyframeSchema).min(2)])
      .optional(),
    expressions: TransformExpressionsSchema,
  })
  .strict()
  .refine(
    (t) => {
      // Can't use both position and positionX/positionY/positionZ
      if (t.position !== undefined && (t.positionX !== undefined || t.positionY !== undefined || t.positionZ !== undefined)) {
        return false;
      }
      return true;
    },
    { message: "Cannot use 'position' together with 'positionX', 'positionY', or 'positionZ'" }
  )
  .optional();

export type Transform = z.infer<typeof TransformSchema>;

// --- Effects ---

export const EffectKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.union([z.number(), z.boolean(), z.array(z.number())]),
  easing: EasingSchema.optional(),
});

export const EffectPropertyValueSchema = z.union([
  z.number(),
  z.boolean(),
  z.array(z.number()),
  z.array(EffectKeyframeSchema).min(2),
]);

export type EffectPropertyValue = z.infer<typeof EffectPropertyValueSchema>;

export const EffectSchema = z.object({
  name: z.string().min(1),
  matchName: z.string().optional(),
  enabled: z.boolean().optional(),
  properties: z.record(z.string(), EffectPropertyValueSchema).optional(),
  expressions: z.record(z.string(), z.string()).optional(),
});

export type Effect = z.infer<typeof EffectSchema>;

// --- Layer Styles ---

export const LayerStyleTypeSchema = z.enum([
  "dropShadow",
  "innerShadow",
  "outerGlow",
  "innerGlow",
  "bevelEmboss",
  "satin",
  "colorOverlay",
  "gradientOverlay",
  "stroke",
]);

export type LayerStyleType = z.infer<typeof LayerStyleTypeSchema>;

export const LayerStyleSchema = z.object({
  type: LayerStyleTypeSchema,
  enabled: z.boolean().optional(),
  properties: z.record(z.string(), EffectPropertyValueSchema).optional(),
  expressions: z.record(z.string(), z.string()).optional(),
});

export type LayerStyle = z.infer<typeof LayerStyleSchema>;

// --- Shape Layer Schemas ---

export const ShapeFillSchema = z.object({
  color: z.union([
    z.string().regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color (e.g. FF5500)"),
    z.array(ColorKeyframeSchema).min(2),
  ]),
  opacity: z.union([
    z.number().min(0).max(100),
    z.array(OpacityKeyframeSchema).min(2),
  ]).optional(),
});

export type ShapeFill = z.infer<typeof ShapeFillSchema>;

export const ShapeStrokeSchema = z.object({
  color: z.union([
    z.string().regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color (e.g. 000000)"),
    z.array(ColorKeyframeSchema).min(2),
  ]),
  width: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
  opacity: z.union([
    z.number().min(0).max(100),
    z.array(OpacityKeyframeSchema).min(2),
  ]).optional(),
});

export type ShapeStroke = z.infer<typeof ShapeStrokeSchema>;

const BaseShapeSchema = z.object({
  name: z.string().optional(),
  position: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(TupleKeyframeSchema).min(2),
  ]).optional(),
  fill: ShapeFillSchema.optional(),
  stroke: ShapeStrokeSchema.optional(),
});

export const RectangleShapeSchema = BaseShapeSchema.extend({
  type: z.literal("rectangle"),
  size: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(TupleKeyframeSchema).min(2),
  ]),
  roundness: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
});

export type RectangleShape = z.infer<typeof RectangleShapeSchema>;

export const EllipseShapeSchema = BaseShapeSchema.extend({
  type: z.literal("ellipse"),
  size: z.union([
    z.tuple([z.number(), z.number()]),
    z.array(TupleKeyframeSchema).min(2),
  ]),
});

export type EllipseShape = z.infer<typeof EllipseShapeSchema>;

export const PolygonShapeSchema = BaseShapeSchema.extend({
  type: z.literal("polygon"),
  points: z.union([
    z.number().int().min(3),
    z.array(ScalarKeyframeSchema).min(2),
  ]),
  outerRadius: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]),
  outerRoundness: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
  rotation: z.union([
    z.number(),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
});

export type PolygonShape = z.infer<typeof PolygonShapeSchema>;

export const StarShapeSchema = BaseShapeSchema.extend({
  type: z.literal("star"),
  points: z.union([
    z.number().int().min(3),
    z.array(ScalarKeyframeSchema).min(2),
  ]),
  outerRadius: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]),
  innerRadius: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]),
  outerRoundness: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
  innerRoundness: z.union([
    z.number().min(0),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
  rotation: z.union([
    z.number(),
    z.array(ScalarKeyframeSchema).min(2),
  ]).optional(),
});

export type StarShape = z.infer<typeof StarShapeSchema>;

const PathShapeBaseSchema = BaseShapeSchema.extend({
  type: z.literal("path"),
  vertices: z.array(z.tuple([z.number(), z.number()])).min(2),
  inTangents: z.array(z.tuple([z.number(), z.number()])).optional(),
  outTangents: z.array(z.tuple([z.number(), z.number()])).optional(),
  closed: z.boolean().optional(),
});

function validatePathTangents(shape: {
  vertices: [number, number][];
  inTangents?: [number, number][];
  outTangents?: [number, number][];
}): boolean {
  if (shape.inTangents && shape.inTangents.length !== shape.vertices.length) return false;
  if (shape.outTangents && shape.outTangents.length !== shape.vertices.length) return false;
  return true;
}

export const PathShapeSchema = PathShapeBaseSchema.superRefine((shape, ctx) => {
  if (!validatePathTangents(shape)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "inTangents/outTangents must match vertices length",
    });
  }
});

export type PathShape = z.infer<typeof PathShapeSchema>;

export const ShapeSchema = z
  .discriminatedUnion("type", [
  RectangleShapeSchema,
  EllipseShapeSchema,
  PolygonShapeSchema,
  StarShapeSchema,
  PathShapeBaseSchema,
  ])
  .superRefine((shape, ctx) => {
    if (shape.type === "path" && !validatePathTangents(shape)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "inTangents/outTangents must match vertices length",
      });
    }
  });

export type Shape = z.infer<typeof ShapeSchema>;

// --- Mask Schemas ---

const MaskPathSchema = z
  .object({
    vertices: z.array(z.tuple([z.number(), z.number()])).min(2),
    inTangents: z.array(z.tuple([z.number(), z.number()])).optional(),
    outTangents: z.array(z.tuple([z.number(), z.number()])).optional(),
    closed: z.boolean().optional(),
  })
  .refine(
    (shape) => {
      if (shape.inTangents && shape.inTangents.length !== shape.vertices.length) return false;
      if (shape.outTangents && shape.outTangents.length !== shape.vertices.length) return false;
      return true;
    },
    { message: "inTangents/outTangents must match vertices length" }
  );

const MaskPathKeyframeSchema = z.object({
  time: z.number(),
  value: MaskPathSchema,
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut", "hold"]).optional(),
});

export const MaskSchema = z.object({
  name: z.string().optional(),
  path: z.union([MaskPathSchema, z.array(MaskPathKeyframeSchema).min(2)]),
  mode: z.enum(["add", "subtract", "intersect", "lighten", "darken", "difference", "none"]).optional(),
  opacity: z
    .union([z.number().min(0).max(100), z.array(OpacityKeyframeSchema).min(2)])
    .optional(),
  feather: z
    .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
    .optional(),
  expansion: z
    .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
    .optional(),
  inverted: z.boolean().optional(),
});

export type Mask = z.infer<typeof MaskSchema>;

// --- Text Animators ---

const TextAnimatorPropertiesSchema = z
  .object({
    opacity: z.union([z.number().min(0).max(100), z.array(OpacityKeyframeSchema).min(2)]).optional(),
    position: z.union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)]).optional(),
    scale: z.union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)]).optional(),
    rotation: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
    anchorPoint: z.union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)]).optional(),
    tracking: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
  })
  .refine((props) => Object.keys(props).length > 0, {
    message: "Text animator properties cannot be empty",
  });

const TextAnimatorSelectorSchema = z
  .object({
    start: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
    end: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
    offset: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
    smoothness: z.union([z.number(), z.array(ScalarKeyframeSchema).min(2)]).optional(),
  })
  .optional();

export const TextAnimatorSchema = z.object({
  name: z.string().optional(),
  properties: TextAnimatorPropertiesSchema,
  selector: TextAnimatorSelectorSchema,
});

export type TextAnimator = z.infer<typeof TextAnimatorSchema>;

// --- Layer quality modes ---

export const QualityModeSchema = z.enum(["best", "draft", "wireframe"]).optional();

export const SamplingQualitySchema = z.enum(["bicubic", "bilinear"]).optional();

export const AutoOrientSchema = z
  .enum(["off", "alongPath", "cameraOrPointOfInterest"])
  .optional();

export const FrameBlendingTypeSchema = z
  .enum(["none", "frameMix", "pixelMotion"])
  .optional();

export const TrackMatteTypeSchema = z
  .enum(["none", "alpha", "alphaInverted", "luma", "lumaInverted"])
  .optional();

// --- Blending modes (AE subset) ---

export const BlendingModeSchema = z
  .enum([
    "normal",
    "dissolve",
    "darken",
    "multiply",
    "colorBurn",
    "linearBurn",
    "darkerColor",
    "lighten",
    "screen",
    "colorDodge",
    "linearDodge",
    "lighterColor",
    "overlay",
    "softLight",
    "hardLight",
    "vividLight",
    "linearLight",
    "pinLight",
    "hardMix",
    "difference",
    "exclusion",
    "subtract",
    "divide",
    "hue",
    "saturation",
    "color",
    "luminosity",
  ])
  .optional();

// --- Layer ---

export const LayerSchema = z
  .object({
    name: z.string().min(1),
    type: z
      .enum(["solid", "null", "adjustment", "text", "camera", "light", "shape", "audio"])
      .optional(),
    file: z.union([z.string(), z.number()]).optional(),
    composition: z.string().optional(),

    // Timing
    inPoint: z.number().min(0).optional(),
    outPoint: z.number().min(0).optional(),
    startTime: z.number().optional(),

    // Solid-specific
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    color: z
      .string()
      .regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color (e.g. FF0000)")
      .optional(),

    // Text-specific
    text: z.string().optional(),
    fontSize: z.number().positive().optional(),
    font: z.string().optional(),
    fillColor: z
      .string()
      .regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color (e.g. FFFFFF)")
      .optional(),
    strokeColor: z
      .string()
      .regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color (e.g. 000000)")
      .optional(),
    strokeWidth: z.number().min(0).optional(),
    tracking: z.number().optional(),
    leading: z.number().positive().optional(),
    justification: z.enum(["left", "center", "right"]).optional(),

    // Camera-specific
    cameraType: z.enum(["oneNode", "twoNode"]).optional(),
    zoom: z.number().positive().optional(),
    depthOfField: z.boolean().optional(),
    focusDistance: z.number().positive().optional(),
    aperture: z.number().positive().optional(),
    blurLevel: z.number().min(0).max(100).optional(),

    // Light-specific
    lightType: z.enum(["parallel", "spot", "point", "ambient"]).optional(),
    intensity: z.number().min(0).optional(),
    lightColor: z
      .string()
      .regex(/^[0-9a-fA-F]{6}$/, "Must be a 6-character hex color")
      .optional(),
    coneAngle: z.number().min(0).max(180).optional(),
    coneFeather: z.number().min(0).max(100).optional(),
    castsShadows: z.boolean().optional(),
    shadowDarkness: z.number().min(0).max(100).optional(),
    shadowDiffusion: z.number().min(0).optional(),

    // Shape-specific
    shapes: z.array(ShapeSchema).optional(),
    // Masks
    masks: z.array(MaskSchema).optional(),
    // Text animators (text layers)
    textAnimators: z.array(TextAnimatorSchema).optional(),

    // Layer properties
    enabled: z.boolean().optional(),
    shy: z.boolean().optional(),
    locked: z.boolean().optional(),
    threeDLayer: z.boolean().optional(),
    parent: z.string().optional(),
    blendingMode: BlendingModeSchema,

    // Additional boolean flags
    solo: z.boolean().optional(),
    audioEnabled: z.boolean().optional(),
    motionBlur: z.boolean().optional(),
    collapseTransformation: z.boolean().optional(),
    guideLayer: z.boolean().optional(),
    effectsActive: z.boolean().optional(),
    timeRemapEnabled: z.boolean().optional(),

    // Quality and rendering
    quality: QualityModeSchema,
    samplingQuality: SamplingQualitySchema,
    autoOrient: AutoOrientSchema,
    frameBlendingType: FrameBlendingTypeSchema,
    trackMatteType: TrackMatteTypeSchema,

    // Numeric properties
    label: z.number().int().min(0).max(16).optional(),

    // Transform
    transform: TransformSchema,

    // Effects
    effects: z.array(EffectSchema).optional(),

    // Layer Styles
    layerStyles: z.array(LayerStyleSchema).optional(),
  })
  .refine(
    (layer) => {
      // A layer must have exactly one of type, file, or composition
      const has = [layer.type, layer.file, layer.composition].filter(
        (v) => v !== undefined
      ).length;
      if (layer.type === "audio") {
        return layer.file !== undefined && layer.composition === undefined;
      }
      return has === 1;
    },
    {
      message:
        "Layer must have exactly one of 'type', 'file', or 'composition' specified (audio requires 'file')",
    }
  )
  .refine(
    (layer) => {
      // Solid layers require color
      if (layer.type === "solid" && !layer.color) {
        return false;
      }
      return true;
    },
    { message: "Solid layers require a 'color' property" }
  )
  .refine(
    (layer) => {
      // Text layers require text content
      if (layer.type === "text" && !layer.text) {
        return false;
      }
      return true;
    },
    { message: "Text layers require a 'text' property" }
  )
  .refine(
    (layer) => {
      // Light layers require lightType
      if (layer.type === "light" && !layer.lightType) {
        return false;
      }
      return true;
    },
    { message: "Light layers require a 'lightType' property (parallel, spot, point, ambient)" }
  )
  .refine(
    (layer) => {
      // Shape layers require shapes array with at least one shape
      if (layer.type === "shape" && (!layer.shapes || layer.shapes.length === 0)) {
        return false;
      }
      return true;
    },
    { message: "Shape layers require a 'shapes' array with at least one shape" }
  );

export type Layer = z.infer<typeof LayerSchema>;

// --- Essential Graphics ---

export const EssentialGraphicsItemSchema = z.union([
  z.string().min(1), // Simple form: "layer.transform.position"
  z.object({
    property: z.string().min(1),
    name: z.string().min(1).optional(), // Optional: uses property path as display name if not specified
    encodePathInName: z.boolean().optional(), // Set to false to disable path encoding in controller name
  }),
]);

export type EssentialGraphicsItem = z.infer<typeof EssentialGraphicsItemSchema>;

// --- Markers ---

export const MarkerSchema = z.object({
  time: z.number().min(0),
  comment: z.string().optional(),
  duration: z.number().min(0).optional(),
  chapter: z.string().optional(),
  url: z.string().optional(),
  label: z.number().int().min(0).max(16).optional(),
});

export type Marker = z.infer<typeof MarkerSchema>;

// --- Composition ---

export const CompSchema = z.object({
  name: z.string().min(1),
  width: z.number().int().positive().default(1920),
  height: z.number().int().positive().default(1080),
  duration: z.number().positive().default(10),
  framerate: z.number().positive().default(30),
  pixelAspect: z.number().positive().default(1),
  color: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/)
    .default("000000"),
  folder: z.string().optional(),
  layers: z.array(LayerSchema).optional(),
  essentialGraphics: z.array(EssentialGraphicsItemSchema).optional(),
  markers: z.array(MarkerSchema).optional(),
});

export type Comp = z.infer<typeof CompSchema>;

// --- File ---

export const FileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  path: z.string().min(1),
  sequence: z.boolean().optional(),
  folder: z.string().optional(),
});

export type FileItem = z.infer<typeof FileSchema>;

// --- Folder ---

export const FolderSchema = z.object({
  name: z.string().min(1),
  parent: z.string().optional(),
});

export type FolderItem = z.infer<typeof FolderSchema>;

// --- Root document ---

export const CompdownDocumentSchema = z
  .object({
    folders: z.array(FolderSchema).optional(),
    files: z.array(FileSchema).optional(),
    compositions: z.array(CompSchema).optional(),
  })
  .refine(
    (doc) => {
      // Must have at least one section
      return (
        (doc.folders && doc.folders.length > 0) ||
        (doc.files && doc.files.length > 0) ||
        (doc.compositions && doc.compositions.length > 0)
      );
    },
    { message: "Document must contain at least one of: folders, files, compositions" }
  );

export type CompdownDocument = z.infer<typeof CompdownDocumentSchema>;
