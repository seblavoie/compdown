/**
 * Mask definitions from YAML.
 */

interface MaskPathDef {
  vertices: [number, number][];
  inTangents?: [number, number][];
  outTangents?: [number, number][];
  closed?: boolean;
}

interface MaskPathKeyframeDef {
  time: number;
  value: MaskPathDef;
  easing?: string;
}

interface ScalarKeyframeDef {
  time: number;
  value: number;
  easing?: string;
}

interface TupleKeyframeDef {
  time: number;
  value: [number, number];
  easing?: string;
}

interface MaskDef {
  name?: string;
  path: MaskPathDef | MaskPathKeyframeDef[];
  mode?: string;
  opacity?: number | ScalarKeyframeDef[];
  feather?: [number, number] | TupleKeyframeDef[];
  expansion?: number | ScalarKeyframeDef[];
  inverted?: boolean;
}

function isKeyframeArray(val: any): val is { time: number; value: any }[] {
  if (!(val instanceof Array) || val.length === 0) return false;
  return typeof val[0] === "object" && val[0] !== null && "time" in val[0];
}

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

  var keyVal = prop.keyValue(keyIndex);
  var dimensions = 1;
  if (keyVal instanceof Array) {
    dimensions = keyVal.length;
  }

  var easeInfluence = 33.33;
  var linearEase: KeyframeEase[] = [];
  var easedEase: KeyframeEase[] = [];

  for (var d = 0; d < dimensions; d++) {
    linearEase.push(new KeyframeEase(0, 0.1));
    easedEase.push(new KeyframeEase(0, easeInfluence));
  }

  prop.setInterpolationTypeAtKey(
    keyIndex,
    KeyframeInterpolationType.BEZIER,
    KeyframeInterpolationType.BEZIER
  );

  if (easing === "easeIn") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, linearEase);
  } else if (easing === "easeOut") {
    prop.setTemporalEaseAtKey(keyIndex, linearEase, easedEase);
  } else if (easing === "easeInOut") {
    prop.setTemporalEaseAtKey(keyIndex, easedEase, easedEase);
  }
}

function applyKeyframes(prop: Property, keyframes: { time: number; value: any; easing?: string }[]) {
  for (var k = 0; k < keyframes.length; k++) {
    prop.setValueAtTime(keyframes[k].time, keyframes[k].value);
  }
  for (var k = 0; k < keyframes.length; k++) {
    var easing = keyframes[k].easing;
    if (easing) {
      applyEasing(prop, k + 1, easing);
    }
  }
}

function buildShape(pathDef: MaskPathDef): Shape {
  var vertices = pathDef.vertices;
  var inTangents = pathDef.inTangents || [];
  var outTangents = pathDef.outTangents || [];

  if (inTangents.length > 0 && inTangents.length !== vertices.length) {
    throw new Error("inTangents must match vertices length for mask path");
  }
  if (outTangents.length > 0 && outTangents.length !== vertices.length) {
    throw new Error("outTangents must match vertices length for mask path");
  }

  var shape = new Shape();
  shape.vertices = vertices as any;
  shape.inTangents =
    (inTangents.length > 0 ? inTangents : vertices.map(() => [0, 0])) as any;
  shape.outTangents =
    (outTangents.length > 0 ? outTangents : vertices.map(() => [0, 0])) as any;
  shape.closed = pathDef.closed !== false;
  return shape;
}

function maskModeFromString(mode?: string): MaskMode {
  var map: { [key: string]: MaskMode } = {
    add: MaskMode.ADD,
    subtract: MaskMode.SUBTRACT,
    intersect: MaskMode.INTERSECT,
    lighten: MaskMode.LIGHTEN,
    darken: MaskMode.DARKEN,
    difference: MaskMode.DIFFERENCE,
    none: MaskMode.NONE,
  };
  if (mode && map[mode]) return map[mode];
  return MaskMode.ADD;
}

export function applyMasks(layer: AVLayer, masks: MaskDef[]): void {
  if (!masks || masks.length === 0) return;

  var maskGroup = layer.property("ADBE Mask Parade") as PropertyGroup;

  for (var i = 0; i < masks.length; i++) {
    var maskDef = masks[i];
    var mask = maskGroup.addProperty("ADBE Mask Atom") as PropertyGroup;

    if (maskDef.name) mask.name = maskDef.name;
    //@ts-ignore
    mask.maskMode = maskModeFromString(maskDef.mode);

    var shapeProp = mask.property("ADBE Mask Shape") as Property;
    if (isKeyframeArray(maskDef.path)) {
      for (var k = 0; k < maskDef.path.length; k++) {
        var shape = buildShape(maskDef.path[k].value);
        shapeProp.setValueAtTime(maskDef.path[k].time, shape);
      }
      // Easing for mask paths is ignored for now (shape props are not scalar/tuple).
    } else {
      //@ts-ignore
      shapeProp.setValue(buildShape(maskDef.path as MaskPathDef));
    }

    if (maskDef.opacity !== undefined) {
      var opacityProp = mask.property("ADBE Mask Opacity") as Property;
      if (isKeyframeArray(maskDef.opacity)) {
        applyKeyframes(opacityProp, maskDef.opacity as ScalarKeyframeDef[]);
      } else {
        //@ts-ignore
        opacityProp.setValue(maskDef.opacity);
      }
    }

    if (maskDef.feather !== undefined) {
      var featherProp = mask.property("ADBE Mask Feather") as Property;
      if (isKeyframeArray(maskDef.feather)) {
        applyKeyframes(featherProp, maskDef.feather as TupleKeyframeDef[]);
      } else {
        //@ts-ignore
        featherProp.setValue(maskDef.feather);
      }
    }

    if (maskDef.expansion !== undefined) {
      var expansionProp = mask.property("ADBE Mask Expansion") as Property;
      if (isKeyframeArray(maskDef.expansion)) {
        applyKeyframes(expansionProp, maskDef.expansion as ScalarKeyframeDef[]);
      } else {
        //@ts-ignore
        expansionProp.setValue(maskDef.expansion);
      }
    }

    if (maskDef.inverted !== undefined) {
      var invertedProp = mask.property("ADBE Mask Inverted") as Property;
      //@ts-ignore
      invertedProp.setValue(maskDef.inverted ? 1 : 0);
    }
  }
}
