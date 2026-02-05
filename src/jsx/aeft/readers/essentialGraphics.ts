/**
 * Decode property path from controller name if encoded.
 * Returns { displayName, propertyPath } if found, or null if not encoded.
 */
function decodePropertyPath(fullName: string): { displayName: string; propertyPath: string } | null {
  // Match pattern: "Display Name [path:layer.transform.position]"
  var match = fullName.match(/^(.+?) \[path:([^\]]+)\]$/);
  if (match) {
    return {
      displayName: match[1],
      propertyPath: match[2],
    };
  }
  return null;
}

/**
 * Read Essential Graphics properties from a composition.
 *
 * When property paths are encoded in controller names (format: "Name [path:...]"),
 * this returns the full property path for round-trip support.
 */
export function readEssentialGraphics(comp: CompItem): object[] | null {
  var count = comp.motionGraphicsTemplateControllerCount;
  if (count === 0) return null;

  var items: object[] = [];
  for (var i = 0; i < count; i++) {
    var fullName = comp.getMotionGraphicsTemplateControllerName(i);
    var decoded = decodePropertyPath(fullName);

    if (decoded) {
      // Path was encoded - return property and name
      if (decoded.displayName === decoded.propertyPath) {
        // Name matches property path, use simple string form
        items.push(decoded.propertyPath);
      } else {
        // Custom display name, use object form
        items.push({
          property: decoded.propertyPath,
          name: decoded.displayName,
        });
      }
    } else {
      // Legacy entry without encoded path - return name only
      items.push({ name: fullName });
    }
  }
  return items;
}
