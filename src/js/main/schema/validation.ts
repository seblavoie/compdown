import yaml from "js-yaml";
import { CompdownDocumentSchema, type CompdownDocument } from "./types";

export interface ValidationError {
  line: number | null;
  message: string;
  path: string[];
}

export interface ValidationResult {
  success: boolean;
  data?: CompdownDocument;
  errors: ValidationError[];
}

class ExtendsResolutionError extends Error {
  path: (string | number)[];

  constructor(message: string, path: (string | number)[]) {
    super(message);
    this.name = "ExtendsResolutionError";
    this.path = path;
  }
}

/**
 * YAML forbids tab characters in indentation.
 * Convert only leading indentation tabs to spaces, preserving tabs in content.
 */
function normalizeIndentationTabs(yamlText: string): string {
  return yamlText
    .split("\n")
    .map((line) => {
      const match = line.match(/^([ \t]+)/);
      if (!match) return line;

      const leading = match[1];
      if (leading.indexOf("\t") === -1) return line;

      return leading.replace(/\t/g, "  ") + line.slice(leading.length);
    })
    .join("\n");
}

/**
 * Try to find the YAML line number for a Zod error path.
 * Walks the path segments and searches for matching keys in the raw YAML text.
 */
function findLineForPath(yamlText: string, path: (string | number)[]): number | null {
  const lines = yamlText.split("\n");

  // Build a search strategy: for a path like ["compositions", 0, "layers", 1, "name"],
  // we look for the key of the last meaningful string segment
  let lastKey: string | null = null;
  let arrayIndex: number | null = null;

  for (let i = path.length - 1; i >= 0; i--) {
    if (typeof path[i] === "string") {
      lastKey = path[i] as string;
      // Check if the next segment is an array index
      if (i > 0 && typeof path[i - 1] === "number") {
        arrayIndex = path[i - 1] as number;
      }
      break;
    }
  }

  if (!lastKey) return null;

  const keyPattern = new RegExp(`^\\s*${lastKey}\\s*:`);
  let matchCount = 0;

  for (let i = 0; i < lines.length; i++) {
    if (keyPattern.test(lines[i])) {
      // If we have an array index context, we need to find the nth occurrence
      if (arrayIndex !== null) {
        matchCount++;
        if (matchCount > arrayIndex) {
          return i + 1; // 1-indexed
        }
      } else {
        return i + 1;
      }
    }
  }

  return null;
}

/**
 * Check if a property name looks like a color property.
 */
function isColorProperty(key: string): boolean {
  return key.toLowerCase().endsWith("color") || key.toLowerCase().endsWith("colour");
}

/**
 * Convert a numeric color value to a zero-padded 6-character hex string.
 * In YAML, `color: 000000` parses as the number 0, but we want "000000".
 */
function normalizeColor(value: unknown): string | unknown {
  if (typeof value === "number") {
    return value.toString().padStart(6, "0");
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
    if (match) {
      return match[1];
    }
  }
  return value;
}

/**
 * Convert a hex color string to AE RGB array (0-1 range).
 * Supports `RRGGBB` and `#RRGGBB`.
 */
function normalizeEffectColor(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return value;

  const hex = match[1];
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return [
    Math.round((r / 255) * 1000) / 1000,
    Math.round((g / 255) * 1000) / 1000,
    Math.round((b / 255) * 1000) / 1000,
  ];
}

/**
 * Normalize color properties in an object by checking all keys.
 */
function normalizeColorProperties(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (isColorProperty(key)) {
      obj[key] = normalizeColor(obj[key]);
    }
  }
}

/**
 * Normalize color-like keys in effect/layer-style property maps.
 * Effect color values are RGB arrays in 0-1 range.
 */
function normalizeEffectPropertyColors(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (isColorProperty(key)) {
      obj[key] = normalizeEffectColor(obj[key]);
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }
  if (!isObject(value)) {
    return value;
  }

  const cloned: Record<string, unknown> = {};
  for (const key of Object.keys(value)) {
    cloned[key] = cloneValue(value[key]);
  }
  return cloned as T;
}

function mergeObjects(
  parent: Record<string, unknown>,
  child: Record<string, unknown>
): Record<string, unknown> {
  const merged = cloneValue(parent);

  for (const key of Object.keys(child)) {
    if (key === "_id" || key === "_extends") continue;

    const parentValue = merged[key];
    const childValue = child[key];
    if (isObject(parentValue) && isObject(childValue)) {
      merged[key] = mergeObjects(parentValue, childValue);
      continue;
    }

    merged[key] = cloneValue(childValue);
  }

  return merged;
}

