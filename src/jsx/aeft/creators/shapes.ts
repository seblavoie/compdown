/**
 * Shape definitions from YAML.
 */

interface ShapeFillDef {
  color: string;
  opacity?: number;
}

interface ShapeStrokeDef {
  color: string;
  width?: number;
  opacity?: number;
}

interface BaseShapeDef {
  name?: string;
  position?: [number, number];
  fill?: ShapeFillDef;
  stroke?: ShapeStrokeDef;
}

interface RectangleShapeDef extends BaseShapeDef {
  type: "rectangle";
  size: [number, number];
  roundness?: number;
}

interface EllipseShapeDef extends BaseShapeDef {
  type: "ellipse";
  size: [number, number];
}

interface PolygonShapeDef extends BaseShapeDef {
  type: "polygon";
  points: number;
  outerRadius: number;
  outerRoundness?: number;
  rotation?: number;
}

interface StarShapeDef extends BaseShapeDef {
  type: "star";
  points: number;
  outerRadius: number;
  innerRadius: number;
  outerRoundness?: number;
  innerRoundness?: number;
  rotation?: number;
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
 * Add a fill to a shape group.
 */
function addFill(groupContents: PropertyGroup, fillDef: ShapeFillDef): void {
  var fill = groupContents.addProperty("ADBE Vector Graphic - Fill") as PropertyGroup;
  var color = fill.property("ADBE Vector Fill Color") as Property;
  //@ts-ignore
  color.setValue(hexToRgb(fillDef.color));

  if (fillDef.opacity !== undefined) {
    var opacity = fill.property("ADBE Vector Fill Opacity") as Property;
    //@ts-ignore
    opacity.setValue(fillDef.opacity);
  }
}

/**
 * Add a stroke to a shape group.
 */
function addStroke(groupContents: PropertyGroup, strokeDef: ShapeStrokeDef): void {
  var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke") as PropertyGroup;
  var color = stroke.property("ADBE Vector Stroke Color") as Property;
  //@ts-ignore
  color.setValue(hexToRgb(strokeDef.color));

  if (strokeDef.width !== undefined) {
    var width = stroke.property("ADBE Vector Stroke Width") as Property;
    //@ts-ignore
    width.setValue(strokeDef.width);
  }

  if (strokeDef.opacity !== undefined) {
    var opacity = stroke.property("ADBE Vector Stroke Opacity") as Property;
    //@ts-ignore
    opacity.setValue(strokeDef.opacity);
  }
}

/**
 * Add a rectangle shape to a group.
 */
function addRectangle(groupContents: PropertyGroup, shapeDef: RectangleShapeDef): void {
  var rect = groupContents.addProperty("ADBE Vector Shape - Rect") as PropertyGroup;

  var size = rect.property("ADBE Vector Rect Size") as Property;
  //@ts-ignore
  size.setValue(shapeDef.size);

  if (shapeDef.position) {
    var pos = rect.property("ADBE Vector Rect Position") as Property;
    //@ts-ignore
    pos.setValue(shapeDef.position);
  }

  if (shapeDef.roundness !== undefined) {
    var roundness = rect.property("ADBE Vector Rect Roundness") as Property;
    //@ts-ignore
    roundness.setValue(shapeDef.roundness);
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
