/**
 * Convert RGB values (0-1 range) to hex string.
 */
function rgbToHex(r: number, g: number, b: number): string {
  var rHex = Math.round(r * 255).toString(16);
  var gHex = Math.round(g * 255).toString(16);
  var bHex = Math.round(b * 255).toString(16);
  return (
    (rHex.length === 1 ? "0" + rHex : rHex) +
    (gHex.length === 1 ? "0" + gHex : gHex) +
    (bHex.length === 1 ? "0" + bHex : bHex)
  );
}

/**
 * Read fill properties from a fill property group.
 */
function readFill(fillProp: PropertyGroup): object | null {
  var result: { [key: string]: any } = {};

  var colorProp = fillProp.property("ADBE Vector Fill Color") as Property;
  if (colorProp) {
    var colorVal = colorProp.value as number[];
    result.color = rgbToHex(colorVal[0], colorVal[1], colorVal[2]);
  }

  var opacityProp = fillProp.property("ADBE Vector Fill Opacity") as Property;
  if (opacityProp) {
    var opacity = opacityProp.value as number;
    if (opacity !== 100) {
      result.opacity = opacity;
    }
  }

  return result.color ? result : null;
}

/**
 * Read stroke properties from a stroke property group.
 */
function readStroke(strokeProp: PropertyGroup): object | null {
  var result: { [key: string]: any } = {};

  var colorProp = strokeProp.property("ADBE Vector Stroke Color") as Property;
  if (colorProp) {
    var colorVal = colorProp.value as number[];
    result.color = rgbToHex(colorVal[0], colorVal[1], colorVal[2]);
  }

  var widthProp = strokeProp.property("ADBE Vector Stroke Width") as Property;
  if (widthProp) {
    var width = widthProp.value as number;
    if (width !== 1) {
      result.width = width;
    }
  }

  var opacityProp = strokeProp.property("ADBE Vector Stroke Opacity") as Property;
  if (opacityProp) {
    var opacity = opacityProp.value as number;
    if (opacity !== 100) {
      result.opacity = opacity;
    }
  }

  return result.color ? result : null;
}

/**
 * Read rectangle shape properties.
 */
function readRectangle(rectProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "rectangle" };

  var sizeProp = rectProp.property("ADBE Vector Rect Size") as Property;
  if (sizeProp) {
    var size = sizeProp.value as number[];
    result.size = [Math.round(size[0]), Math.round(size[1])];
  }

  var posProp = rectProp.property("ADBE Vector Rect Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  var roundProp = rectProp.property("ADBE Vector Rect Roundness") as Property;
  if (roundProp) {
    var roundness = roundProp.value as number;
    if (roundness !== 0) {
      result.roundness = roundness;
    }
  }

  return result;
}

/**
 * Read ellipse shape properties.
 */
