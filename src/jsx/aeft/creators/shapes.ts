/**
 * Shape definitions from YAML.
 */

interface KeyframeDef {
  time: number;
  value: number | [number, number] | [number, number, number];
  easing?: string;
}

interface ShapeFillDef {
  color: string | KeyframeDef[];
  opacity?: number | KeyframeDef[];
}

interface ShapeStrokeDef {
  color: string | KeyframeDef[];
  width?: number | KeyframeDef[];
  opacity?: number | KeyframeDef[];
}

interface BaseShapeDef {
  name?: string;
  position?: [number, number] | KeyframeDef[];
  fill?: ShapeFillDef;
  stroke?: ShapeStrokeDef;
}

interface RectangleShapeDef extends BaseShapeDef {
  type: "rectangle";
  size: [number, number] | KeyframeDef[];
  roundness?: number | KeyframeDef[];
}

interface EllipseShapeDef extends BaseShapeDef {
  type: "ellipse";
  size: [number, number] | KeyframeDef[];
}

interface PolygonShapeDef extends BaseShapeDef {
  type: "polygon";
  points: number | KeyframeDef[];
  outerRadius: number | KeyframeDef[];
  outerRoundness?: number | KeyframeDef[];
  rotation?: number | KeyframeDef[];
}

interface StarShapeDef extends BaseShapeDef {
  type: "star";
  points: number | KeyframeDef[];
  outerRadius: number | KeyframeDef[];
  innerRadius: number | KeyframeDef[];
  outerRoundness?: number | KeyframeDef[];
  innerRoundness?: number | KeyframeDef[];
  rotation?: number | KeyframeDef[];
}

type ShapeDef = RectangleShapeDef | EllipseShapeDef | PolygonShapeDef | StarShapeDef;

/**
 * Parse hex color string to [r, g, b] array (0-1 range).
 */
function hexToRgb(hex: string): [number, number, number] {
  var r = parseInt(hex.substring(0, 2), 16) / 255;
  var g = parseInt(hex.substring(2, 4), 16) / 255;
  var b = parseInt(hex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Check if a value is an array of keyframe objects (has `time` property)
 * rather than a numeric tuple like [100, 200].
 */
function isKeyframeArray(val: any): val is KeyframeDef[] {
  if (!(val instanceof Array) || val.length === 0) return false;
  return typeof val[0] === "object" && val[0] !== null && "time" in val[0];
}

/**
 * Apply easing to a keyframe.
 * @param prop The property containing the keyframe
 * @param keyIndex 1-based keyframe index
 * @param easing The easing type: "linear", "easeIn", "easeOut", "easeInOut", "hold"
 */
function applyEasing(prop: Property, keyIndex: number, easing: string): void {
  if (easing === "hold") {
    prop.setInterpolationTypeAtKey(
      keyIndex,
      KeyframeInterpolationType.HOLD,
      KeyframeInterpolationType.HOLD
    );
    return;
  }

  if (easing === "linear") {
    prop.setInterpolationTypeAtKey(
      keyIndex,
      KeyframeInterpolationType.LINEAR,
      KeyframeInterpolationType.LINEAR
    );
    return;
  }

  // For bezier easing, we need to determine the number of dimensions
  var keyVal = prop.keyValue(keyIndex);
  var dimensions = 1;
  if (keyVal instanceof Array) {
    dimensions = keyVal.length;
  }

  // Create ease objects for each dimension
  var easeInfluence = 33.33;
  var linearEase: KeyframeEase[] = [];
  var easedEase: KeyframeEase[] = [];

  for (var d = 0; d < dimensions; d++) {
    linearEase.push(new KeyframeEase(0, 0.1));
    easedEase.push(new KeyframeEase(0, easeInfluence));
  }

  // Set interpolation type to bezier first
  prop.setInterpolationTypeAtKey(
    keyIndex,
    KeyframeInterpolationType.BEZIER,
    KeyframeInterpolationType.BEZIER
  );

  // Apply the appropriate ease
  if (easing === "easeIn") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, linearEase);
  } else if (easing === "easeOut") {
    prop.setTemporalEaseAtKey(keyIndex, linearEase, easedEase);
  } else if (easing === "easeInOut") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, easedEase);
  }
}

/**
 * Apply keyframes to a property.
 */
