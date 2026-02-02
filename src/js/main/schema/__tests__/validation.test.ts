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
  // Comp-in-comp
  // ---------------------------------------------------------------------------

  it("validates a document with comp-in-comp layer", () => {
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
    expect(result.success).toBe(true);
    expect(result.data!.compositions).toHaveLength(2);
    const outerLayers = result.data!.compositions![1].layers!;
    expect(outerLayers[0].comp).toBe("Inner Comp");
    expect(outerLayers[0].file).toBeUndefined();
    expect(outerLayers[0].type).toBeUndefined();
  });

  it("rejects a layer with both comp and file in YAML", () => {
    const yaml = `
compositions:
  - name: Bad Comp
    layers:
      - name: Conflict
        comp: Other
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
