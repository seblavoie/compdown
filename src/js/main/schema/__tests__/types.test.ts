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
  LayerStyleSchema,
  LayerStyleTypeSchema,
  QualityModeSchema,
  SamplingQualitySchema,
  AutoOrientSchema,
  FrameBlendingTypeSchema,
  TrackMatteTypeSchema,
  EssentialGraphicsItemSchema,
  EasingSchema,
  MarkerSchema,
  ShapeSchema,
  ShapeFillSchema,
  ShapeStrokeSchema,
  RectangleShapeSchema,
  EllipseShapeSchema,
  PolygonShapeSchema,
  StarShapeSchema,
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

  it("accepts positionX and positionY", () => {
    const result = Schema.safeParse({
      positionX: 960,
      positionY: 540,
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed positionX and positionY", () => {
    const result = Schema.safeParse({
      positionX: [
        { time: 0, value: 0 },
        { time: 2, value: 1920 },
      ],
      positionY: 540,
    });
    expect(result.success).toBe(true);
  });

  it("rejects position with positionX", () => {
    const result = Schema.safeParse({
      position: [960, 540],
      positionX: 960,
    });
    expect(result.success).toBe(false);
  });

  it("rejects position with positionY", () => {
    const result = Schema.safeParse({
      position: [960, 540],
      positionY: 540,
    });
    expect(result.success).toBe(false);
  });

  it("accepts expressions on transform properties", () => {
    const result = Schema.safeParse({
      position: [960, 540],
      expressions: {
        position: "wiggle(5, 50)",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts expressions with values and keyframes", () => {
    const result = Schema.safeParse({
      rotation: [
        { time: 0, value: 0 },
        { time: 2, value: 360 },
      ],
      opacity: 100,
      expressions: {
        rotation: "time * 36",
        opacity: "Math.sin(time) * 50 + 50",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts expressions on positionX/positionY", () => {
    const result = Schema.safeParse({
      positionX: 960,
      positionY: 540,
      expressions: {
        positionX: "wiggle(2, 100)[0]",
        positionY: "wiggle(2, 100)[1]",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown property in expressions", () => {
    const result = Schema.safeParse({
      position: [960, 540],
      expressions: {
        unknown: "wiggle(5, 50)",
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts positionZ for 3D layers", () => {
    const result = Schema.safeParse({
      positionX: 960,
      positionY: 540,
      positionZ: -100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed positionZ", () => {
    const result = Schema.safeParse({
      positionZ: [
        { time: 0, value: 0 },
        { time: 2, value: -500 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects position with positionZ", () => {
    const result = Schema.safeParse({
      position: [960, 540],
      positionZ: -100,
    });
    expect(result.success).toBe(false);
  });

  it("accepts rotationX and rotationY for 3D layers", () => {
    const result = Schema.safeParse({
      rotationX: 45,
      rotationY: -30,
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed rotationX with easing", () => {
    const result = Schema.safeParse({
      rotationX: [
        { time: 0, value: 0, easing: "easeOut" },
        { time: 2, value: 90, easing: "easeIn" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed rotationY", () => {
    const result = Schema.safeParse({
      rotationY: [
        { time: 0, value: 0 },
        { time: 3, value: 360 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts combined 3D position and rotation", () => {
    const result = Schema.safeParse({
      positionX: 960,
      positionY: 540,
      positionZ: -200,
      rotation: 45,
      rotationX: 30,
      rotationY: -15,
    });
    expect(result.success).toBe(true);
  });

  it("accepts expressions on 3D properties", () => {
    const result = Schema.safeParse({
      positionZ: 0,
      rotationX: 0,
      rotationY: 0,
      expressions: {
        positionZ: "Math.sin(time) * 100",
        rotationX: "time * 36",
        rotationY: "wiggle(1, 10)",
      },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EasingSchema
// ---------------------------------------------------------------------------

describe("EasingSchema", () => {
  it("accepts valid easing types", () => {
    for (const easing of ["linear", "easeIn", "easeOut", "easeInOut", "hold"]) {
      expect(EasingSchema.safeParse(easing).success).toBe(true);
    }
  });

  it("rejects invalid easing type", () => {
    expect(EasingSchema.safeParse("bounce").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Keyframes with easing
// ---------------------------------------------------------------------------

describe("Keyframes with easing", () => {
  it("accepts keyframed position with easing", () => {
    const Schema = TransformSchema.unwrap();
    const result = Schema.safeParse({
      position: [
        { time: 0, value: [0, 0], easing: "easeOut" },
        { time: 2, value: [1920, 1080], easing: "easeIn" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed rotation with easeInOut", () => {
    const Schema = TransformSchema.unwrap();
    const result = Schema.safeParse({
      rotation: [
        { time: 0, value: 0, easing: "easeInOut" },
        { time: 1, value: 360 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed opacity with hold", () => {
    const Schema = TransformSchema.unwrap();
    const result = Schema.safeParse({
      opacity: [
        { time: 0, value: 100, easing: "hold" },
        { time: 2, value: 0 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid easing on keyframe", () => {
    const Schema = TransformSchema.unwrap();
    const result = Schema.safeParse({
      position: [
        { time: 0, value: [0, 0], easing: "invalid" },
        { time: 2, value: [100, 100] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts effect keyframes with easing", () => {
    const result = EffectSchema.safeParse({
      name: "Blur",
      properties: {
        Blurriness: [
          { time: 0, value: 0, easing: "easeOut" },
          { time: 2, value: 50, easing: "easeIn" },
        ],
      },
    });
    expect(result.success).toBe(true);
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

  it("accepts a text layer with styling properties", () => {
    const result = LayerSchema.safeParse({
      name: "Styled Text",
      type: "text",
      text: "Hello",
      fontSize: 72,
      font: "Arial",
      fillColor: "FF0000",
      strokeColor: "000000",
      strokeWidth: 2,
      tracking: 50,
      leading: 80,
      justification: "center",
    });
    expect(result.success).toBe(true);
  });

  it("accepts text layer with only fill color", () => {
    const result = LayerSchema.safeParse({
      name: "Red Text",
      type: "text",
      text: "Hello",
      fillColor: "FF0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid justification", () => {
    const result = LayerSchema.safeParse({
      name: "Text",
      type: "text",
      text: "Hello",
      justification: "full",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid fill color format", () => {
    const result = LayerSchema.safeParse({
      name: "Text",
      type: "text",
      text: "Hello",
      fillColor: "#FF0000",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a camera layer", () => {
    const result = LayerSchema.safeParse({
      name: "Camera 1",
      type: "camera",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a camera layer with properties", () => {
    const result = LayerSchema.safeParse({
      name: "Camera 1",
      type: "camera",
      cameraType: "twoNode",
      zoom: 1000,
      depthOfField: true,
      focusDistance: 500,
      aperture: 50,
      blurLevel: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid camera type", () => {
    const result = LayerSchema.safeParse({
      name: "Camera 1",
      type: "camera",
      cameraType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a light layer with lightType", () => {
    const result = LayerSchema.safeParse({
      name: "Light 1",
      type: "light",
      lightType: "spot",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a light layer with all properties", () => {
    const result = LayerSchema.safeParse({
      name: "Light 1",
      type: "light",
      lightType: "spot",
      intensity: 150,
      lightColor: "FFFF00",
      coneAngle: 45,
      coneFeather: 25,
      castsShadows: true,
      shadowDarkness: 80,
      shadowDiffusion: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects light layer without lightType", () => {
    const result = LayerSchema.safeParse({
      name: "Light 1",
      type: "light",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("lightType"))).toBe(true);
  });

  it("rejects invalid lightType", () => {
    const result = LayerSchema.safeParse({
      name: "Light 1",
      type: "light",
      lightType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all light types", () => {
    for (const lightType of ["parallel", "spot", "point", "ambient"]) {
      const result = LayerSchema.safeParse({
        name: "Light",
        type: "light",
        lightType,
      });
      expect(result.success).toBe(true);
    }
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

  it("accepts additional boolean flags", () => {
    const result = LayerSchema.safeParse({
      name: "Flagged Layer",
      type: "null",
      solo: true,
      audioEnabled: false,
      motionBlur: true,
      collapseTransformation: true,
      guideLayer: true,
      effectsActive: false,
      timeRemapEnabled: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts quality and rendering enum properties", () => {
    const result = LayerSchema.safeParse({
      name: "Quality Layer",
      type: "solid",
      color: "FF0000",
      quality: "best",
      samplingQuality: "bicubic",
      autoOrient: "alongPath",
      frameBlendingType: "pixelMotion",
      trackMatteType: "alpha",
    });
    expect(result.success).toBe(true);
  });

  it("accepts label property", () => {
    const result = LayerSchema.safeParse({
      name: "Labeled Layer",
      type: "null",
      label: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects label out of range (negative)", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Label",
      type: "null",
      label: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects label out of range (above 16)", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Label",
      type: "null",
      label: 17,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer label", () => {
    const result = LayerSchema.safeParse({
      name: "Bad Label",
      type: "null",
      label: 4.5,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Shape Schemas
// ---------------------------------------------------------------------------

describe("ShapeFillSchema", () => {
  it("accepts valid fill with color only", () => {
    const result = ShapeFillSchema.safeParse({ color: "FF5500" });
    expect(result.success).toBe(true);
  });

  it("accepts fill with color and opacity", () => {
    const result = ShapeFillSchema.safeParse({ color: "FF5500", opacity: 75 });
    expect(result.success).toBe(true);
  });

  it("rejects fill without color", () => {
    const result = ShapeFillSchema.safeParse({ opacity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = ShapeFillSchema.safeParse({ color: "ZZZZZZ" });
    expect(result.success).toBe(false);
  });

  it("rejects opacity above 100", () => {
    const result = ShapeFillSchema.safeParse({ color: "FF0000", opacity: 150 });
    expect(result.success).toBe(false);
  });

  it("rejects opacity below 0", () => {
    const result = ShapeFillSchema.safeParse({ color: "FF0000", opacity: -10 });
    expect(result.success).toBe(false);
  });
});

describe("ShapeStrokeSchema", () => {
  it("accepts valid stroke with color only", () => {
    const result = ShapeStrokeSchema.safeParse({ color: "000000" });
    expect(result.success).toBe(true);
  });

  it("accepts stroke with all properties", () => {
    const result = ShapeStrokeSchema.safeParse({
      color: "000000",
      width: 2,
      opacity: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects stroke without color", () => {
    const result = ShapeStrokeSchema.safeParse({ width: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects negative width", () => {
    const result = ShapeStrokeSchema.safeParse({ color: "000000", width: -1 });
    expect(result.success).toBe(false);
  });
});

describe("RectangleShapeSchema", () => {
  it("accepts a valid rectangle", () => {
    const result = RectangleShapeSchema.safeParse({
      type: "rectangle",
      size: [400, 200],
    });
    expect(result.success).toBe(true);
  });

  it("accepts rectangle with all properties", () => {
    const result = RectangleShapeSchema.safeParse({
      type: "rectangle",
      name: "Background",
      size: [400, 200],
      position: [0, 0],
      roundness: 20,
      fill: { color: "FF5500", opacity: 100 },
      stroke: { color: "000000", width: 2, opacity: 100 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects rectangle without size", () => {
    const result = RectangleShapeSchema.safeParse({
      type: "rectangle",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative roundness", () => {
    const result = RectangleShapeSchema.safeParse({
      type: "rectangle",
      size: [100, 100],
      roundness: -5,
    });
    expect(result.success).toBe(false);
  });
});

describe("EllipseShapeSchema", () => {
  it("accepts a valid ellipse", () => {
    const result = EllipseShapeSchema.safeParse({
      type: "ellipse",
      size: [100, 100],
    });
    expect(result.success).toBe(true);
  });

  it("accepts ellipse with fill", () => {
    const result = EllipseShapeSchema.safeParse({
      type: "ellipse",
      name: "Circle",
      size: [100, 100],
      position: [50, 50],
      fill: { color: "00FF00" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects ellipse without size", () => {
    const result = EllipseShapeSchema.safeParse({
      type: "ellipse",
    });
    expect(result.success).toBe(false);
  });
});

describe("PolygonShapeSchema", () => {
  it("accepts a valid polygon (triangle)", () => {
    const result = PolygonShapeSchema.safeParse({
      type: "polygon",
      points: 3,
      outerRadius: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts polygon with all properties", () => {
    const result = PolygonShapeSchema.safeParse({
      type: "polygon",
      name: "Hexagon",
      points: 6,
      position: [0, 0],
      outerRadius: 100,
      outerRoundness: 10,
      rotation: 30,
      fill: { color: "0000FF" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects polygon with less than 3 points", () => {
    const result = PolygonShapeSchema.safeParse({
      type: "polygon",
      points: 2,
      outerRadius: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects polygon without outerRadius", () => {
    const result = PolygonShapeSchema.safeParse({
      type: "polygon",
      points: 5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative outerRadius", () => {
    const result = PolygonShapeSchema.safeParse({
      type: "polygon",
      points: 4,
      outerRadius: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe("StarShapeSchema", () => {
  it("accepts a valid star", () => {
    const result = StarShapeSchema.safeParse({
      type: "star",
      points: 5,
      outerRadius: 100,
      innerRadius: 40,
    });
    expect(result.success).toBe(true);
  });

  it("accepts star with all properties", () => {
    const result = StarShapeSchema.safeParse({
      type: "star",
      name: "Star",
      points: 5,
      position: [0, 0],
      outerRadius: 100,
      innerRadius: 40,
      outerRoundness: 0,
      innerRoundness: 0,
      rotation: 0,
      fill: { color: "FFFF00" },
      stroke: { color: "000000", width: 1 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects star without innerRadius", () => {
    const result = StarShapeSchema.safeParse({
      type: "star",
      points: 5,
      outerRadius: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects star with less than 3 points", () => {
    const result = StarShapeSchema.safeParse({
      type: "star",
      points: 2,
      outerRadius: 100,
      innerRadius: 40,
    });
    expect(result.success).toBe(false);
  });
});

describe("ShapeSchema (discriminated union)", () => {
  it("accepts rectangle shape", () => {
    const result = ShapeSchema.safeParse({
      type: "rectangle",
      size: [100, 100],
    });
    expect(result.success).toBe(true);
  });

  it("accepts ellipse shape", () => {
    const result = ShapeSchema.safeParse({
      type: "ellipse",
      size: [100, 100],
    });
    expect(result.success).toBe(true);
  });

  it("accepts polygon shape", () => {
    const result = ShapeSchema.safeParse({
      type: "polygon",
      points: 6,
      outerRadius: 50,
    });
    expect(result.success).toBe(true);
  });

  it("accepts star shape", () => {
    const result = ShapeSchema.safeParse({
      type: "star",
      points: 5,
      outerRadius: 100,
      innerRadius: 40,
    });
    expect(result.success).toBe(true);
  });

  it("accepts path shape", () => {
    const result = ShapeSchema.safeParse({
      type: "path",
      vertices: [
        [0, 0],
        [100, 0],
        [100, 100],
      ],
      closed: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects path shape with mismatched tangents", () => {
    const result = ShapeSchema.safeParse({
      type: "path",
      vertices: [
        [0, 0],
        [100, 0],
      ],
      inTangents: [[0, 0]],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown shape type", () => {
    const result = ShapeSchema.safeParse({
      type: "bezier",
      path: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects shape without type", () => {
    const result = ShapeSchema.safeParse({
      size: [100, 100],
    });
    expect(result.success).toBe(false);
  });
});

describe("LayerSchema (shape layers)", () => {
  it("accepts a shape layer with shapes", () => {
    const result = LayerSchema.safeParse({
      name: "Shape Layer",
      type: "shape",
      shapes: [
        { type: "rectangle", size: [100, 100] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a shape layer with multiple shapes", () => {
    const result = LayerSchema.safeParse({
      name: "Multi Shape",
      type: "shape",
      shapes: [
        { type: "rectangle", size: [400, 200], roundness: 20 },
        { type: "ellipse", size: [100, 100] },
        { type: "polygon", points: 3, outerRadius: 50 },
        { type: "star", points: 5, outerRadius: 100, innerRadius: 40 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a shape layer with fill and stroke", () => {
    const result = LayerSchema.safeParse({
      name: "Styled Shape",
      type: "shape",
      shapes: [
        {
          type: "rectangle",
          size: [200, 100],
          fill: { color: "FF5500", opacity: 100 },
          stroke: { color: "000000", width: 2 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a shape layer without shapes", () => {
    const result = LayerSchema.safeParse({
      name: "Empty Shape",
      type: "shape",
    });
    expect(result.success).toBe(false);
    expect(result.error!.issues.some((i) => i.message.includes("shapes"))).toBe(true);
  });

  it("rejects a shape layer with empty shapes array", () => {
    const result = LayerSchema.safeParse({
      name: "Empty Shape",
      type: "shape",
      shapes: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts shape layer with transform", () => {
    const result = LayerSchema.safeParse({
      name: "Transformed Shape",
      type: "shape",
      shapes: [{ type: "rectangle", size: [100, 100] }],
      transform: {
        position: [960, 540],
        scale: [50, 50],
        rotation: 45,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts shape layer with effects", () => {
    const result = LayerSchema.safeParse({
      name: "FX Shape",
      type: "shape",
      shapes: [{ type: "rectangle", size: [100, 100], fill: { color: "FF0000" } }],
      effects: [{ name: "Gaussian Blur", properties: { Blurriness: 10 } }],
    });
    expect(result.success).toBe(true);
  });
});

describe("MaskSchema", () => {
  it("accepts a simple mask", () => {
    const result = MaskSchema.safeParse({
      name: "Mask 1",
      path: {
        vertices: [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ],
        closed: true,
      },
      mode: "add",
      feather: [0, 0],
      opacity: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects mask with mismatched tangents", () => {
    const result = MaskSchema.safeParse({
      path: {
        vertices: [
          [0, 0],
          [100, 0],
        ],
        inTangents: [[0, 0]],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("LayerSchema (masks)", () => {
  it("accepts a layer with masks", () => {
    const result = LayerSchema.safeParse({
      name: "Masked Layer",
      type: "solid",
      color: "FF0000",
      masks: [
        {
          name: "Mask 1",
          mode: "subtract",
          path: {
            vertices: [
              [0, 0],
              [100, 0],
              [100, 100],
              [0, 100],
            ],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// QualityModeSchema
// ---------------------------------------------------------------------------

describe("QualityModeSchema", () => {
  const Schema = QualityModeSchema.unwrap();

  it("accepts valid quality modes", () => {
    for (const mode of ["best", "draft", "wireframe"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects invalid quality mode", () => {
    expect(Schema.safeParse("low").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SamplingQualitySchema
// ---------------------------------------------------------------------------

describe("SamplingQualitySchema", () => {
  const Schema = SamplingQualitySchema.unwrap();

  it("accepts valid sampling qualities", () => {
    for (const mode of ["bicubic", "bilinear"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects invalid sampling quality", () => {
    expect(Schema.safeParse("nearest").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AutoOrientSchema
// ---------------------------------------------------------------------------

describe("AutoOrientSchema", () => {
  const Schema = AutoOrientSchema.unwrap();

  it("accepts valid auto-orient types", () => {
    for (const mode of ["off", "alongPath", "cameraOrPointOfInterest"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects invalid auto-orient type", () => {
    expect(Schema.safeParse("auto").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FrameBlendingTypeSchema
// ---------------------------------------------------------------------------

describe("FrameBlendingTypeSchema", () => {
  const Schema = FrameBlendingTypeSchema.unwrap();

  it("accepts valid frame blending types", () => {
    for (const mode of ["none", "frameMix", "pixelMotion"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects invalid frame blending type", () => {
    expect(Schema.safeParse("optical").success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// TrackMatteTypeSchema
// ---------------------------------------------------------------------------

describe("TrackMatteTypeSchema", () => {
  const Schema = TrackMatteTypeSchema.unwrap();

  it("accepts valid track matte types", () => {
    for (const mode of ["none", "alpha", "alphaInverted", "luma", "lumaInverted"]) {
      expect(Schema.safeParse(mode).success).toBe(true);
    }
  });

  it("rejects invalid track matte type", () => {
    expect(Schema.safeParse("stencil").success).toBe(false);
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

  it("accepts expressions on effect properties", () => {
    const result = EffectSchema.safeParse({
      name: "Gaussian Blur",
      properties: {
        Blurriness: 10,
      },
      expressions: {
        Blurriness: "wiggle(1, 5)",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple expressions", () => {
    const result = EffectSchema.safeParse({
      name: "Radial Blur",
      properties: {
        Amount: 50,
        Center: [960, 540],
      },
      expressions: {
        Amount: "time * 10",
        Center: "thisComp.layer(1).transform.position",
      },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LayerStyleSchema
// ---------------------------------------------------------------------------

describe("LayerStyleTypeSchema", () => {
  it("accepts all valid layer style types", () => {
    const types = [
      "dropShadow",
      "innerShadow",
      "outerGlow",
      "innerGlow",
      "bevelEmboss",
      "satin",
      "colorOverlay",
      "gradientOverlay",
      "stroke",
    ];
    for (const type of types) {
      expect(LayerStyleTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("rejects invalid style type", () => {
    expect(LayerStyleTypeSchema.safeParse("shadow").success).toBe(false);
  });
});

describe("LayerStyleSchema", () => {
  it("accepts a minimal layer style (type only)", () => {
    const result = LayerStyleSchema.safeParse({ type: "dropShadow" });
    expect(result.success).toBe(true);
  });

  it("accepts a layer style with enabled: false", () => {
    const result = LayerStyleSchema.safeParse({
      type: "dropShadow",
      enabled: false,
    });
    expect(result.success).toBe(true);
    expect(result.data!.enabled).toBe(false);
  });

  it("accepts dropShadow with properties", () => {
    const result = LayerStyleSchema.safeParse({
      type: "dropShadow",
      properties: {
        Opacity: 75,
        Distance: 5,
        Size: 10,
        Angle: 135,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts stroke with color array property", () => {
    const result = LayerStyleSchema.safeParse({
      type: "stroke",
      properties: {
        Color: [1, 0, 0],
        Size: 2,
        Opacity: 100,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts colorOverlay with color array", () => {
    const result = LayerStyleSchema.safeParse({
      type: "colorOverlay",
      properties: {
        Color: [0, 0.5, 1],
        Opacity: 50,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed properties", () => {
    const result = LayerStyleSchema.safeParse({
      type: "dropShadow",
      properties: {
        Opacity: [
          { time: 0, value: 0 },
          { time: 2, value: 100 },
        ],
        Distance: [
          { time: 0, value: 0 },
          { time: 2, value: 50 },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts keyframed properties with easing", () => {
    const result = LayerStyleSchema.safeParse({
      type: "outerGlow",
      properties: {
        Size: [
          { time: 0, value: 0, easing: "easeOut" },
          { time: 1, value: 25, easing: "easeIn" },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts expressions", () => {
    const result = LayerStyleSchema.safeParse({
      type: "dropShadow",
      properties: {
        Distance: 10,
      },
      expressions: {
        Distance: "wiggle(1, 5)",
        Angle: "time * 36",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts bevelEmboss with properties", () => {
    const result = LayerStyleSchema.safeParse({
      type: "bevelEmboss",
      properties: {
        Depth: 100,
        Size: 5,
        Soften: 0,
        Angle: 120,
        Altitude: 30,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts gradientOverlay", () => {
    const result = LayerStyleSchema.safeParse({
      type: "gradientOverlay",
      properties: {
        Opacity: 100,
        Angle: 90,
        Scale: 100,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts satin style", () => {
    const result = LayerStyleSchema.safeParse({
      type: "satin",
      properties: {
        Opacity: 50,
        Angle: 19,
        Distance: 11,
        Size: 14,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing type", () => {
    const result = LayerStyleSchema.safeParse({
      properties: { Opacity: 75 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = LayerStyleSchema.safeParse({
      type: "emboss",
      properties: { Depth: 100 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects single keyframe (min 2)", () => {
    const result = LayerStyleSchema.safeParse({
      type: "dropShadow",
      properties: {
        Opacity: [{ time: 0, value: 50 }],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("LayerSchema with layerStyles", () => {
  it("accepts a text layer with drop shadow", () => {
    const result = LayerSchema.safeParse({
      name: "Title",
      type: "text",
      text: "Hello World",
      layerStyles: [
        {
          type: "dropShadow",
          properties: {
            Opacity: 75,
            Distance: 5,
            Size: 10,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a layer with multiple styles", () => {
    const result = LayerSchema.safeParse({
      name: "Styled Text",
      type: "text",
      text: "Styled",
      layerStyles: [
        { type: "dropShadow", properties: { Distance: 5 } },
        { type: "stroke", properties: { Size: 2, Color: [1, 0, 0] } },
        { type: "outerGlow", properties: { Size: 20 } },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.layerStyles).toHaveLength(3);
  });

  it("accepts a solid with layer styles", () => {
    const result = LayerSchema.safeParse({
      name: "BG",
      type: "solid",
      color: "FF0000",
      layerStyles: [
        { type: "bevelEmboss", properties: { Depth: 100 } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts layer styles with effects", () => {
    const result = LayerSchema.safeParse({
      name: "FX Layer",
      type: "text",
      text: "FX",
      effects: [{ name: "Gaussian Blur", properties: { Blurriness: 5 } }],
      layerStyles: [{ type: "dropShadow", properties: { Distance: 10 } }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts layer with only layerStyles (no effects)", () => {
    const result = LayerSchema.safeParse({
      name: "Styled",
      type: "solid",
      color: "0000FF",
      layerStyles: [{ type: "innerGlow" }],
    });
    expect(result.success).toBe(true);
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

  it("accepts essentialGraphics with simple string paths", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      essentialGraphics: [
        "title.transform.position",
        "title.text",
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.essentialGraphics).toHaveLength(2);
  });

  it("accepts essentialGraphics with expanded form", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      essentialGraphics: [
        { property: "title.transform.position", name: "Logo Position" },
        { property: "title.text", name: "Headline" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.essentialGraphics).toHaveLength(2);
  });

  it("accepts essentialGraphics with mixed forms", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      essentialGraphics: [
        "title.transform.position",
        { property: "title.text", name: "Headline" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.essentialGraphics).toHaveLength(2);
  });

  it("accepts essentialGraphics with effect properties", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      essentialGraphics: [
        { property: "bar.effects.Gaussian Blur.Blurriness", name: "Bar Blur" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects essentialGraphics with invalid items", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      essentialGraphics: [123],
    });
    expect(result.success).toBe(false);
  });

  it("accepts comp with markers", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      markers: [
        { time: 0, comment: "Start" },
        { time: 5, comment: "Middle", duration: 2 },
        { time: 10, comment: "End" },
      ],
    });
    expect(result.success).toBe(true);
    expect(result.data!.markers).toHaveLength(3);
  });

  it("accepts markers with all properties", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      markers: [
        {
          time: 1,
          comment: "Chapter 1",
          duration: 5,
          chapter: "Introduction",
          url: "https://example.com",
          label: 4,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts markers with only time", () => {
    const result = CompSchema.safeParse({
      name: "Comp",
      markers: [{ time: 2.5 }],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MarkerSchema
// ---------------------------------------------------------------------------

describe("MarkerSchema", () => {
  it("accepts a minimal marker with just time", () => {
    const result = MarkerSchema.safeParse({ time: 0 });
    expect(result.success).toBe(true);
  });

  it("accepts a marker with comment", () => {
    const result = MarkerSchema.safeParse({
      time: 1.5,
      comment: "Scene change",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a marker with duration", () => {
    const result = MarkerSchema.safeParse({
      time: 0,
      comment: "Intro",
      duration: 3,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a marker with chapter and url", () => {
    const result = MarkerSchema.safeParse({
      time: 10,
      chapter: "Credits",
      url: "https://example.com/credits",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative time", () => {
    const result = MarkerSchema.safeParse({ time: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects negative duration", () => {
    const result = MarkerSchema.safeParse({ time: 0, duration: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts label in valid range", () => {
    const result = MarkerSchema.safeParse({ time: 0, label: 8 });
    expect(result.success).toBe(true);
  });

  it("rejects label out of range", () => {
    const result = MarkerSchema.safeParse({ time: 0, label: 20 });
    expect(result.success).toBe(false);
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
// EssentialGraphicsItemSchema
// ---------------------------------------------------------------------------

describe("EssentialGraphicsItemSchema", () => {
  it("accepts a simple string path", () => {
    const result = EssentialGraphicsItemSchema.safeParse("title.transform.position");
    expect(result.success).toBe(true);
  });

  it("accepts an object with property and name", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.transform.position",
      name: "Logo Position",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        property: "title.transform.position",
        name: "Logo Position",
      });
    }
  });

  it("rejects empty string", () => {
    const result = EssentialGraphicsItemSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects object with empty property", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "",
      name: "Logo Position",
    });
    expect(result.success).toBe(false);
  });

  it("rejects object with empty name", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.transform.position",
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects object with missing property", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      name: "Logo Position",
    });
    expect(result.success).toBe(false);
  });

  it("accepts object with property only (no name)", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.transform.position",
    });
    expect(result.success).toBe(true);
  });

  it("accepts object with encodePathInName: false", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.transform.position",
      name: "Logo Position",
      encodePathInName: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        property: "title.transform.position",
        name: "Logo Position",
        encodePathInName: false,
      });
    }
  });

  it("accepts object with encodePathInName: true", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.transform.position",
      name: "Logo Position",
      encodePathInName: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts object with property and encodePathInName (no name)", () => {
    const result = EssentialGraphicsItemSchema.safeParse({
      property: "title.text",
      encodePathInName: false,
    });
    expect(result.success).toBe(true);
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