function applyKeyframes(prop: Property, keyframes: KeyframeDef[]): void {
  // First pass: set all keyframe values
  for (var k = 0; k < keyframes.length; k++) {
    prop.setValueAtTime(keyframes[k].time, keyframes[k].value);
  }

  // Second pass: apply easing (keyframe indices are 1-based in AE)
  for (var k = 0; k < keyframes.length; k++) {
    var easing = keyframes[k].easing;
    if (easing) {
      applyEasing(prop, k + 1, easing);
    }
  }
}

/**
 * Add a fill to a shape group.
 */
function addFill(groupContents: PropertyGroup, fillDef: ShapeFillDef): void {
  var fill = groupContents.addProperty("ADBE Vector Graphic - Fill") as PropertyGroup;
  var colorProp = fill.property("ADBE Vector Fill Color") as Property;

  if (isKeyframeArray(fillDef.color)) {
    applyKeyframes(colorProp, fillDef.color);
  } else {
    //@ts-ignore
    colorProp.setValue(hexToRgb(fillDef.color as string));
  }

  if (fillDef.opacity !== undefined) {
    var opacityProp = fill.property("ADBE Vector Fill Opacity") as Property;
    if (isKeyframeArray(fillDef.opacity)) {
      applyKeyframes(opacityProp, fillDef.opacity);
    } else {
      //@ts-ignore
      opacityProp.setValue(fillDef.opacity);
    }
  }
}

/**
 * Add a stroke to a shape group.
 */
function addStroke(groupContents: PropertyGroup, strokeDef: ShapeStrokeDef): void {
  var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke") as PropertyGroup;
  var colorProp = stroke.property("ADBE Vector Stroke Color") as Property;

  if (isKeyframeArray(strokeDef.color)) {
    applyKeyframes(colorProp, strokeDef.color);
  } else {
    //@ts-ignore
    colorProp.setValue(hexToRgb(strokeDef.color as string));
  }

  if (strokeDef.width !== undefined) {
    var widthProp = stroke.property("ADBE Vector Stroke Width") as Property;
    if (isKeyframeArray(strokeDef.width)) {
      applyKeyframes(widthProp, strokeDef.width);
    } else {
      //@ts-ignore
      widthProp.setValue(strokeDef.width);
    }
  }

  if (strokeDef.opacity !== undefined) {
    var opacityProp = stroke.property("ADBE Vector Stroke Opacity") as Property;
    if (isKeyframeArray(strokeDef.opacity)) {
      applyKeyframes(opacityProp, strokeDef.opacity);
    } else {
      //@ts-ignore
      opacityProp.setValue(strokeDef.opacity);
    }
  }
}

/**
 * Add a rectangle shape to a group.
 */
function addRectangle(groupContents: PropertyGroup, shapeDef: RectangleShapeDef): void {
  var rect = groupContents.addProperty("ADBE Vector Shape - Rect") as PropertyGroup;

  var sizeProp = rect.property("ADBE Vector Rect Size") as Property;
  if (isKeyframeArray(shapeDef.size)) {
    applyKeyframes(sizeProp, shapeDef.size);
  } else {
    //@ts-ignore
    sizeProp.setValue(shapeDef.size);
  }

  if (shapeDef.position) {
    var posProp = rect.property("ADBE Vector Rect Position") as Property;
    if (isKeyframeArray(shapeDef.position)) {
      applyKeyframes(posProp, shapeDef.position);
    } else {
      //@ts-ignore
      posProp.setValue(shapeDef.position);
    }
  }

  if (shapeDef.roundness !== undefined) {
    var roundnessProp = rect.property("ADBE Vector Rect Roundness") as Property;
    if (isKeyframeArray(shapeDef.roundness)) {
      applyKeyframes(roundnessProp, shapeDef.roundness);
    } else {
      //@ts-ignore
      roundnessProp.setValue(shapeDef.roundness);
    }
  }
}

/**
 * Add an ellipse shape to a group.
 */
function addEllipse(groupContents: PropertyGroup, shapeDef: EllipseShapeDef): void {
  var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse") as PropertyGroup;

  var size = ellipse.property("ADBE Vector Ellipse Size") as Property;
  //@ts-ignore
  size.setValue(shapeDef.size);

  if (shapeDef.position) {
    var pos = ellipse.property("ADBE Vector Ellipse Position") as Property;
    //@ts-ignore
    pos.setValue(shapeDef.position);
  }
}

/**
 * Add a polygon shape to a group (uses polystar with type = polygon).
 */
