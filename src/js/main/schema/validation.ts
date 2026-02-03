import yaml from "js-yaml";
import { ZodError } from "zod";
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
  return value;
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
 * Post-process parsed YAML to handle YAML quirks:
 * - `type: null` parses as JavaScript null, but we want the string "null"
 * - `color: 000000` parses as number 0, but we want the string "000000"
 */
function preprocessParsedYaml(data: unknown): unknown {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  const obj = data as Record<string, unknown>;

  // Recurse into compositions and layers
  if (Array.isArray(obj.compositions)) {
    for (const comp of obj.compositions) {
      if (comp && typeof comp === "object") {
        const compObj = comp as Record<string, unknown>;

        // Handle color properties on comp
        normalizeColorProperties(compObj);

        // Process layers
        if (Array.isArray(compObj.layers)) {
          for (const layer of compObj.layers as unknown[]) {
            if (layer && typeof layer === "object") {
              const layerObj = layer as Record<string, unknown>;

              // Handle type: null
              if ("name" in layerObj && layerObj.type === null) {
                layerObj.type = "null";
              }

              // Handle color properties on layer (not in effects - those use RGB arrays)
              normalizeColorProperties(layerObj);
            }
          }
        }
      }
    }
  }

  return data;
}

/**
 * Parse and validate a YAML string against the Compdown schema.
 */
export function validateYaml(yamlText: string): ValidationResult {
  // Step 1: Parse YAML
  let parsed: unknown;
  try {
    parsed = yaml.load(yamlText);
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

  // Step 1.5: Handle YAML null literal in layer type fields
  preprocessParsedYaml(parsed);

  // Step 2: Validate with Zod
  const result = CompdownDocumentSchema.safeParse(parsed);

  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }

  // Step 3: Map Zod errors to line numbers
  const errors: ValidationError[] = result.error.issues.map((issue) => ({
    line: findLineForPath(yamlText, issue.path),
    message: issue.message,
    path: issue.path.map(String),
  }));

  return { success: false, errors };
}
