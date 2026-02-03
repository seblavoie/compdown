/**
 * Mapping of YAML blending mode names to AE BlendingMode enum values.
 * ExtendScript doesn't support Map, so we use a plain object lookup.
 */
var blendingModes: { [key: string]: BlendingMode } = {
  normal: BlendingMode.NORMAL,
  dissolve: BlendingMode.DISSOLVE,
  darken: BlendingMode.DARKEN,
  multiply: BlendingMode.MULTIPLY,
  colorBurn: BlendingMode.COLOR_BURN,
  linearBurn: BlendingMode.LINEAR_BURN,
  darkerColor: BlendingMode.DARKER_COLOR,
  lighten: BlendingMode.LIGHTEN,
  screen: BlendingMode.SCREEN,
  colorDodge: BlendingMode.COLOR_DODGE,
  linearDodge: BlendingMode.LINEAR_DODGE,
  lighterColor: BlendingMode.LIGHTER_COLOR,
  overlay: BlendingMode.OVERLAY,
  softLight: BlendingMode.SOFT_LIGHT,
  hardLight: BlendingMode.HARD_LIGHT,
  vividLight: BlendingMode.VIVID_LIGHT,
  linearLight: BlendingMode.LINEAR_LIGHT,
  pinLight: BlendingMode.PIN_LIGHT,
  hardMix: BlendingMode.HARD_MIX,
  difference: BlendingMode.DIFFERENCE,
  exclusion: BlendingMode.EXCLUSION,
  subtract: BlendingMode.SUBTRACT,
  divide: BlendingMode.DIVIDE,
  hue: BlendingMode.HUE,
  saturation: BlendingMode.SATURATION,
  color: BlendingMode.COLOR,
  luminosity: BlendingMode.LUMINOSITY,
};

/**
 * Mapping of YAML quality mode names to AE LayerQuality enum values.
 */
var qualityModes: { [key: string]: LayerQuality } = {
  best: LayerQuality.BEST,
  draft: LayerQuality.DRAFT,
  wireframe: LayerQuality.WIREFRAME,
};

/**
 * Mapping of YAML sampling quality names to AE LayerSamplingQuality enum values.
 */
var samplingQualities: { [key: string]: LayerSamplingQuality } = {
  bicubic: LayerSamplingQuality.BICUBIC,
  bilinear: LayerSamplingQuality.BILINEAR,
};

/**
 * Mapping of YAML auto-orient names to AE AutoOrientType enum values.
 */
var autoOrientTypes: { [key: string]: AutoOrientType } = {
  off: AutoOrientType.NO_AUTO_ORIENT,
  alongPath: AutoOrientType.ALONG_PATH,
  cameraOrPointOfInterest: AutoOrientType.CAMERA_OR_POINT_OF_INTEREST,
};

/**
 * Mapping of YAML frame blending type names to AE FrameBlendingType enum values.
 */
var frameBlendingTypes: { [key: string]: FrameBlendingType } = {
  none: FrameBlendingType.NO_FRAME_BLEND,
  frameMix: FrameBlendingType.FRAME_MIX,
  pixelMotion: FrameBlendingType.PIXEL_MOTION,
};

/**
 * Mapping of YAML track matte type names to AE TrackMatteType enum values.
 */
var trackMatteTypes: { [key: string]: TrackMatteType } = {
  none: TrackMatteType.NO_TRACK_MATTE,
  alpha: TrackMatteType.ALPHA,
  alphaInverted: TrackMatteType.ALPHA_INVERTED,
  luma: TrackMatteType.LUMA,
  lumaInverted: TrackMatteType.LUMA_INVERTED,
};

interface KeyframeDef {
  time: number;
  value: number | [number, number];
}

interface TransformDef {
  anchorPoint?: [number, number] | KeyframeDef[];
  position?: [number, number] | KeyframeDef[];
  scale?: [number, number] | KeyframeDef[];
  rotation?: number | KeyframeDef[];
  opacity?: number | KeyframeDef[];
}

interface EffectKeyframeDef {
  time: number;
  value: number | boolean | number[];
}

interface EffectDef {
  name: string;
  matchName?: string;
  enabled?: boolean;
  properties?: { [key: string]: number | boolean | number[] | EffectKeyframeDef[] };
}