function resolveExtendsInCollection(
  collection: unknown[],
  collectionPath: (string | number)[],
  label: "composition" | "layer"
): unknown[] {
  const idToIndex: Record<string, number> = {};
  for (let i = 0; i < collection.length; i++) {
    const item = collection[i];
    if (!isObject(item)) continue;
    if (item._id === undefined) continue;

    if (typeof item._id !== "string" || item._id.trim() === "") {
      throw new ExtendsResolutionError(
        `${label} _id must be a non-empty string`,
        collectionPath.concat([i, "_id"])
      );
    }

    if (idToIndex[item._id] !== undefined) {
      throw new ExtendsResolutionError(
        `Duplicate ${label} _id '${item._id}'`,
        collectionPath.concat([i, "_id"])
      );
    }

    idToIndex[item._id] = i;
  }

  const cache: Array<Record<string, unknown> | null> = new Array(collection.length);
  const visiting: Record<number, true> = {};

  const resolveAtIndex = (index: number): Record<string, unknown> => {
    if (cache[index]) return cloneValue(cache[index]!);
    if (visiting[index]) {
      throw new ExtendsResolutionError(
        `Circular _extends detected in ${label}s`,
        collectionPath.concat([index, "_extends"])
      );
    }

    const rawItem = collection[index];
    if (!isObject(rawItem)) {
      throw new ExtendsResolutionError(
        `${label} entry must be an object`,
        collectionPath.concat([index])
      );
    }

    visiting[index] = true;

    let resolvedBase: Record<string, unknown> = {};
    if (rawItem._extends !== undefined) {
      if (typeof rawItem._extends !== "string" || rawItem._extends.trim() === "") {
        throw new ExtendsResolutionError(
          `${label} _extends must be a non-empty string`,
          collectionPath.concat([index, "_extends"])
        );
      }

      const baseIndex = idToIndex[rawItem._extends];
      if (baseIndex === undefined) {
        throw new ExtendsResolutionError(
          `Unknown ${label} _extends target '${rawItem._extends}'`,
          collectionPath.concat([index, "_extends"])
        );
      }

      resolvedBase = resolveAtIndex(baseIndex);
    }

    const merged = mergeObjects(resolvedBase, rawItem);
    cache[index] = merged;
    delete visiting[index];
    return cloneValue(merged);
  };

  const resolved: unknown[] = [];
  for (let i = 0; i < collection.length; i++) {
    resolved.push(resolveAtIndex(i));
  }
  return resolved;
}

/**
 * Normalize known layer-level quirks and color properties.
 */
function preprocessLayerObject(layerObj: Record<string, unknown>): void {
  // Handle type: null
  if ("name" in layerObj && layerObj.type === null) {
    layerObj.type = "null";
  }

  // Handle color properties on layer (not in effects - those use RGB arrays)
  normalizeColorProperties(layerObj);

  if (Array.isArray(layerObj.effects)) {
    for (const effect of layerObj.effects as unknown[]) {
      if (!effect || typeof effect !== "object") continue;
      const effectObj = effect as Record<string, unknown>;
      if (!effectObj.properties || typeof effectObj.properties !== "object") continue;

      normalizeEffectPropertyColors(effectObj.properties as Record<string, unknown>);
    }
  }

  if (Array.isArray(layerObj.layerStyles)) {
    for (const layerStyle of layerObj.layerStyles as unknown[]) {
      if (!layerStyle || typeof layerStyle !== "object") continue;
      const styleObj = layerStyle as Record<string, unknown>;
      if (!styleObj.properties || typeof styleObj.properties !== "object") continue;

      normalizeEffectPropertyColors(styleObj.properties as Record<string, unknown>);
    }
  }
}

/**
 * Post-process parsed YAML to handle YAML quirks:
 * - `type: null` parses as JavaScript null, but we want the string "null"
 * - `color: 000000` parses as number 0, but we want the string "000000"
 */
