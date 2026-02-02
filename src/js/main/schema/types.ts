import { z } from "zod";

// --- Transform ---

export const TransformSchema = z
  .object({
    anchorPoint: z.tuple([z.number(), z.number()]).optional(),
    position: z.tuple([z.number(), z.number()]).optional(),
    scale: z.tuple([z.number(), z.number()]).optional(),
    rotation: z.number().optional(),
    opacity: z.number().min(0).max(100).optional(),
  })
  .strict()
  .optional();

export type Transform = z.infer<typeof TransformSchema>;

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

    // Transform
    transform: TransformSchema,
  })
  .refine(
    (layer) => {
      // A layer must have either a type or a file reference
      return layer.type !== undefined || layer.file !== undefined;
    },
    { message: "Layer must have either 'type' or 'file' specified" }
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
    comps: z.array(CompSchema).optional(),
  })
  .refine(
    (doc) => {
      // Must have at least one section
      return (
        (doc.folders && doc.folders.length > 0) ||
        (doc.files && doc.files.length > 0) ||
        (doc.comps && doc.comps.length > 0)
      );
    },
    { message: "Document must contain at least one of: folders, files, comps" }
  );

export type CompdownDocument = z.infer<typeof CompdownDocumentSchema>;