interface LayerDef {
  name: string;
  type?: string;
  file?: string | number;
  comp?: string;
  inPoint?: number;
  outPoint?: number;
  startTime?: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  fontSize?: number;
  font?: string;
  enabled?: boolean;
  shy?: boolean;
  locked?: boolean;
  threeDLayer?: boolean;
  parent?: string;
  blendingMode?: string;
  // Additional boolean flags
  solo?: boolean;
  audioEnabled?: boolean;
  motionBlur?: boolean;
  collapseTransformation?: boolean;
  guideLayer?: boolean;
  effectsActive?: boolean;
  timeRemapEnabled?: boolean;
  // Quality and rendering enums
  quality?: string;
  samplingQuality?: string;
  autoOrient?: string;
  frameBlendingType?: string;
  trackMatteType?: string;
  // Numeric properties
  label?: number;
  transform?: TransformDef;
  effects?: EffectDef[];
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
 * Apply keyframes to a property.
 */
function applyKeyframes(prop: Property, keyframes: KeyframeDef[]): void {
  for (var k = 0; k < keyframes.length; k++) {
    prop.setValueAtTime(keyframes[k].time, keyframes[k].value);
  }
}

/**
 * Check if an effect property value is a keyframe array.
 */
function isEffectKeyframeArray(val: any): val is EffectKeyframeDef[] {
  if (!(val instanceof Array) || val.length === 0) return false;
  return typeof val[0] === "object" && val[0] !== null && "time" in val[0];
}

/**
 * Convert a single boolean to 1/0 for AE effect properties.
 */
function boolToInt(v: any): any {
  if (v === true) return 1;
  if (v === false) return 0;
  return v;
}

/**
 * Convert booleans to 1/0 for AE effect properties (scalar or array).
 */
function boolToNum(val: any): any {
  if (val === true) return 1;
  if (val === false) return 0;
  if (val instanceof Array) {
    var result: any[] = [];
    for (var i = 0; i < val.length; i++) {
      result.push(boolToInt(val[i]));
    }
    return result;
  }
  return val;
}

/**
 * Apply effects to a layer.
 */
function applyEffects(layer: Layer, effects: EffectDef[]): void {
  var effectsGroup = layer.property("ADBE Effect Parade") as PropertyGroup;

  for (var i = 0; i < effects.length; i++) {
    var eDef = effects[i];
    var addName = eDef.matchName || eDef.name;
    var effect = effectsGroup.addProperty(addName) as PropertyGroup;

    // Rename to display name if matchName was used
    if (eDef.matchName && eDef.name) {
      effect.name = eDef.name;
    }

    // Disable effect if requested
    if (eDef.enabled === false) {
      effect.enabled = false;
    }

    if (eDef.properties) {
      for (var propName in eDef.properties) {
        if (!eDef.properties.hasOwnProperty(propName)) continue;
        var propVal = eDef.properties[propName];
        try {
          var prop = effect.property(propName) as Property;
          if (!prop) continue;

          if (isEffectKeyframeArray(propVal)) {
            for (var k = 0; k < propVal.length; k++) {
              prop.setValueAtTime(propVal[k].time, boolToNum(propVal[k].value));
            }
          } else {
            //@ts-ignore
            prop.setValue(boolToNum(propVal));
          }
        } catch (e) {
          // Some properties may not be settable; skip silently
        }
      }
    }
  }
}

/**
 * Apply transform properties to a layer.
 */
function applyTransform(layer: Layer, transform: TransformDef): void {
  var group = layer.property("ADBE Transform Group");

  if (transform.anchorPoint) {
    var ap = group.property("ADBE Anchor Point") as Property;
    if (isKeyframeArray(transform.anchorPoint)) {
      applyKeyframes(ap, transform.anchorPoint);
    } else {
      //@ts-ignore
      ap.setValue(transform.anchorPoint);
    }
  }
  if (transform.position) {
    var pos = group.property("ADBE Position") as Property;
    if (isKeyframeArray(transform.position)) {
      applyKeyframes(pos, transform.position);
    } else {
      //@ts-ignore
      pos.setValue(transform.position);
    }
  }
  if (transform.scale) {
    var sc = group.property("ADBE Scale") as Property;
    if (isKeyframeArray(transform.scale)) {
      applyKeyframes(sc, transform.scale);
    } else {
      //@ts-ignore
      sc.setValue(transform.scale);
    }
  }
  if (transform.rotation !== undefined) {
    var rot = group.property("ADBE Rotate Z") as Property;
    if (isKeyframeArray(transform.rotation)) {
      applyKeyframes(rot, transform.rotation);
    } else {
      //@ts-ignore
      rot.setValue(transform.rotation);
    }
  }
  if (transform.opacity !== undefined) {
    var op = group.property("ADBE Opacity") as Property;
    if (isKeyframeArray(transform.opacity)) {
      applyKeyframes(op, transform.opacity);
    } else {
      //@ts-ignore
      op.setValue(transform.opacity);
    }
  }
}

/**
 * Create layers in a composition.
 */
export const createLayers = (
  comp: CompItem,
  layers: LayerDef[],
  fileMap: { [id: string]: FootageItem },
  compMap: { [name: string]: CompItem }
): void => {
  // Build a name -> layer map for parenting
  var layerNameMap: { [name: string]: Layer } = {};

  for (var i = 0; i < layers.length; i++) {
    var layerDef = layers[i];
    var newLayer: Layer;

    if (layerDef.comp !== undefined) {
      // Comp-in-comp layer
      var refComp = compMap[layerDef.comp];
      if (!refComp) {
        throw new Error("Comp with name '" + layerDef.comp + "' not found");
      }
      newLayer = comp.layers.add(refComp);
    } else if (layerDef.file !== undefined) {
      // File-based layer
      var fileId = String(layerDef.file);
      var footage = fileMap[fileId];
      if (!footage) {
        // Check if it references a comp
        if (compMap[fileId]) {
          newLayer = comp.layers.add(compMap[fileId]);
        } else {
          throw new Error("File or comp with id '" + fileId + "' not found");
        }
      } else {
        newLayer = comp.layers.add(footage);
      }
    } else {
      switch (layerDef.type) {
        case "solid": {
          var r = 0,
            g = 0,
            b = 0;
          if (layerDef.color) {
            r = parseInt(layerDef.color.substring(0, 2), 16) / 255;
            g = parseInt(layerDef.color.substring(2, 4), 16) / 255;
            b = parseInt(layerDef.color.substring(4, 6), 16) / 255;
          }
          newLayer = comp.layers.addSolid(
            [r, g, b],
            layerDef.name,
            layerDef.width || comp.width,
            layerDef.height || comp.height,
            1
          );
          break;
        }
        case "null": {
          newLayer = comp.layers.addNull();
          break;
        }
        case "adjustment": {
          newLayer = comp.layers.addSolid(
            [0, 0, 0],
            layerDef.name,
            comp.width,
            comp.height,
            1
          );
          newLayer.adjustmentLayer = true;
          break;
        }
        case "text": {
          newLayer = comp.layers.addText(layerDef.text || "");
          if (layerDef.fontSize || layerDef.font) {
            var textProp = newLayer
              .property("ADBE Text Properties")
              .property("ADBE Text Document") as Property;
            var textDoc = textProp.value as TextDocument;
            if (layerDef.fontSize) textDoc.fontSize = layerDef.fontSize;
            if (layerDef.font) textDoc.font = layerDef.font;
            textProp.setValue(textDoc);
          }
          break;
        }
        default:
          throw new Error("Unknown layer type: " + layerDef.type);
      }
    }

    // Set layer name
    newLayer.name = layerDef.name;

    // Timing
    if (layerDef.startTime !== undefined) newLayer.startTime = layerDef.startTime;
    if (layerDef.inPoint !== undefined) newLayer.inPoint = layerDef.inPoint;
    if (layerDef.outPoint !== undefined) newLayer.outPoint = layerDef.outPoint;

    // Layer flags
    if (layerDef.enabled !== undefined) newLayer.enabled = layerDef.enabled;
    if (layerDef.shy !== undefined) newLayer.shy = layerDef.shy;
    if (layerDef.threeDLayer !== undefined) newLayer.threeDLayer = layerDef.threeDLayer;

    // Additional boolean flags
    if (layerDef.solo !== undefined) newLayer.solo = layerDef.solo;
    if (layerDef.audioEnabled !== undefined) newLayer.audioEnabled = layerDef.audioEnabled;
    if (layerDef.motionBlur !== undefined) newLayer.motionBlurEnabled = layerDef.motionBlur;
    if (layerDef.collapseTransformation !== undefined)
      newLayer.collapseTransformation = layerDef.collapseTransformation;
    if (layerDef.guideLayer !== undefined) newLayer.guideLayer = layerDef.guideLayer;
    if (layerDef.effectsActive !== undefined) newLayer.effectsActive = layerDef.effectsActive;
    if (layerDef.timeRemapEnabled !== undefined)
      newLayer.timeRemapEnabled = layerDef.timeRemapEnabled;

    // Blending mode
    if (layerDef.blendingMode && blendingModes[layerDef.blendingMode]) {
      newLayer.blendingMode = blendingModes[layerDef.blendingMode];
    }

    // Quality and rendering enums
    if (layerDef.quality && qualityModes[layerDef.quality]) {
      newLayer.quality = qualityModes[layerDef.quality];
    }
    if (layerDef.samplingQuality && samplingQualities[layerDef.samplingQuality]) {
      newLayer.samplingQuality = samplingQualities[layerDef.samplingQuality];
    }
    if (layerDef.autoOrient && autoOrientTypes[layerDef.autoOrient]) {
      newLayer.autoOrient = autoOrientTypes[layerDef.autoOrient];
    }
    if (layerDef.frameBlendingType && frameBlendingTypes[layerDef.frameBlendingType]) {
      newLayer.frameBlendingType = frameBlendingTypes[layerDef.frameBlendingType];
    }
    if (layerDef.trackMatteType && trackMatteTypes[layerDef.trackMatteType]) {
      newLayer.trackMatteType = trackMatteTypes[layerDef.trackMatteType];
    }

    // Numeric properties
    if (layerDef.label !== undefined) newLayer.label = layerDef.label;

    // Transform
    if (layerDef.transform) {
      applyTransform(newLayer, layerDef.transform);
    }

    // Effects
    if (layerDef.effects && layerDef.effects.length > 0) {
      applyEffects(newLayer, layerDef.effects);
    }

    layerNameMap[layerDef.name] = newLayer;
  }

  // Second pass: set parenting (must happen after all layers exist)
  for (var j = 0; j < layers.length; j++) {
    if (layers[j].parent && layerNameMap[layers[j].parent!]) {
      layerNameMap[layers[j].name].parent = layerNameMap[layers[j].parent!];
    }
  }

  // Third pass: lock layers (must happen last, locked layers can't be modified)
  for (var k = 0; k < layers.length; k++) {
    if (layers[k].locked) {
      layerNameMap[layers[k].name].locked = true;
    }
  }
};