function readEllipse(ellipseProp: PropertyGroup): object {
  var result: { [key: string]: any } = { type: "ellipse" };

  var sizeProp = ellipseProp.property("ADBE Vector Ellipse Size") as Property;
  if (sizeProp) {
    var size = sizeProp.value as number[];
    result.size = [Math.round(size[0]), Math.round(size[1])];
  }

  var posProp = ellipseProp.property("ADBE Vector Ellipse Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  return result;
}

/**
 * Read polystar (star or polygon) shape properties.
 */
function readPolystar(polystarProp: PropertyGroup): object {
  var typeProp = polystarProp.property("ADBE Vector Star Type") as Property;
  var starType = typeProp ? (typeProp.value as number) : 1;
  var isPolygon = starType === 2;

  var result: { [key: string]: any } = { type: isPolygon ? "polygon" : "star" };

  var pointsProp = polystarProp.property("ADBE Vector Star Points") as Property;
  if (pointsProp) {
    result.points = Math.round(pointsProp.value as number);
  }

  var outerRadProp = polystarProp.property("ADBE Vector Star Outer Radius") as Property;
  if (outerRadProp) {
    result.outerRadius = Math.round(outerRadProp.value as number);
  }

  // Inner radius only for stars
  if (!isPolygon) {
    var innerRadProp = polystarProp.property("ADBE Vector Star Inner Radius") as Property;
    if (innerRadProp) {
      result.innerRadius = Math.round(innerRadProp.value as number);
    }
  }

  var posProp = polystarProp.property("ADBE Vector Star Position") as Property;
  if (posProp) {
    var pos = posProp.value as number[];
    if (pos[0] !== 0 || pos[1] !== 0) {
      result.position = [Math.round(pos[0]), Math.round(pos[1])];
    }
  }

  var outerRoundProp = polystarProp.property("ADBE Vector Star Outer Roundess") as Property;
  if (outerRoundProp) {
    var outerRound = outerRoundProp.value as number;
    if (outerRound !== 0) {
      result.outerRoundness = outerRound;
    }
  }

  // Inner roundness only for stars
  if (!isPolygon) {
    var innerRoundProp = polystarProp.property("ADBE Vector Star Inner Roundess") as Property;
    if (innerRoundProp) {
      var innerRound = innerRoundProp.value as number;
      if (innerRound !== 0) {
        result.innerRoundness = innerRound;
      }
    }
  }

  var rotProp = polystarProp.property("ADBE Vector Star Rotation") as Property;
  if (rotProp) {
    var rot = rotProp.value as number;
    if (rot !== 0) {
      result.rotation = rot;
    }
  }

  return result;
}

/**
 * Read a single shape group and return its shape definition.
 */
function readShapeGroup(group: PropertyGroup): object | null {
  var contents = group.property("ADBE Vectors Group") as PropertyGroup;
  if (!contents) return null;

  var shapeResult: { [key: string]: any } | null = null;
  var fill: object | null = null;
  var stroke: object | null = null;

  // Iterate through group contents to find shape, fill, stroke
  for (var i = 1; i <= contents.numProperties; i++) {
    var prop = contents.property(i) as PropertyGroup;
    if (!prop) continue;

    var matchName = prop.matchName;

    if (matchName === "ADBE Vector Shape - Rect") {
      shapeResult = readRectangle(prop);
    } else if (matchName === "ADBE Vector Shape - Ellipse") {
      shapeResult = readEllipse(prop);
    } else if (matchName === "ADBE Vector Shape - Star") {
      shapeResult = readPolystar(prop);
    } else if (matchName === "ADBE Vector Graphic - Fill") {
      fill = readFill(prop);
    } else if (matchName === "ADBE Vector Graphic - Stroke") {
      stroke = readStroke(prop);
    }
    // Skip paths (ADBE Vector Shape - Group) and other unsupported shapes
  }

  if (!shapeResult) return null;

  // Add group name if different from default
  var groupName = group.name;
  if (groupName && groupName !== "Group 1" && !groupName.match(/^Group \d+$/)) {
    shapeResult.name = groupName;
  }

  // Add fill and stroke
  if (fill) {
    shapeResult.fill = fill;
  }
  if (stroke) {
    shapeResult.stroke = stroke;
  }

  return shapeResult;
}

/**
 * Read all shapes from a shape layer.
 * Returns an array of shape definitions or null if no parametric shapes found.
 */
export function readShapes(layer: ShapeLayer): object[] | null {
  var rootVectors: PropertyGroup;
  try {
    rootVectors = layer.property("ADBE Root Vectors Group") as PropertyGroup;
  } catch (e) {
    return null;
  }

  if (!rootVectors || rootVectors.numProperties === 0) return null;

  var shapes: object[] = [];

  for (var i = 1; i <= rootVectors.numProperties; i++) {
    var group = rootVectors.property(i) as PropertyGroup;
    if (!group || group.matchName !== "ADBE Vector Group") continue;

    var shapeObj = readShapeGroup(group);
    if (shapeObj) {
      shapes.push(shapeObj);
    }
  }

  return shapes.length > 0 ? shapes : null;
}
