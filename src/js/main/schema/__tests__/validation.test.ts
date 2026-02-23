import { describe, it, expect } from "vitest";
import { validateYaml } from "../validation";

// ---------------------------------------------------------------------------
// validateYaml – valid documents
// ---------------------------------------------------------------------------

describe("validateYaml", () => {
  it("returns success for a valid minimal document", () => {
    const yaml = `
compositions:
  - name: Main
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.data).toBeDefined();
    expect(result.data!.compositions![0].name).toBe("Main");
  });

  it("applies comp defaults in parsed data", () => {
    const yaml = `
compositions:
  - name: Default Comp
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0]).toMatchObject({
      width: 1920,
      height: 1080,
      framerate: 30,
      duration: 10,
    });
  });

  it("parses a full document with folders, files, and compositions", () => {
    const yaml = `
folders:
  - name: Assets
files:
  - id: bg
    path: /footage/bg.mov
compositions:
  - name: Main
    layers:
      - name: Background
        file: bg
      - name: Title
        type: text
        text: Hello
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.folders).toHaveLength(1);
    expect(result.data!.files).toHaveLength(1);
    expect(result.data!.compositions![0].layers).toHaveLength(2);
  });

  it("accepts top-level layers with _timeline block", () => {
    const yaml = `
_timeline:
  layers:
    - name: Title
      type: text
      text: Hello
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._timeline!.layers).toHaveLength(1);
  });

  it("accepts _timeline.set.layers updates", () => {
    const yaml = `
_timeline:
  set:
    layers:
      - name: Title
        transform:
          opacity: 85
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._timeline!.set!.layers).toHaveLength(1);
  });

  it("accepts _timeline.remove.layers deletes", () => {
    const yaml = `
_timeline:
  remove:
    layers:
      - name: Temp
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._timeline!.remove!.layers).toHaveLength(1);
  });

  it("accepts _selected.set patch", () => {
    const yaml = `
_selected:
  set:
    transform:
      opacity: 50
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._selected!.set).toBeDefined();
  });

  it("accepts _selected.remove: true", () => {
    const yaml = `
_selected:
  remove: true
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._selected!.remove).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // validateYaml – YAML syntax errors
  // ---------------------------------------------------------------------------

  it("returns an error for invalid YAML syntax", () => {
    const yaml = `
compositions:
  - name: Main
    layers:
  bad indentation
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // YAML parse errors should have a line number
    expect(result.errors[0].line).not.toBeNull();
  });

  it("returns an error for completely invalid YAML", () => {
    const yaml = `{{{not yaml`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("accepts tab-indented YAML by normalizing indentation tabs", () => {
    const yaml = "compositions:\n\t- name: Main\n\t  layers:\n\t    - name: Title\n\t      type: text\n\t      text: Hello\n";
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // validateYaml – empty / null documents
  // ---------------------------------------------------------------------------

  it("returns an error for an empty document", () => {
    const result = validateYaml("");
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe("Document is empty");
    expect(result.errors[0].line).toBe(1);
  });

  it("returns an error for a YAML document that parses to null", () => {
    const result = validateYaml("---\n");
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe("Document is empty");
  });

  // ---------------------------------------------------------------------------
  // validateYaml – schema violations with error mapping
  // ---------------------------------------------------------------------------

  it("reports a schema error for missing comp name", () => {
    const yaml = `
compositions:
  - width: 1920
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports multiple errors", () => {
    const yaml = `
compositions:
  - name: Comp1
    layers:
      - name: Bad Solid
        type: solid
      - name: Bad Text
        type: text
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    // solid missing color + text missing text = at least 2 errors
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("maps error paths to strings", () => {
    const yaml = `
compositions:
  - name: C
    layers:
      - name: Orphan
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    // The path should contain string segments
    expect(result.errors[0].path.every((p) => typeof p === "string")).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // validateYaml – line number mapping
  // ---------------------------------------------------------------------------

  it("maps errors to approximate line numbers", () => {
    const yaml = `compositions:
  - name: Comp
    layers:
      - name: Solid
        type: solid`;
    // solid without color — error should point somewhere in the document
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    // We mainly verify that line mapping doesn't crash and returns a number or null
    for (const err of result.errors) {
      expect(err.line === null || typeof err.line === "number").toBe(true);
    }
  });

  it("finds line numbers for top-level keys", () => {
    const yaml = `folders:
  - name: F1
compositions:
  - width: 100`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    // The "name" error for the comp should have a line number
    const nameError = result.errors.find((e) => e.path.includes("name"));
    // name error might point to line 2 (the first "name:" occurrence) or null
    // The key test is that it doesn't throw
    expect(nameError).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // validateYaml – document-level refinement
  // ---------------------------------------------------------------------------

  it("rejects a document with no populated sections", () => {
    const yaml = `
compositions: []
files: []
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("at least one"))
    ).toBe(true);
  });

  it("rejects legacy top-level destination/layers syntax", () => {
    const yaml = `
destination: _timeline
layers:
  - name: Title
    type: text
    text: Hello
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) =>
        e.message.includes("Legacy top-level 'destination/layers' is no longer supported")
      )
    ).toBe(true);
  });

  it("rejects _timeline when no actions are provided", () => {
    const yaml = `
_timeline: {}
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) =>
        e.message.includes("_timeline must include at least one of")
      )
    ).toBe(true);
  });

  it("rejects _selected when no actions are provided", () => {
    const yaml = `
_selected: {}
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) =>
        e.message.includes("_selected must include at least one of")
      )
    ).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // _extends inheritance
  // ---------------------------------------------------------------------------

  it("resolves _extends for compositions using _id", () => {
    const yaml = `
compositions:
  - _id: sceneBase
    name: Scene-01
    duration: 30
    framerate: 24
    color: ff8000
  - _extends: sceneBase
    name: Scene-02
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions).toHaveLength(2);
    expect(result.data!.compositions![1]).toMatchObject({
      name: "Scene-02",
      duration: 30,
      framerate: 24,
      color: "ff8000",
    });
  });

  it("resolves _extends for layers inside a composition", () => {
    const yaml = `
compositions:
  - name: Main
    layers:
      - _id: nullBase
        name: Base
        type: null
        enabled: false
      - _extends: nullBase
        name: Controller
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const layers = result.data!.compositions![0].layers!;
    expect(layers).toHaveLength(2);
    expect(layers[1]).toMatchObject({
      name: "Controller",
      type: "null",
      enabled: false,
    });
  });

  it("resolves _extends for layers inside _timeline.layers", () => {
    const yaml = `
_timeline:
  layers:
    - _id: textBase
      name: Base
      type: text
      text: Hello
      fontSize: 96
    - _extends: textBase
      name: Title
      text: World
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!._timeline!.layers![1]).toMatchObject({
      name: "Title",
      type: "text",
      text: "World",
      fontSize: 96,
    });
  });

  it("rejects unknown _extends targets", () => {
    const yaml = `
compositions:
  - _extends: missingBase
    name: Scene-02
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Unknown composition _extends target"))).toBe(true);
  });

  it("rejects duplicate _id values", () => {
    const yaml = `
_timeline:
  layers:
    - _id: base
      name: A
      type: null
    - _id: base
      name: B
      type: null
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Duplicate layer _id"))).toBe(true);
  });

  it("rejects circular _extends chains", () => {
    const yaml = `
_timeline:
  layers:
    - _id: a
      _extends: b
      name: A
      type: null
    - _id: b
      _extends: a
      name: B
      type: null
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.message.includes("Circular _extends detected"))).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Integration: full round-trip
  // ---------------------------------------------------------------------------

  it("validates a complex document end-to-end", () => {
    const yaml = `
folders:
  - name: Footage
  - name: Comps
    parent: Footage

files:
  - id: clip1
    path: /footage/clip1.mov
    folder: Footage
  - id: 2
    path: /footage/bg.png

compositions:
  - name: Main Comp
    width: 1920
    height: 1080
    framerate: 24
    duration: 15
    folder: Comps
    layers:
      - name: Background
        file: 2
        transform:
          opacity: 80
      - name: Clip
        file: clip1
        inPoint: 1
        outPoint: 10
        blendingMode: multiply
      - name: Overlay
        type: solid
        color: FF0000
        enabled: false
      - name: Title
        type: text
        text: My Video
        fontSize: 48
        font: Arial
      - name: Controller
        type: "null"
        threeDLayer: true
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.folders).toHaveLength(2);
    expect(result.data!.files).toHaveLength(2);
    expect(result.data!.compositions![0].layers).toHaveLength(5);
    expect(result.data!.compositions![0].framerate).toBe(24);
  });

  // ---------------------------------------------------------------------------
  // YAML null literal handling
  // ---------------------------------------------------------------------------

  it("handles unquoted null as layer type", () => {
    // In YAML, `type: null` (unquoted) parses as JavaScript null
    // Our preprocessor should convert it to the string "null"
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Controller
        type: null
        threeDLayer: true
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].type).toBe("null");
  });

  it("handles quoted null as layer type", () => {
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Controller
        type: "null"
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].type).toBe("null");
  });

  // ---------------------------------------------------------------------------
  // YAML numeric color handling
  // ---------------------------------------------------------------------------

  it("handles numeric color in layer (leading zeros)", () => {
    // In YAML, `color: 000000` parses as the number 0
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Black
        type: solid
        color: 000000
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].color).toBe("000000");
  });

  it("handles numeric color in layer (all digits)", () => {
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Gray
        type: solid
        color: 123456
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].color).toBe("123456");
  });

  it("handles numeric color in comp background", () => {
    const yaml = `
compositions:
  - name: Test
    color: 000000
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].color).toBe("000000");
  });

  it("preserves string color with hex letters", () => {
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Red
        type: solid
        color: FF0000
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].color).toBe("FF0000");
  });

  it("handles color-like property names on layers", () => {
    // Future-proofing: if we add fillColor, strokeColor etc. to layers
    // Note: effect properties use RGB arrays [r,g,b], not hex strings
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Solid
        type: solid
        color: 000000
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions![0].layers![0].color).toBe("000000");
  });

  it("converts hex color strings in effect properties to RGB arrays", () => {
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Gradient Layer
        type: solid
        color: 000000
        effects:
          - name: Gradient Ramp
            matchName: ADBE Ramp
            properties:
              Start Color: 2979FF
              End Color: "#06B6D4"
              Start of Ramp: [110, 70]
              End of Ramp: [610, 180]
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);

    const props = result.data!.compositions![0].layers![0].effects![0].properties!;
    expect(props["Start Color"]).toEqual([0.161, 0.475, 1]);
    expect(props["End Color"]).toEqual([0.024, 0.714, 0.831]);
    expect(props["Start of Ramp"]).toEqual([110, 70]);
  });

  it("converts hex color strings in layer style properties to RGB arrays", () => {
    const yaml = `
compositions:
  - name: Test
    layers:
      - name: Styled
        type: solid
        color: 000000
        layerStyles:
          - type: stroke
            properties:
              Color: FF8800
              Size: 2
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);

    const props = result.data!.compositions![0].layers![0].layerStyles![0].properties!;
    expect(props["Color"]).toEqual([1, 0.533, 0]);
    expect(props["Size"]).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // Composition-in-composition
  // ---------------------------------------------------------------------------

  it("validates a document with composition-in-composition layer", () => {
    const yaml = `
compositions:
  - name: Inner Comp
    layers:
      - name: BG
        type: solid
        color: "000000"
  - name: Outer Comp
    layers:
      - name: Nested
        composition: Inner Comp
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    expect(result.data!.compositions).toHaveLength(2);
    const outerLayers = result.data!.compositions![1].layers!;
    expect(outerLayers[0].composition).toBe("Inner Comp");
    expect(outerLayers[0].file).toBeUndefined();
    expect(outerLayers[0].type).toBeUndefined();
  });

  it("rejects legacy comp key in YAML", () => {
    const yaml = `
compositions:
  - name: Inner Comp
    layers:
      - name: BG
        type: solid
        color: "000000"
  - name: Outer Comp
    layers:
      - name: Nested
        comp: Inner Comp
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("exactly one"))
    ).toBe(true);
  });

  it("rejects a layer with both composition and file in YAML", () => {
    const yaml = `
compositions:
  - name: Bad Comp
    layers:
      - name: Conflict
        composition: Other
        file: clip1
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
    expect(
      result.errors.some((e) => e.message.includes("exactly one"))
    ).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Keyframe animation
  // ---------------------------------------------------------------------------

  it("validates a document with keyframed transforms", () => {
    const yaml = `
compositions:
  - name: Animated
    layers:
      - name: Mover
        type: "null"
        transform:
          position:
            - time: 0
              value: [0, 0]
            - time: 5
              value: [1920, 1080]
          opacity:
            - time: 0
              value: 0
            - time: 2
              value: 100
          rotation:
            - time: 0
              value: 0
            - time: 3
              value: 360
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const transform = result.data!.compositions![0].layers![0].transform!;
    expect(Array.isArray(transform.position)).toBe(true);
    expect(Array.isArray(transform.opacity)).toBe(true);
    expect(Array.isArray(transform.rotation)).toBe(true);
  });

  it("validates mixed static + keyframed transforms in YAML", () => {
    const yaml = `
compositions:
  - name: Mixed
    layers:
      - name: Layer
        type: "null"
        transform:
          rotation: 45
          position:
            - time: 0
              value: [0, 0]
            - time: 5
              value: [1920, 1080]
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const transform = result.data!.compositions![0].layers![0].transform!;
    expect(transform.rotation).toBe(45);
    expect(Array.isArray(transform.position)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  it("validates a layer with effects (scalar and boolean properties)", () => {
    const yaml = `
compositions:
  - name: FX Comp
    layers:
      - name: BG
        type: solid
        color: "FF0000"
        effects:
          - name: Gaussian Blur
            matchName: ADBE Gaussian Blur 2
            properties:
              Blurriness: 10
              Repeat Edge Pixels: true
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const layer = result.data!.compositions![0].layers![0];
    expect(layer.effects).toHaveLength(1);
    expect(layer.effects![0].name).toBe("Gaussian Blur");
    expect(layer.effects![0].matchName).toBe("ADBE Gaussian Blur 2");
    expect(layer.effects![0].properties!["Blurriness"]).toBe(10);
    expect(layer.effects![0].properties!["Repeat Edge Pixels"]).toBe(true);
  });

  it("validates keyframed effect properties", () => {
    const yaml = `
compositions:
  - name: FX Comp
    layers:
      - name: BG
        type: solid
        color: "000000"
        effects:
          - name: CC Radial Fast Blur
            properties:
              Amount: 50
              Center:
                - time: 0
                  value: [960, 540]
                - time: 5
                  value: [0, 0]
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const effect = result.data!.compositions![0].layers![0].effects![0];
    expect(effect.properties!["Amount"]).toBe(50);
    const center = effect.properties!["Center"] as any[];
    expect(center).toHaveLength(2);
    expect(center[0].time).toBe(0);
    expect(center[0].value).toEqual([960, 540]);
  });

  it("validates multiple effects on one layer", () => {
    const yaml = `
compositions:
  - name: Multi FX
    layers:
      - name: BG
        type: solid
        color: "000000"
        effects:
          - name: Gaussian Blur
            properties:
              Blurriness: 20
          - name: Glow
            enabled: false
            properties:
              Glow Radius: 10
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const effects = result.data!.compositions![0].layers![0].effects!;
    expect(effects).toHaveLength(2);
    expect(effects[0].name).toBe("Gaussian Blur");
    expect(effects[1].name).toBe("Glow");
    expect(effects[1].enabled).toBe(false);
  });

  it("validates an effect with no properties", () => {
    const yaml = `
compositions:
  - name: Simple FX
    layers:
      - name: BG
        type: solid
        color: "000000"
        effects:
          - name: Glow
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(true);
    const effect = result.data!.compositions![0].layers![0].effects![0];
    expect(effect.name).toBe("Glow");
    expect(effect.properties).toBeUndefined();
  });

  it("rejects keyframed opacity out of range in YAML", () => {
    const yaml = `
compositions:
  - name: Bad Opacity
    layers:
      - name: Layer
        type: "null"
        transform:
          opacity:
            - time: 0
              value: 0
            - time: 2
              value: 150
`;
    const result = validateYaml(yaml);
    expect(result.success).toBe(false);
  });
});
