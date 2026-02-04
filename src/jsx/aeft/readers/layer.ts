import { forEachLayer } from "../aeft-utils";

/**
 * Reverse-map AE BlendingMode enum to YAML string name.
 */
var blendingModeNames: { [key: number]: string } = {};
blendingModeNames[BlendingMode.NORMAL] = "normal";
blendingModeNames[BlendingMode.DISSOLVE] = "dissolve";
blendingModeNames[BlendingMode.DARKEN] = "darken";
blendingModeNames[BlendingMode.MULTIPLY] = "multiply";
blendingModeNames[BlendingMode.COLOR_BURN] = "colorBurn";
blendingModeNames[BlendingMode.LINEAR_BURN] = "linearBurn";
blendingModeNames[BlendingMode.DARKER_COLOR] = "darkerColor";
blendingModeNames[BlendingMode.LIGHTEN] = "lighten";
blendingModeNames[BlendingMode.SCREEN] = "screen";
blendingModeNames[BlendingMode.COLOR_DODGE] = "colorDodge";
blendingModeNames[BlendingMode.LINEAR_DODGE] = "linearDodge";
blendingModeNames[BlendingMode.LIGHTER_COLOR] = "lighterColor";
blendingModeNames[BlendingMode.OVERLAY] = "overlay";
blendingModeNames[BlendingMode.SOFT_LIGHT] = "softLight";
blendingModeNames[BlendingMode.HARD_LIGHT] = "hardLight";
blendingModeNames[BlendingMode.VIVID_LIGHT] = "vividLight";
blendingModeNames[BlendingMode.LINEAR_LIGHT] = "linearLight";
blendingModeNames[BlendingMode.PIN_LIGHT] = "pinLight";
blendingModeNames[BlendingMode.HARD_MIX] = "hardMix";
blendingModeNames[BlendingMode.DIFFERENCE] = "difference";
blendingModeNames[BlendingMode.EXCLUSION] = "exclusion";
blendingModeNames[BlendingMode.SUBTRACT] = "subtract";
blendingModeNames[BlendingMode.DIVIDE] = "divide";
blendingModeNames[BlendingMode.HUE] = "hue";
blendingModeNames[BlendingMode.SATURATION] = "saturation";
blendingModeNames[BlendingMode.COLOR] = "color";
blendingModeNames[BlendingMode.LUMINOSITY] = "luminosity";

/**
 * Reverse-map AE LayerQuality enum to YAML string name.
 */
var qualityNames: { [key: number]: string } = {};
qualityNames[LayerQuality.BEST] = "best";
qualityNames[LayerQuality.DRAFT] = "draft";
qualityNames[LayerQuality.WIREFRAME] = "wireframe";

/**
 * Reverse-map AE LayerSamplingQuality enum to YAML string name.
 */
var samplingQualityNames: { [key: number]: string } = {};
samplingQualityNames[LayerSamplingQuality.BICUBIC] = "bicubic";
samplingQualityNames[LayerSamplingQuality.BILINEAR] = "bilinear";

/**
 * Reverse-map AE AutoOrientType enum to YAML string name.
 */
var autoOrientNames: { [key: number]: string } = {};
autoOrientNames[AutoOrientType.NO_AUTO_ORIENT] = "off";
autoOrientNames[AutoOrientType.ALONG_PATH] = "alongPath";
autoOrientNames[AutoOrientType.CAMERA_OR_POINT_OF_INTEREST] = "cameraOrPointOfInterest";

/**
 * Reverse-map AE FrameBlendingType enum to YAML string name.
 */
var frameBlendingTypeNames: { [key: number]: string } = {};
frameBlendingTypeNames[FrameBlendingType.NO_FRAME_BLEND] = "none";
frameBlendingTypeNames[FrameBlendingType.FRAME_MIX] = "frameMix";
frameBlendingTypeNames[FrameBlendingType.PIXEL_MOTION] = "pixelMotion";

/**
 * Reverse-map AE TrackMatteType enum to YAML string name.
 */
var trackMatteTypeNames: { [key: number]: string } = {};
trackMatteTypeNames[TrackMatteType.NO_TRACK_MATTE] = "none";
trackMatteTypeNames[TrackMatteType.ALPHA] = "alpha";
trackMatteTypeNames[TrackMatteType.ALPHA_INVERTED] = "alphaInverted";
trackMatteTypeNames[TrackMatteType.LUMA] = "luma";
trackMatteTypeNames[TrackMatteType.LUMA_INVERTED] = "lumaInverted";

/**
 * Reverse-map AE ParagraphJustification enum to YAML string name.
 */