function preprocessParsedYaml(data: unknown): unknown {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  const obj = data as Record<string, unknown>;

  // Resolve composition-level inheritance first.
  if (Array.isArray(obj.compositions)) {
    obj.compositions = resolveExtendsInCollection(
      obj.compositions as unknown[],
      ["compositions"],
      "composition"
    );
  }

  // Recurse into compositions and layers
  if (Array.isArray(obj.compositions)) {
    for (let compIndex = 0; compIndex < obj.compositions.length; compIndex++) {
      const comp = obj.compositions[compIndex];
      if (comp && typeof comp === "object") {
        const compObj = comp as Record<string, unknown>;

        // Handle color properties on comp
        normalizeColorProperties(compObj);

        if (Array.isArray(compObj.layers)) {
          compObj.layers = resolveExtendsInCollection(
            compObj.layers as unknown[],
            ["compositions", compIndex, "layers"],
            "layer"
          );
        }

        // Process layers
        if (Array.isArray(compObj.layers)) {
          for (const layer of compObj.layers as unknown[]) {
            if (layer && typeof layer === "object") {
              preprocessLayerObject(layer as Record<string, unknown>);
            }
          }
        }
      }
    }
  }

  // Process top-level timeline layers
  if (obj._timeline && typeof obj._timeline === "object") {
    const timelineObj = obj._timeline as Record<string, unknown>;
    if (Array.isArray(timelineObj.layers)) {
      timelineObj.layers = resolveExtendsInCollection(
        timelineObj.layers as unknown[],
        ["_timeline", "layers"],
        "layer"
      );
    }
    if (Array.isArray(timelineObj.layers)) {
      for (const layer of timelineObj.layers) {
        if (layer && typeof layer === "object") {
          preprocessLayerObject(layer as Record<string, unknown>);
        }
      }
    }
    if (
      timelineObj.set &&
      typeof timelineObj.set === "object" &&
      Array.isArray((timelineObj.set as Record<string, unknown>).layers)
    ) {
      for (const layer of (timelineObj.set as Record<string, unknown>).layers as unknown[]) {
        if (layer && typeof layer === "object") {
          preprocessLayerObject(layer as Record<string, unknown>);
        }
      }
    }
  }

  if (obj._selected && typeof obj._selected === "object") {
    const selectedObj = obj._selected as Record<string, unknown>;
    if (selectedObj.set && typeof selectedObj.set === "object") {
      preprocessLayerObject(selectedObj.set as Record<string, unknown>);
    }
  }

  return data;
}

function validateNoLegacyTimelineSyntax(yamlText: string, parsed: unknown): ValidationError[] {
  if (!parsed || typeof parsed !== "object") return [];
  const obj = parsed as Record<string, unknown>;

  if ("destination" in obj || "layers" in obj) {
    const line = "destination" in obj
      ? findLineForPath(yamlText, ["destination"])
      : findLineForPath(yamlText, ["layers"]);
    return [
      {
        line,
        message: "Legacy top-level 'destination/layers' is no longer supported; use '_timeline.layers' instead",
        path: ["_timeline", "layers"],
      },
    ];
  }

  return [];
}

/**
 * Parse and validate a YAML string against the Compdown schema.
 */
export function validateYaml(yamlText: string): ValidationResult {
  const normalizedYamlText = normalizeIndentationTabs(yamlText);

  // Step 1: Parse YAML
  let parsed: unknown;
  try {
    parsed = yaml.load(normalizedYamlText);
  } catch (e) {
    const yamlError = e as yaml.YAMLException;
    return {
      success: false,
      errors: [
        {
          line: yamlError.mark?.line != null ? yamlError.mark.line + 1 : null,
          message: yamlError.reason || yamlError.message,
          path: [],
        },
      ],
    };
  }

  if (parsed === null || parsed === undefined) {
    return {
      success: false,
      errors: [{ line: 1, message: "Document is empty", path: [] }],
    };
  }

  // Step 1.5: Normalize YAML quirks (null literals, numeric colors)
  try {
    preprocessParsedYaml(parsed);
  } catch (e) {
    if (e instanceof ExtendsResolutionError) {
      return {
        success: false,
        errors: [
          {
            line: findLineForPath(normalizedYamlText, e.path),
            message: e.message,
            path: e.path.map(String),
          },
        ],
      };
    }

    return {
      success: false,
      errors: [
        {
          line: null,
          message: e instanceof Error ? e.message : "Invalid document",
          path: [],
        },
      ],
    };
  }

  // Step 1.75: Reject removed legacy top-level syntax with a focused error.
  const legacySyntaxErrors = validateNoLegacyTimelineSyntax(normalizedYamlText, parsed);
  if (legacySyntaxErrors.length > 0) {
    return { success: false, errors: legacySyntaxErrors };
  }

  // Step 2: Validate with Zod
  const result = CompdownDocumentSchema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }

  // Step 3: Map Zod errors to line numbers
  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    line: findLineForPath(normalizedYamlText, issue.path),
    message: issue.message,
    path: issue.path.map(String),
  }));

  return { success: false, errors };
}
