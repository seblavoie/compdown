import { z } from "zod";

// --- Keyframes ---

export const TupleKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.tuple([z.number(), z.number()]),
});

export const ScalarKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.number(),
});

export const OpacityKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.number().min(0).max(100),
});

// --- Transform ---

export const TransformSchema = z
  .object({
    anchorPoint: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    position: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    scale: z
      .union([z.tuple([z.number(), z.number()]), z.array(TupleKeyframeSchema).min(2)])
      .optional(),
    rotation: z
      .union([z.number(), z.array(ScalarKeyframeSchema).min(2)])
      .optional(),
    opacity: z
      .union([z.number().min(0).max(100), z.array(OpacityKeyframeSchema).min(2)])
      .optional(),
  })
  .strict()
  .optional();

export type Transform = z.infer<typeof TransformSchema>;

// --- Effects ---

export const EffectKeyframeSchema = z.object({
  time: z.number().min(0),
  value: z.union([z.number(), z.boolean(), z.array(z.number())]),
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
});

export type Effect = z.infer<typeof EffectSchema>;

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
    type: z.enum(["solid", "null", "adjustment", "text"]).optional(),
    file: z.union([z.string(), z.number()]).optional(),
    comp: z.string().optional(),

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
  })
  .refine(
    (layer) => {
      // A layer must have exactly one of type, file, or comp
      const has = [layer.type, layer.file, layer.comp].filter(
        (v) => v !== undefined
      ).length;
      return has === 1;
    },
    {
      message:
        "Layer must have exactly one of 'type', 'file', or 'comp' specified",
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
  );

export type Layer = z.infer<typeof LayerSchema>;

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