var justificationNames: { [key: number]: string } = {};
justificationNames[ParagraphJustification.LEFT_JUSTIFY] = "left";
justificationNames[ParagraphJustification.CENTER_JUSTIFY] = "center";
justificationNames[ParagraphJustification.RIGHT_JUSTIFY] = "right";

function toHex(n: number): string {
  var hex = Math.round(n * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

/**
 * Determine the easing type from a keyframe's interpolation settings.
 * Returns undefined for linear (default), or the easing name.
 */
function getEasingType(prop: Property, keyIndex: number): string | undefined {
  var inType = prop.keyInInterpolationType(keyIndex);
  var outType = prop.keyOutInterpolationType(keyIndex);

  // Hold interpolation
  if (outType === KeyframeInterpolationType.HOLD) {
    return "hold";
  }

  // Linear interpolation (explicit)
  if (inType === KeyframeInterpolationType.LINEAR && outType === KeyframeInterpolationType.LINEAR) {
    return undefined; // default, don't export
  }

  // Bezier - check temporal ease to determine ease type
  if (inType === KeyframeInterpolationType.BEZIER || outType === KeyframeInterpolationType.BEZIER) {
    var inEase = prop.keyInTemporalEase(keyIndex);
    var outEase = prop.keyOutTemporalEase(keyIndex);

    // Check influence values (first dimension is representative)
    var inInfluence = inEase[0].influence;
    var outInfluence = outEase[0].influence;

    // Threshold for considering ease "significant"
    var threshold = 10;

    var hasEaseIn = inInfluence > threshold;
    var hasEaseOut = outInfluence > threshold;

    if (hasEaseIn && hasEaseOut) {
      return "easeInOut";
    } else if (hasEaseIn) {
      return "easeIn";
    } else if (hasEaseOut) {
      return "easeOut";
    }
  }

  return undefined; // linear/default
}

/**
 * Read keyframes from a property, returning an array of {time, value, easing?} objects.
 */
function readKeyframes(prop: Property): object[] {
  var keyframes: object[] = [];
  for (var i = 1; i <= prop.numKeys; i++) {
    var val = prop.keyValue(i);
    var time = Math.round(prop.keyTime(i) * 1000) / 1000;
    var easing = getEasingType(prop, i);

    var kf: { [key: string]: any } = { time: time };

    if (val instanceof Array) {
      kf.value = [Math.round(val[0]), Math.round(val[1])];
    } else {
      kf.value = Math.round(val as number);
    }

    if (easing) {
      kf.easing = easing;
    }

    keyframes.push(kf);
  }
  return keyframes;
}

/**
 * Read keyframes from an effect property, preserving fractional precision
 * (rounded to 3 decimal places).
 */
function readEffectKeyframes(prop: Property): object[] {
  var keyframes: object[] = [];
  for (var i = 1; i <= prop.numKeys; i++) {
    var val = prop.keyValue(i);
    var time = Math.round(prop.keyTime(i) * 1000) / 1000;
    var easing = getEasingType(prop, i);

    var kf: { [key: string]: any } = { time: time };

    if (val instanceof Array) {
      var arr: number[] = [];
      for (var j = 0; j < val.length; j++) {
        arr.push(Math.round(val[j] * 1000) / 1000);
      }
      kf.value = arr;
    } else {
      kf.value = Math.round((val as number) * 1000) / 1000;
    }

    if (easing) {
      kf.easing = easing;
    }

    keyframes.push(kf);
  }
  return keyframes;
}

/**
 * Read effects from a layer.
 */
function readEffects(layer: Layer): object[] | null {
  var effectsGroup: PropertyGroup;
  try {
    effectsGroup = layer.property("ADBE Effect Parade") as PropertyGroup;
  } catch (e) {
    return null;
  }
  if (!effectsGroup || effectsGroup.numProperties === 0) return null;

  var effects: object[] = [];
  for (var i = 1; i <= effectsGroup.numProperties; i++) {
    var effect = effectsGroup.property(i) as PropertyGroup;
    var effectObj: { [key: string]: any } = {};
    effectObj.name = effect.name;
    effectObj.matchName = effect.matchName;

    if (!effect.enabled) {
      effectObj.enabled = false;
    }

    var properties: { [key: string]: any } = {};
    var hasProperties = false;

    for (var j = 1; j <= effect.numProperties; j++) {
      try {
        var prop = effect.property(j) as Property;
        if (prop.propertyType !== PropertyType.PROPERTY) continue;

        var propName = prop.name;
        if (prop.numKeys > 0) {
          properties[propName] = readEffectKeyframes(prop);
          hasProperties = true;
        } else {
          var val = prop.value;
          if (val !== undefined && val !== null) {
            if (val instanceof Array) {
              var arr: number[] = [];
              for (var k = 0; k < val.length; k++) {
                arr.push(Math.round(val[k] * 1000) / 1000);
              }
              properties[propName] = arr;
            } else {
              properties[propName] = Math.round((val as number) * 1000) / 1000;
            }
            hasProperties = true;
          }
        }
      } catch (e) {
        // Some properties may not be readable; skip
      }
    }

    if (hasProperties) {
      effectObj.properties = properties;
    }

    // Read expressions from effect properties
    var exprObj: { [key: string]: string } = {};
    var hasExpr = false;
    for (var je = 1; je <= effect.numProperties; je++) {
      try {
        var exprProp = effect.property(je) as Property;
        if (exprProp.propertyType !== PropertyType.PROPERTY) continue;
        if (exprProp.expression && exprProp.expression.length > 0) {
          exprObj[exprProp.name] = exprProp.expression;
          hasExpr = true;
        }
      } catch (e) {
        // Skip unreadable properties
      }
    }
    if (hasExpr) {
      effectObj.expressions = exprObj;
    }

    effects.push(effectObj);
  }

  return effects.length > 0 ? effects : null;
}

function readTransform(layer: Layer): object | null {
  var transform: { [key: string]: any } = {};
  var hasValues = false;

  var group = layer.property("ADBE Transform Group");

  var anchor = group.property("ADBE Anchor Point") as Property;
  if (anchor) {
    if (anchor.numKeys > 0) {
      transform.anchorPoint = readKeyframes(anchor);
      hasValues = true;
    } else {
      var anchorVal = anchor.value as number[];
      // Only include if not default [0, 0]
      if (anchorVal[0] !== 0 || anchorVal[1] !== 0) {
        transform.anchorPoint = [Math.round(anchorVal[0]), Math.round(anchorVal[1])];
        hasValues = true;
      }
    }
  }

  var pos = group.property("ADBE Position") as Property;
  if (pos) {
    // Check if dimensions are separated
    if (pos.dimensionsSeparated) {
      var posX = group.property("ADBE Position_0") as Property;
      var posY = group.property("ADBE Position_1") as Property;

      if (posX && posX.numKeys > 0) {
        transform.positionX = readKeyframes(posX);
        hasValues = true;
      } else if (posX) {
        transform.positionX = Math.round(posX.value as number);
        hasValues = true;
      }

      if (posY && posY.numKeys > 0) {
        transform.positionY = readKeyframes(posY);
        hasValues = true;
      } else if (posY) {
        transform.positionY = Math.round(posY.value as number);
        hasValues = true;
      }
    } else {
      if (pos.numKeys > 0) {
        transform.position = readKeyframes(pos);
        hasValues = true;
      } else {
        var posVal = pos.value as number[];
        transform.position = [Math.round(posVal[0]), Math.round(posVal[1])];
        hasValues = true;
      }
    }
  }

  var scale = group.property("ADBE Scale") as Property;
  if (scale) {
    if (scale.numKeys > 0) {
      transform.scale = readKeyframes(scale);
      hasValues = true;
    } else {
      var scaleVal = scale.value as number[];
      // Only include if not default [100, 100]
      if (scaleVal[0] !== 100 || scaleVal[1] !== 100) {
        transform.scale = [Math.round(scaleVal[0]), Math.round(scaleVal[1])];
        hasValues = true;
      }
    }
  }

  var rotation = group.property("ADBE Rotate Z") as Property;
  if (rotation) {
    if (rotation.numKeys > 0) {
      transform.rotation = readKeyframes(rotation);
      hasValues = true;
    } else if (rotation.value !== 0) {
      transform.rotation = rotation.value;
      hasValues = true;
    }
  }

  var opacity = group.property("ADBE Opacity") as Property;
  if (opacity) {
    if (opacity.numKeys > 0) {
      transform.opacity = readKeyframes(opacity);
      hasValues = true;
    } else if (opacity.value !== 100) {
      transform.opacity = opacity.value;
      hasValues = true;
    }
  }

  // Read expressions
  var expressions: { [key: string]: string } = {};
  var hasExpressions = false;

  var exprProps: { [key: string]: string } = {
    "ADBE Anchor Point": "anchorPoint",
    "ADBE Position": "position",
    "ADBE Position_0": "positionX",
    "ADBE Position_1": "positionY",
    "ADBE Scale": "scale",
    "ADBE Rotate Z": "rotation",
    "ADBE Opacity": "opacity",
  };

  for (var matchName in exprProps) {
    if (!exprProps.hasOwnProperty(matchName)) continue;
    try {
      var exprProp = group.property(matchName) as Property;
      if (exprProp && exprProp.expression && exprProp.expression.length > 0) {
        expressions[exprProps[matchName]] = exprProp.expression;
        hasExpressions = true;
      }
    } catch (e) {
      // Property may not exist; skip
    }
  }

  if (hasExpressions) {
    transform.expressions = expressions;
    hasValues = true;
  }

  return hasValues ? transform : null;
}

/**
 * Read a single layer and return a JSON-serializable object.
 */
export function readLayer(layer: Layer): object {
  var result: { [key: string]: any } = {};
  result.name = layer.name;

  // Determine type
  if (layer instanceof CameraLayer) {
    result.type = "camera";
    var camLayer = layer as CameraLayer;
    var camOptions = camLayer.cameraOption;

    // Camera type (one-node vs two-node based on point of interest)
    // Two-node cameras have a point of interest; one-node don't
    try {
      var poi = layer.property("ADBE Camera Options Group").property("ADBE Camera Point of Interest");
      result.cameraType = poi ? "twoNode" : "oneNode";
    } catch (e) {
      result.cameraType = "twoNode"; // default
    }

    var zoom = camOptions.property("ADBE Camera Zoom") as Property;
    if (zoom) result.zoom = Math.round(zoom.value as number);

    var dof = camOptions.property("ADBE Camera Depth of Field") as Property;
    if (dof && dof.value === 1) result.depthOfField = true;

    var focusDist = camOptions.property("ADBE Camera Focus Distance") as Property;
    if (focusDist) result.focusDistance = Math.round(focusDist.value as number);

    var aperture = camOptions.property("ADBE Camera Aperture") as Property;
    if (aperture) result.aperture = Math.round((aperture.value as number) * 10) / 10;

    var blurLevel = camOptions.property("ADBE Camera Blur Level") as Property;
    if (blurLevel && blurLevel.value !== 100) result.blurLevel = blurLevel.value;
  } else if (layer instanceof LightLayer) {
    result.type = "light";
    var lightLayer = layer as LightLayer;
    var lightOptions = lightLayer.lightOption;

    // Light type
    var lightTypeNames: { [key: number]: string } = {};
    lightTypeNames[LightType.PARALLEL] = "parallel";
    lightTypeNames[LightType.SPOT] = "spot";
    lightTypeNames[LightType.POINT] = "point";
    lightTypeNames[LightType.AMBIENT] = "ambient";
    result.lightType = lightTypeNames[lightLayer.lightType as number] || "point";

    var intensity = lightOptions.property("ADBE Light Intensity") as Property;
    if (intensity && intensity.value !== 100) result.intensity = intensity.value;

    var lightColor = lightOptions.property("ADBE Light Color") as Property;
    if (lightColor) {
      var lc = lightColor.value as number[];
      var lcHex = toHex(lc[0]) + toHex(lc[1]) + toHex(lc[2]);
      if (lcHex !== "ffffff") result.lightColor = lcHex;
    }

    var coneAngle = lightOptions.property("ADBE Light Cone Angle") as Property;
    if (coneAngle && coneAngle.value !== 90) result.coneAngle = coneAngle.value;

    var coneFeather = lightOptions.property("ADBE Light Cone Feather 2") as Property;
    if (coneFeather && coneFeather.value !== 50) result.coneFeather = coneFeather.value;

    var castsShadows = lightOptions.property("ADBE Light Casts Shadows") as Property;
    if (castsShadows && castsShadows.value === 1) result.castsShadows = true;

    var shadowDarkness = lightOptions.property("ADBE Light Shadow Darkness") as Property;
    if (shadowDarkness && shadowDarkness.value !== 100) result.shadowDarkness = shadowDarkness.value;

    var shadowDiffusion = lightOptions.property("ADBE Light Shadow Diffusion") as Property;
    if (shadowDiffusion && shadowDiffusion.value !== 0) result.shadowDiffusion = shadowDiffusion.value;
  } else if (layer instanceof TextLayer) {
    result.type = "text";
    var textProp = layer
      .property("ADBE Text Properties")
      .property("ADBE Text Document") as Property;
    if (textProp) {
      var textDoc = textProp.value as TextDocument;
      result.text = textDoc.text;
      if (textDoc.fontSize) result.fontSize = textDoc.fontSize;
      if (textDoc.font) result.font = textDoc.font;

      // Text styling
      if (textDoc.fillColor) {
        var fc = textDoc.fillColor;
        var fillHex = toHex(fc[0]) + toHex(fc[1]) + toHex(fc[2]);
        // Only export if not white (common default)
        if (fillHex !== "ffffff") {
          result.fillColor = fillHex;
        }
      }
      if (textDoc.applyStroke && textDoc.strokeColor) {
        var sc = textDoc.strokeColor;
        result.strokeColor = toHex(sc[0]) + toHex(sc[1]) + toHex(sc[2]);
      }
      if (textDoc.applyStroke && textDoc.strokeWidth > 0) {
        result.strokeWidth = textDoc.strokeWidth;
      }
      if (textDoc.tracking !== 0) {
        result.tracking = textDoc.tracking;
      }
      if (textDoc.leading) {
        result.leading = textDoc.leading;
      }
      var justName = justificationNames[textDoc.justification as number];
      if (justName && justName !== "left") {
        result.justification = justName;
      }
    }
  } else if (layer.source && layer.source instanceof CompItem) {
    // Layer referencing a comp
    result.comp = layer.source.name;
  } else if (layer.source && layer.source instanceof FootageItem) {
    var source = layer.source as FootageItem;
    if (source.file) {
      result.file = source.file.fsName;
    } else if (source.mainSource instanceof SolidSource) {
      result.type = "solid";
      var solidColor = (source.mainSource as SolidSource).color;
      result.color =
        toHex(solidColor[0]) + toHex(solidColor[1]) + toHex(solidColor[2]);
      result.width = source.width;
      result.height = source.height;
    }
  } else if (layer.nullLayer) {
    result.type = "null";
  }

  if (layer.adjustmentLayer) {
    result.type = "adjustment";
  }

  // Timing
  if (layer.inPoint !== 0) result.inPoint = layer.inPoint;
  if (layer.outPoint !== layer.containingComp.duration) {
    result.outPoint = layer.outPoint;
  }
  if (layer.startTime !== 0) result.startTime = layer.startTime;

  // Flags
  if (!layer.enabled) result.enabled = false;
  if (layer.shy) result.shy = true;
  if (layer.locked) result.locked = true;
  if (layer.threeDLayer) result.threeDLayer = true;

  // Additional boolean flags (only export non-default values)
  if (layer.solo) result.solo = true;
  if (!layer.audioEnabled) result.audioEnabled = false; // default is true
  if (layer.motionBlurEnabled) result.motionBlur = true;
  if (layer.collapseTransformation) result.collapseTransformation = true;
  if (layer.guideLayer) result.guideLayer = true;
  if (!layer.effectsActive) result.effectsActive = false; // default is true
  if (layer.timeRemapEnabled) result.timeRemapEnabled = true;

  // Quality and rendering enums (only export non-default values)
  var qualityName = qualityNames[layer.quality as number];
  if (qualityName && qualityName !== "best") {
    result.quality = qualityName;
  }
  var samplingQualityName = samplingQualityNames[layer.samplingQuality as number];
  if (samplingQualityName && samplingQualityName !== "bilinear") {
    result.samplingQuality = samplingQualityName;
  }
  var autoOrientName = autoOrientNames[layer.autoOrient as number];
  if (autoOrientName && autoOrientName !== "off") {
    result.autoOrient = autoOrientName;
  }
  var frameBlendingTypeName = frameBlendingTypeNames[layer.frameBlendingType as number];
  if (frameBlendingTypeName && frameBlendingTypeName !== "none") {
    result.frameBlendingType = frameBlendingTypeName;
  }
  var trackMatteTypeName = trackMatteTypeNames[layer.trackMatteType as number];
  if (trackMatteTypeName && trackMatteTypeName !== "none") {
    result.trackMatteType = trackMatteTypeName;
  }

  // Label (only export non-default value)
  if (layer.label !== 0) result.label = layer.label;

  // Blending mode
  var modeName = blendingModeNames[layer.blendingMode as number];
  if (modeName && modeName !== "normal") {
    result.blendingMode = modeName;
  }

  // Parent
  if (layer.parent) {
    result.parent = layer.parent.name;
  }

  // Transform
  var transform = readTransform(layer);
  if (transform) {
    result.transform = transform;
  }

  // Effects
  var effects = readEffects(layer);
  if (effects) {
    result.effects = effects;
  }

  return result;
}

/**
 * Read selected layers from the active comp.
 */
export function readSelectedLayers(comp: CompItem): object[] {
  var results: object[] = [];
  var selected = comp.selectedLayers;
  for (var i = 0; i < selected.length; i++) {
    results.push(readLayer(selected[i]));
  }
  return results;
}

/**
 * Read all layers from a comp.
 */
export function readAllLayers(comp: CompItem): object[] {
  var results: object[] = [];
  forEachLayer(comp, function (layer) {
    results.push(readLayer(layer));
  });
  return results;
}
