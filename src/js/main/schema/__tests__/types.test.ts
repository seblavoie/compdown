import { describe, it, expect } from "vitest";
import {
  TransformSchema,
  LayerSchema,
  CompSchema,
  FileSchema,
  FolderSchema,
  CompdownDocumentSchema,
  BlendingModeSchema,
  TupleKeyframeSchema,
  ScalarKeyframeSchema,
  OpacityKeyframeSchema,
  EffectSchema,
} from "../types";

// ---------------------------------------------------------------------------
// TransformSchema
// ---------------------------------------------------------------------------

describe("TransformSchema", () => {
  // TransformSchema is optional at the top level; unwrap for direct testing
  const Schema = TransformSchema.unwrap();

  it("accepts a valid full transform", () => {
    const result = Schema.safeParse({
      anchorPoint: [960, 540],
      position: [100, 200],
      scale: [100, 100],
      rotation: 45,
      opacity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    const result = Schema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects opacity below 0", () => {
    const result = Schema.safeParse({ opacity: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects opacity above 100", () => {
    const result = Schema.safeParse({ opacity: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects extra keys (strict mode)", () => {
    const result = Schema.safeParse({ opacity: 50, foo: "bar" });
    expect(result.success).toBe(false);
  });

  it("rejects non-tuple position", () => {
    const result = Schema.safeParse({ position: [1, 2, 3] });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TransformSchema (keyframes)
// ---------------------------------------------------------------------------

describe("TransformSchema (keyframes)", () => {
  const Schema = TransformSchema.unwrap();

  it("accepts static values (backward compat)", () => {
    const result = Schema.safeParse({
      position: [100, 200],
      rotation: 45,
      opacity: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed position", () => {
    const result = Schema.safeParse({
      position: [
        { time: 0, value: [0, 0] },
        { time: 5, value: [1920, 1080] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed rotation", () => {
    const result = Schema.safeParse({
      rotation: [
        { time: 0, value: 0 },
        { time: 3, value: 360 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed scale", () => {
    const result = Schema.safeParse({
      scale: [
        { time: 0, value: [0, 0] },
        { time: 1, value: [100, 100] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed anchorPoint", () => {
    const result = Schema.safeParse({
      anchorPoint: [
        { time: 0, value: [0, 0] },
        { time: 2, value: [960, 540] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed opacity", () => {
    const result = Schema.safeParse({
      opacity: [
        { time: 0, value: 0 },
        { time: 2, value: 100 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects keyframed opacity out of range (value: 150)", () => {
    const result = Schema.safeParse({
      opacity: [
        { time: 0, value: 0 },
        { time: 2, value: 150 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects single keyframe (min 2)", () => {
    const result = Schema.safeParse({
      position: [{ time: 0, value: [0, 0] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative time", () => {
    const result = Schema.safeParse({
      rotation: [
        { time: -1, value: 0 },
        { time: 2, value: 90 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing time field", () => {
    const result = Schema.safeParse({
      rotation: [{ value: 0 }, { time: 2, value: 90 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing value field", () => {
    const result = Schema.safeParse({
      rotation: [
        { time: 0 },
        { time: 2, value: 90 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts mixed static + keyframed properties", () => {
    const result = Schema.safeParse({
      rotation: 45,
      position: [
        { time: 0, value: [0, 0] },
        { time: 5, value: [1920, 1080] },
      ],
      opacity: [
        { time: 0, value: 0 },
        { time: 2, value: 100 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects extra keys on transform (strict)", () => {
    const result = Schema.safeParse({
      rotation: 45,
      foo: "bar",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BlendingModeSchema
// ---------------------------------------------------------------------------

describe("BlendingModeSchema", () => {
  const Schema = BlendingModeSchema.unwrap();

  it("accepts valid blending modes", () => {
    for (const mode of ["normal", "multiply", "screen", "overlay", "difference"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects an invalid blending mode", () => {
    expect(Schema.safeParse("burn").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LayerSchema
// ---------------------------------------------------------------------------

describe("LayerSchema", () => {
  it("accepts a solid layer with color", () => {
    const result = LayerSchema.safeParse({
      name: "Red Solid",
      type: "solid",
      color: "FF0000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a null layer", () => {
    const result = LayerSchema.safeParse({
      name: "Null 1",
      type: "null",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an adjustment layer", () => {
    const result = LayerSchema.safeParse({
      name: "Adjustment",
      type: "adjustment",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a text layer with text", () => {
    const result = LayerSchema.safeParse({
      name: "Title",
      type: "text",
      text: "Hello World",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file-based layer (string id)", () => {
    const result = LayerSchema.safeParse({
      name: "Footage",
      file: "my-clip",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file-based layer (numeric id)", () => {
    const result = LayerSchema.safeParse({
      name: "Footage",
      file: 42,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a layer with neither type, file, nor comp", () => {
    const result = LayerSchema.safeParse({ name: "Orphan" });
    expect(result.success).toBe(false);
    expect(
      result.error!.issues.some((i) => i.message.includes("exactly one"))
    ).toBe(true);
  });

  it("accepts a comp-in-comp layer", () => {
    const result = LayerSchema.safeParse({
      name: "Nested",
      comp: "Other Comp",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a layer with both comp and file", () => {
    const result = LayerSchema.safeParse({
      name: "Bad",
      comp: "Other",
      file: "clip1",
    });
    expect(result.success).toBe(false);
    expect(
      result.error!.issues.some((i) => i.message.includes("exactly one"))
    ).toBe(true);
  });

  it("rejects a layer with both comp and type", () => {
    const result = LayerSchema.safeParse({
      name: "Bad",
      comp: "Other",
      type: "null",
    });
    expect(result.success).toBe(false);
    expect(
      result.error!.issues.some((i) => i.message.includes("exactly one"))
    ).toBe(true);
  });

  it("rejects a solid layer without color", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Solid",
      type: "solid",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("color"))).toBe(true);
  });

  it("rejects a text layer without text", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Text",
      type: "text",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("text"))).toBe(true);
  });

  it("rejects an invalid hex color", () => {
    const result = LayerSchema.safeParse({
      name: "Solid",
      type: "solid",
      color: "ZZZZZZ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a hex color with # prefix", () => {
    const result = LayerSchema.safeParse({
      name: "Solid",
      type: "solid",
      color: "#FF0000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative inPoint", () => {
    const result = LayerSchema.safeParse({
      name: "Layer",
      type: "null",
      inPoint: -1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional properties", () => {
    const result = LayerSchema.safeParse({
      name: "Full Layer",
      type: "null",
      enabled: false,
      shy: true,
      locked: true,
      threeDLayer: true,
      parent: "Parent Layer",
      blendingMode: "multiply",
      transform: { opacity: 50 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = LayerSchema.safeParse({
      name: "",
      type: "null",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a layer with effects", () => {
    const result = LayerSchema.safeParse({
      name: "FX Layer",
      type: "solid",
      color: "FF0000",
      effects: [
        {
          name: "Gaussian Blur",
          properties: { Blurriness: 10 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EffectSchema
// ---------------------------------------------------------------------------

describe("EffectSchema", () => {
  it("accepts a minimal effect (name only)", () => {
    const result = EffectSchema.safeParse({ name: "Glow" });
    expect(result.success).toBe(true);
  });

  it("accepts an effect with matchName", () => {
    const result = EffectSchema.safeParse({
      name: "Gaussian Blur",
      matchName: "ADBE Gaussian Blur 2",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an effect with enabled: false", () => {
    const result = EffectSchema.safeParse({
      name: "Glow",
      enabled: false,
    });
    expect(result.success).toBe(true);
    expect(result.data!.enabled).toBe(false);
  });

  it("accepts scalar number property", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: { Blurriness: 10 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts boolean property", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: { "Repeat Edge Pixels": true },
    });
    expect(result.success).toBe(true);
  });

  it("accepts array property (2D point)", () => {
    const result = EffectSchema.safeParse({
      name: "Radial Blur",
      properties: { Center: [960, 540] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts array property (color triplet)", () => {
    const result = EffectSchema.safeParse({
      name: "Fill",
      properties: { Color: [1, 0, 0] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed number property", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: {
        Blurriness: [
          { time: 0, value: 0 },
          { time: 2, value: 50 },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed 2D point property", () => {
    const result = EffectSchema.safeParse({
      name: "Radial Blur",
      properties: {
        Center: [
          { time: 0, value: [960, 540] },
          { time: 5, value: [0, 0] },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed boolean property", () => {
    const result = EffectSchema.safeParse({
      name: "Effect",
      properties: {
        Toggle: [
          { time: 0, value: true },
          { time: 1, value: false },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = EffectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = EffectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects single keyframe (min 2)", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: {
        Blurriness: [{ time: 0, value: 10 }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative keyframe time", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: {
        Blurriness: [
          { time: -1, value: 0 },
          { time: 2, value: 50 },
        ],
      },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CompSchema
// ---------------------------------------------------------------------------

describe("CompSchema", () => {
  it("applies defaults for a minimal comp", () => {
    const result = CompSchema.safeParse({ name: "Main Comp" });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      name: "Main Comp",
      width: 1920,
      height: 1080,
      framerate: 30,
      duration: 10,
      pixelAspect: 1,
      color: "000000",
    });
  });

  it("uses custom values when provided", () => {
    const result = CompSchema.safeParse({
      name: "Custom Comp",
      width: 3840,
      height: 2160,
      duration: 30,
      framerate: 60,
      pixelAspect: 1.5,
      color: "112233",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      width: 3840,
      height: 2160,
      duration: 30,
      framerate: 60,
      pixelAspect: 1.5,
      color: "112233",
    });
  });

  it("rejects a comp with no name", () => {
    const result = CompSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a comp with an empty name", () => {
    const result = CompSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive width", () => {
    const result = CompSchema.safeParse({ name: "C", width: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer width", () => {
    const result = CompSchema.safeParse({ name: "C", width: 1920.5 });
    expect(result.success).toBe(false);
  });

  it("accepts a comp with layers", () => {
    const result = CompSchema.safeParse({
      name: "Comp With Layers",
      layers: [
        { name: "BG", type: "solid", color: "000000" },
        { name: "Null", type: "null" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.layers).toHaveLength(2);
  });

  it("rejects a comp with invalid layers", () => {
    const result = CompSchema.safeParse({
      name: "Bad Comp",
      layers: [{ name: "No type or file" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional folder reference", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      folder: "My Folder",
    });
    expect(result.success).toBe(true);
    expect(result.data!.folder).toBe("My Folder");
  });
});

// ---------------------------------------------------------------------------
// FileSchema
// ---------------------------------------------------------------------------

describe("FileSchema", () => {
  it("accepts a file with string id", () => {
    const result = FileSchema.safeParse({
      id: "clip-1",
      path: "/path/to/file.mov",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a file with numeric id", () => {
    const result = FileSchema.safeParse({
      id: 1,
      path: "/path/to/file.mov",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a file without path", () => {
    const result = FileSchema.safeParse({ id: "clip-1" });
    expect(result.success).toBe(false);
  });

  it("rejects a file with empty path", () => {
    const result = FileSchema.safeParse({ id: "clip-1", path: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a file without id", () => {
    const result = FileSchema.safeParse({ path: "/path/to/file.mov" });
    expect(result.success).toBe(false);
  });

  it("accepts optional sequence and folder", () => {
    const result = FileSchema.safeParse({
      id: "seq",
      path: "/path/to/seq.[0001-0100].png",
      sequence: true,
      folder: "Footage",
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ sequence: true, folder: "Footage" });
  });
});

// ---------------------------------------------------------------------------
// FolderSchema
// ---------------------------------------------------------------------------

describe("FolderSchema", () => {
  it("accepts a folder with name", () => {
    const result = FolderSchema.safeParse({ name: "Footage" });
    expect(result.success).toBe(true);
  });

  it("accepts a folder with parent", () => {
    const result = FolderSchema.safeParse({
      name: "Subfolder",
      parent: "Footage",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a folder without name", () => {
    const result = FolderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a folder with empty name", () => {
    const result = FolderSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CompdownDocumentSchema
// ---------------------------------------------------------------------------

describe("CompdownDocumentSchema", () => {
  it("accepts a document with only compositions", () => {
    const result = CompdownDocumentSchema.safeParse({
      compositions: [{ name: "Main" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with only files", () => {
    const result = CompdownDocumentSchema.safeParse({
      files: [{ id: "f1", path: "/foo.mov" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with only folders", () => {
    const result = CompdownDocumentSchema.safeParse({
      folders: [{ name: "Assets" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a document with all three sections", () => {
    const result = CompdownDocumentSchema.safeParse({
      folders: [{ name: "Assets" }],
      files: [{ id: "f1", path: "/foo.mov" }],
      compositions: [{ name: "Main" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty document (no sections)", () => {
    const result = CompdownDocumentSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("at least one"))).toBe(true);
  });

  it("rejects a document with empty arrays", () => {
    const result = CompdownDocumentSchema.safeParse({
      compositions: [],
      files: [],
      folders: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a document with only invalid compositions", () => {
    const result = CompdownDocumentSchema.safeParse({
      compositions: [{ width: 1920 }], // missing name
    });
    expect(result.success).toBe(false);
  });
});
