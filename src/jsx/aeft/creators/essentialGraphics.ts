/**
 * Essential Graphics Panel support.
 * Adds layer properties to the Motion Graphics Template controller.
 */

interface EssentialGraphicsDef {
  property: string;
  name?: string;
  encodePathInName?: boolean;
}

/**
 * Mapping of user-friendly transform property names to AE matchNames.
 */
var transformMatchNames: { [key: string]: string } = {
  anchorPoint: "ADBE Anchor Point",
  position: "ADBE Position",
  scale: "ADBE Scale",
  rotation: "ADBE Rotate Z",
  opacity: "ADBE Opacity",
};

/**
 * Resolve a property path like "title.transform.position" to an AE Property.
 *
 * Supported path formats:
 * - layer.transform.position (or scale, rotation, opacity, anchorPoint)
 * - layer.text (text source property)
 * - layer.effects.EffectName.PropertyName
 */
function resolvePropertyPath(comp: CompItem, path: string): Property | null {
  var parts = path.split(".");
  if (parts.length < 2) return null;

  var layerName = parts[0];

  // Find the layer by name
  var layer: Layer | null = null;
  for (var i = 1; i <= comp.numLayers; i++) {
    if (comp.layers[i].name === layerName) {
      layer = comp.layers[i];
      break;
    }
  }
  if (!layer) return null;

  var propType = parts[1];

  // Handle transform properties: layer.transform.position
  if (propType === "transform" && parts.length >= 3) {
    var transformProp = parts[2];
    var matchName = transformMatchNames[transformProp];
    if (!matchName) return null;

    var transformGroup = layer.property("ADBE Transform Group");
    if (!transformGroup) return null;

    return transformGroup.property(matchName) as Property;
  }

  // Handle text source: layer.text
  if (propType === "text") {
    var textProps = layer.property("ADBE Text Properties");
    if (!textProps) return null;

    return textProps.property("ADBE Text Document") as Property;
  }

  // Handle effects: layer.effects.EffectName.PropertyName
  if (propType === "effects" && parts.length >= 4) {
    var effectsGroup = layer.property("ADBE Effect Parade") as PropertyGroup;
    if (!effectsGroup) return null;

    var effectName = parts[2];
    var propName = parts.slice(3).join("."); // In case property name contains dots

    // Find the effect by name
    var effect: PropertyGroup | null = null;
    for (var j = 1; j <= effectsGroup.numProperties; j++) {
      var eff = effectsGroup.property(j) as PropertyGroup;
      if (eff.name === effectName) {
        effect = eff;
        break;
      }
    }
    if (!effect) return null;

    return effect.property(propName) as Property;
  }

  return null;
}

/**
 * Encode property path into controller name for round-trip support.
 * Format: "Display Name [path:layer.transform.position]"
 */
function encodePropertyPath(displayName: string, propertyPath: string): string {
  return displayName + " [path:" + propertyPath + "]";
}

/**
 * Normalize an essential graphics item to the expanded form.
 */
function normalizeItem(item: string | EssentialGraphicsDef): EssentialGraphicsDef {
  if (typeof item === "string") {
    return { property: item };
  }
  return item;
}

/**
 * Add properties to the Essential Graphics Panel.
 * Each item can be a string path or an object with property and optional name.
 */
export function addEssentialGraphics(
  comp: CompItem,
  items: Array<string | EssentialGraphicsDef>
): void {
  for (var i = 0; i < items.length; i++) {
    var item = normalizeItem(items[i]);
    var prop = resolvePropertyPath(comp, item.property);

    if (!prop) {
      // Property not found - skip silently
      continue;
    }

    // Check if the property can be added to Motion Graphics Template
    if (!prop.canAddToMotionGraphicsTemplate(comp)) {
      continue;
    }

    // Determine display name and whether to encode path
    var displayName = item.name || item.property;
    var shouldEncode = item.encodePathInName !== false; // Default is true

    // Add to Motion Graphics Template
    if (shouldEncode) {
      // Encode property path in the controller name for round-trip support
      var encodedName = encodePropertyPath(displayName, item.property);
      prop.addToMotionGraphicsTemplateAs(comp, encodedName);
    } else {
      // Use name as-is without path encoding
      prop.addToMotionGraphicsTemplateAs(comp, displayName);
    }
  }
}