function addPolygon(groupContents: PropertyGroup, shapeDef: PolygonShapeDef): void {
  var polystar = groupContents.addProperty("ADBE Vector Shape - Star") as PropertyGroup;

  // Set type to polygon (2)
  var type = polystar.property("ADBE Vector Star Type") as Property;
  //@ts-ignore
  type.setValue(2); // 1 = star, 2 = polygon

  var points = polystar.property("ADBE Vector Star Points") as Property;
  //@ts-ignore
  points.setValue(shapeDef.points);

  var outerRadius = polystar.property("ADBE Vector Star Outer Radius") as Property;
  //@ts-ignore
  outerRadius.setValue(shapeDef.outerRadius);

  if (shapeDef.position) {
    var pos = polystar.property("ADBE Vector Star Position") as Property;
    //@ts-ignore
    pos.setValue(shapeDef.position);
  }

  if (shapeDef.outerRoundness !== undefined) {
    var outerRound = polystar.property("ADBE Vector Star Outer Roundess") as Property;
    //@ts-ignore
    outerRound.setValue(shapeDef.outerRoundness);
  }

  if (shapeDef.rotation !== undefined) {
    var rotation = polystar.property("ADBE Vector Star Rotation") as Property;
    //@ts-ignore
    rotation.setValue(shapeDef.rotation);
  }
}

/**
 * Add a star shape to a group.
 */
function addStar(groupContents: PropertyGroup, shapeDef: StarShapeDef): void {
  var polystar = groupContents.addProperty("ADBE Vector Shape - Star") as PropertyGroup;

  // Set type to star (1) - this is the default, but be explicit
  var type = polystar.property("ADBE Vector Star Type") as Property;
  //@ts-ignore
  type.setValue(1); // 1 = star, 2 = polygon

  var points = polystar.property("ADBE Vector Star Points") as Property;
  //@ts-ignore
  points.setValue(shapeDef.points);

  var outerRadius = polystar.property("ADBE Vector Star Outer Radius") as Property;
  //@ts-ignore
  outerRadius.setValue(shapeDef.outerRadius);

  var innerRadius = polystar.property("ADBE Vector Star Inner Radius") as Property;
  //@ts-ignore
  innerRadius.setValue(shapeDef.innerRadius);

  if (shapeDef.position) {
    var pos = polystar.property("ADBE Vector Star Position") as Property;
    //@ts-ignore
    pos.setValue(shapeDef.position);
  }

  if (shapeDef.outerRoundness !== undefined) {
    var outerRound = polystar.property("ADBE Vector Star Outer Roundess") as Property;
    //@ts-ignore
    outerRound.setValue(shapeDef.outerRoundness);
  }

  if (shapeDef.innerRoundness !== undefined) {
    var innerRound = polystar.property("ADBE Vector Star Inner Roundess") as Property;
    //@ts-ignore
    innerRound.setValue(shapeDef.innerRoundness);
  }

  if (shapeDef.rotation !== undefined) {
    var rotation = polystar.property("ADBE Vector Star Rotation") as Property;
    //@ts-ignore
    rotation.setValue(shapeDef.rotation);
  }
}

/**
 * Apply shapes to a shape layer.
 * Creates shape groups with parametric shapes (rect, ellipse, polygon, star)
 * and optional fill/stroke.
 */
export function applyShapes(layer: ShapeLayer, shapes: ShapeDef[]): void {
  var rootVectors = layer.property("ADBE Root Vectors Group") as PropertyGroup;

  for (var i = 0; i < shapes.length; i++) {
    var shapeDef = shapes[i];

    // Create a new group for this shape
    var group = rootVectors.addProperty("ADBE Vector Group") as PropertyGroup;

    // Set group name if provided
    if (shapeDef.name) {
      group.name = shapeDef.name;
    }

    // Get the contents of the group where we add the shape and fill/stroke
    var groupContents = group.property("ADBE Vectors Group") as PropertyGroup;

    // Add the shape path
    switch (shapeDef.type) {
      case "rectangle":
        addRectangle(groupContents, shapeDef as RectangleShapeDef);
        break;
      case "ellipse":
        addEllipse(groupContents, shapeDef as EllipseShapeDef);
        break;
      case "polygon":
        addPolygon(groupContents, shapeDef as PolygonShapeDef);
        break;
      case "star":
        addStar(groupContents, shapeDef as StarShapeDef);
        break;
    }

    // Add stroke first (so fill appears on top in layer panel, but renders correctly)
    if (shapeDef.stroke) {
      addStroke(groupContents, shapeDef.stroke);
    }

    // Add fill
    if (shapeDef.fill) {
      addFill(groupContents, shapeDef.fill);
    }
  }
}
