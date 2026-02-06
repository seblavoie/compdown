import { applyShapes } from "./shapes";

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
  easing?: string;
}

interface TransformExpressionsDef {
  anchorPoint?: string;
  position?: string;
  positionX?: string;
  positionY?: string;
  positionZ?: string;
  scale?: string;
  rotation?: string;
  rotationX?: string;
  rotationY?: string;
  opacity?: string;
}

interface TransformDef {
  anchorPoint?: [number, number] | KeyframeDef[];
  position?: [number, number] | KeyframeDef[];
  positionX?: number | KeyframeDef[];
  positionY?: number | KeyframeDef[];
  positionZ?: number | KeyframeDef[];
  scale?: [number, number] | KeyframeDef[];
  rotation?: number | KeyframeDef[];
  rotationX?: number | KeyframeDef[];
  rotationY?: number | KeyframeDef[];
  opacity?: number | KeyframeDef[];
  expressions?: TransformExpressionsDef;
}

interface EffectKeyframeDef {
  time: number;
  value: number | boolean | number[];
  easing?: string;
}

interface EffectDef {
  name: string;
  matchName?: string;
  enabled?: boolean;
  properties?: { [key: string]: number | boolean | number[] | EffectKeyframeDef[] };
  expressions?: { [key: string]: string };
}

interface LayerStyleDef {
  type: string;
  enabled?: boolean;
  properties?: { [key: string]: number | boolean | number[] | EffectKeyframeDef[] };
  expressions?: { [key: string]: string };
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
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  tracking?: number;
  leading?: number;
  justification?: string;
  // Camera-specific
  cameraType?: string;
  zoom?: number;
  depthOfField?: boolean;
  focusDistance?: number;
  aperture?: number;
  blurLevel?: number;
  // Light-specific
  lightType?: string;
  intensity?: number;
  lightColor?: string;
  coneAngle?: number;
  coneFeather?: number;
  castsShadows?: boolean;
  shadowDarkness?: number;
  shadowDiffusion?: number;
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
  // Layer styles
  layerStyles?: LayerStyleDef[];
  // Shape-specific
  shapes?: any[];
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
  // Use the keyframe value to figure out the dimension count
  var keyVal = prop.keyValue(keyIndex);
  var dimensions = 1;
  if (keyVal instanceof Array) {
    dimensions = keyVal.length;
  }

  // Create ease objects for each dimension
  // Influence of 33% gives a natural ease curve
  var easeInfluence = 33.33;
  var linearEase: KeyframeEase[] = [];
  var easedEase: KeyframeEase[] = [];

  for (var d = 0; d < dimensions; d++) {
    linearEase.push(new KeyframeEase(0, 0.1)); // ~linear: minimal influence
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
    // Slow down arriving at this keyframe (incoming ease)
    prop.setTemporalEaseAtKey(keyIndex, easedEase, linearEase);
  } else if (easing === "easeOut") {
    // Slow down leaving this keyframe (outgoing ease)
    prop.setTemporalEaseAtKey(keyIndex, linearEase, easedEase);
  } else if (easing === "easeInOut") {
    // Slow both incoming and outgoing
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
            // First pass: set values
            for (var k = 0; k < propVal.length; k++) {
              prop.setValueAtTime(propVal[k].time, boolToNum(propVal[k].value));
            }
            // Second pass: apply easing
            for (var k = 0; k < propVal.length; k++) {
              if (propVal[k].easing) {
                applyEasing(prop, k + 1, propVal[k].easing);
              }
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

    // Apply expressions to effect properties
    if (eDef.expressions) {
      for (var exprPropName in eDef.expressions) {
        if (!eDef.expressions.hasOwnProperty(exprPropName)) continue;
        try {
          var exprProp = effect.property(exprPropName) as Property;
          if (exprProp && exprProp.canSetExpression) {
            exprProp.expression = eDef.expressions[exprPropName];
          }
        } catch (e) {
          // Some properties may not support expressions; skip silently
        }
      }
    }
  }
}

/**
 * Command IDs for adding layer styles via app.executeCommand.
 * Layer styles cannot be added via addProperty() - must use executeCommand.
 */
var styleCommandIds: { [key: string]: number } = {
  dropShadow: 9000,
  innerShadow: 9001,
  outerGlow: 9002,
  innerGlow: 9003,
  bevelEmboss: 9004,
  satin: 9005,
  colorOverlay: 9006,
  gradientOverlay: 9007,
  stroke: 9008,
};

/**
 * Match names for accessing layer style property groups after they are added.
 */
var styleMatchNames: { [key: string]: string } = {
  dropShadow: "dropShadow/enabled",
  innerShadow: "innerShadow/enabled",
  outerGlow: "outerGlow/enabled",
  innerGlow: "innerGlow/enabled",
  bevelEmboss: "bevelEmboss/enabled",
  satin: "chromeFX/enabled",
  colorOverlay: "solidFill/enabled",
  gradientOverlay: "gradientFill/enabled",
  stroke: "frameFX/enabled",
};

/**
 * Apply layer styles to a layer.
 * Uses app.executeCommand because layer styles cannot be added via addProperty.
 */
function applyLayerStyles(layer: Layer, styles: LayerStyleDef[], comp: CompItem): void {
  // Save current selection (executeCommand operates on selected layer)
  var savedSelection: Layer[] = [];
  for (var i = 1; i <= comp.numLayers; i++) {
    if (comp.layer(i).selected) savedSelection.push(comp.layer(i));
    comp.layer(i).selected = false;
  }
  layer.selected = true;

  for (var s = 0; s < styles.length; s++) {
    var styleDef = styles[s];
    var commandId = styleCommandIds[styleDef.type];
    if (!commandId) continue;

    // Add style via executeCommand
    app.executeCommand(commandId);

    // Access the style property group
    var stylesGroup: PropertyGroup;
    try {
      stylesGroup = layer.property("ADBE Layer Styles") as PropertyGroup;
    } catch (e) {
      continue;
    }
    if (!stylesGroup) continue;

    var matchName = styleMatchNames[styleDef.type];
    var styleGroup: PropertyGroup;
    try {
      styleGroup = stylesGroup.property(matchName) as PropertyGroup;
    } catch (e) {
      continue;
    }
    if (!styleGroup) continue;

    // Set enabled state
    if (styleDef.enabled === false) {
      styleGroup.enabled = false;
    }

    // Apply properties (same pattern as effects)
    if (styleDef.properties) {
      for (var propName in styleDef.properties) {
        if (!styleDef.properties.hasOwnProperty(propName)) continue;
        var propVal = styleDef.properties[propName];
        try {
          var prop = styleGroup.property(propName) as Property;
          if (!prop) continue;

          if (isEffectKeyframeArray(propVal)) {
            // First pass: set values
            for (var k = 0; k < propVal.length; k++) {
              prop.setValueAtTime(propVal[k].time, boolToNum(propVal[k].value));
            }
            // Second pass: apply easing
            for (var k = 0; k < propVal.length; k++) {
              if (propVal[k].easing) {
                applyEasing(prop, k + 1, propVal[k].easing);
              }
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

    // Apply expressions
    if (styleDef.expressions) {
      for (var exprPropName in styleDef.expressions) {
        if (!styleDef.expressions.hasOwnProperty(exprPropName)) continue;
        try {
          var exprProp = styleGroup.property(exprPropName) as Property;
          if (exprProp && exprProp.canSetExpression) {
            exprProp.expression = styleDef.expressions[exprPropName];
          }
        } catch (e) {
          // Some properties may not support expressions; skip silently
        }
      }
    }
  }

  // Restore selection
  layer.selected = false;
  for (var j = 0; j < savedSelection.length; j++) {
    savedSelection[j].selected = true;
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
  // Handle separate position dimensions
  if (transform.positionX !== undefined || transform.positionY !== undefined || transform.positionZ !== undefined) {
    var posProp = group.property("ADBE Position") as Property;
    posProp.dimensionsSeparated = true;

    if (transform.positionX !== undefined) {
      var posX = group.property("ADBE Position_0") as Property;
      if (isKeyframeArray(transform.positionX)) {
        applyKeyframes(posX, transform.positionX);
      } else {
        //@ts-ignore
        posX.setValue(transform.positionX);
      }
    }
    if (transform.positionY !== undefined) {
      var posY = group.property("ADBE Position_1") as Property;
      if (isKeyframeArray(transform.positionY)) {
        applyKeyframes(posY, transform.positionY);
      } else {
        //@ts-ignore
        posY.setValue(transform.positionY);
      }
    }
    if (transform.positionZ !== undefined) {
      // positionZ requires 3D layer and separated dimensions
      layer.threeDLayer = true;
      var posZ = group.property("ADBE Position_2") as Property;
      if (isKeyframeArray(transform.positionZ)) {
        applyKeyframes(posZ, transform.positionZ);
      } else {
        //@ts-ignore
        posZ.setValue(transform.positionZ);
      }
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
  // Handle 3D rotation properties
  if (transform.rotationX !== undefined) {
    layer.threeDLayer = true;
    var rotX = group.property("ADBE Rotate X") as Property;
    if (isKeyframeArray(transform.rotationX)) {
      applyKeyframes(rotX, transform.rotationX);
    } else {
      //@ts-ignore
      rotX.setValue(transform.rotationX);
    }
  }
  if (transform.rotationY !== undefined) {
    layer.threeDLayer = true;
    var rotY = group.property("ADBE Rotate Y") as Property;
    if (isKeyframeArray(transform.rotationY)) {
      applyKeyframes(rotY, transform.rotationY);
    } else {
      //@ts-ignore
      rotY.setValue(transform.rotationY);
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

  // Apply expressions
  if (transform.expressions) {
    var exprMap: { [key: string]: string } = {
      anchorPoint: "ADBE Anchor Point",
      position: "ADBE Position",
      positionX: "ADBE Position_0",
      positionY: "ADBE Position_1",
      positionZ: "ADBE Position_2",
      scale: "ADBE Scale",
      rotation: "ADBE Rotate Z",
      rotationX: "ADBE Rotate X",
      rotationY: "ADBE Rotate Y",
      opacity: "ADBE Opacity",
    };

    for (var propName in transform.expressions) {
      if (!transform.expressions.hasOwnProperty(propName)) continue;
      var matchName = exprMap[propName];
      if (matchName) {
        var prop = group.property(matchName) as Property;
        if (prop && prop.canSetExpression) {
          prop.expression = transform.expressions[propName];
        }
      }
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
          var hasTextStyles =
            layerDef.fontSize ||
            layerDef.font ||
            layerDef.fillColor ||
            layerDef.strokeColor ||
            layerDef.strokeWidth !== undefined ||
            layerDef.tracking !== undefined ||
            layerDef.leading ||
            layerDef.justification;
          if (hasTextStyles) {
            var textProp = newLayer
              .property("ADBE Text Properties")
              .property("ADBE Text Document") as Property;
            var textDoc = textProp.value as TextDocument;
            if (layerDef.fontSize) textDoc.fontSize = layerDef.fontSize;
            if (layerDef.font) textDoc.font = layerDef.font;
            if (layerDef.fillColor) {
              var fr = parseInt(layerDef.fillColor.substring(0, 2), 16) / 255;
              var fg = parseInt(layerDef.fillColor.substring(2, 4), 16) / 255;
              var fb = parseInt(layerDef.fillColor.substring(4, 6), 16) / 255;
              textDoc.fillColor = [fr, fg, fb];
            }
            if (layerDef.strokeColor) {
              var sr = parseInt(layerDef.strokeColor.substring(0, 2), 16) / 255;
              var sg = parseInt(layerDef.strokeColor.substring(2, 4), 16) / 255;
              var sb = parseInt(layerDef.strokeColor.substring(4, 6), 16) / 255;
              textDoc.strokeColor = [sr, sg, sb];
              textDoc.applyStroke = true;
            }
            if (layerDef.strokeWidth !== undefined) {
              textDoc.strokeWidth = layerDef.strokeWidth;
              textDoc.applyStroke = true;
            }
            if (layerDef.tracking !== undefined) textDoc.tracking = layerDef.tracking;
            if (layerDef.leading) textDoc.leading = layerDef.leading;
            if (layerDef.justification) {
              var justMap: { [key: string]: ParagraphJustification } = {
                left: ParagraphJustification.LEFT_JUSTIFY,
                center: ParagraphJustification.CENTER_JUSTIFY,
                right: ParagraphJustification.RIGHT_JUSTIFY,
              };
              if (justMap[layerDef.justification]) {
                textDoc.justification = justMap[layerDef.justification];
              }
            }
            textProp.setValue(textDoc);
          }
          break;
        }
        case "camera": {
          var camType =
            layerDef.cameraType === "oneNode"
              ? CameraLayer.CameraType.ONE_NODE
              : CameraLayer.CameraType.TWO_NODE;
          newLayer = comp.layers.addCamera(layerDef.name, [comp.width / 2, comp.height / 2]);
          var camLayer = newLayer as CameraLayer;

          // Set camera options
          var camOptions = camLayer.cameraOption;
          if (layerDef.zoom !== undefined) {
            (camOptions.property("ADBE Camera Zoom") as Property).setValue(layerDef.zoom);
          }
          if (layerDef.depthOfField !== undefined) {
            (camOptions.property("ADBE Camera Depth of Field") as Property).setValue(
              layerDef.depthOfField ? 1 : 0
            );
          }
          if (layerDef.focusDistance !== undefined) {
            (camOptions.property("ADBE Camera Focus Distance") as Property).setValue(
              layerDef.focusDistance
            );
          }
          if (layerDef.aperture !== undefined) {
            (camOptions.property("ADBE Camera Aperture") as Property).setValue(layerDef.aperture);
          }
          if (layerDef.blurLevel !== undefined) {
            (camOptions.property("ADBE Camera Blur Level") as Property).setValue(layerDef.blurLevel);
          }
          break;
        }
        case "light": {
          var lightTypes: { [key: string]: LightType } = {
            parallel: LightType.PARALLEL,
            spot: LightType.SPOT,
            point: LightType.POINT,
            ambient: LightType.AMBIENT,
          };
          var lt = lightTypes[layerDef.lightType || "point"] || LightType.POINT;
          newLayer = comp.layers.addLight(layerDef.name, [comp.width / 2, comp.height / 2]);
          var lightLayer = newLayer as LightLayer;
          lightLayer.lightType = lt;

          // Set light options
          var lightOptions = lightLayer.lightOption;
          if (layerDef.intensity !== undefined) {
            (lightOptions.property("ADBE Light Intensity") as Property).setValue(layerDef.intensity);
          }
          if (layerDef.lightColor) {
            var lr = parseInt(layerDef.lightColor.substring(0, 2), 16) / 255;
            var lg = parseInt(layerDef.lightColor.substring(2, 4), 16) / 255;
            var lb = parseInt(layerDef.lightColor.substring(4, 6), 16) / 255;
            (lightOptions.property("ADBE Light Color") as Property).setValue([lr, lg, lb]);
          }
          if (layerDef.coneAngle !== undefined) {
            (lightOptions.property("ADBE Light Cone Angle") as Property).setValue(layerDef.coneAngle);
          }
          if (layerDef.coneFeather !== undefined) {
            (lightOptions.property("ADBE Light Cone Feather 2") as Property).setValue(
              layerDef.coneFeather
            );
          }
          if (layerDef.castsShadows !== undefined) {
            (lightOptions.property("ADBE Light Casts Shadows") as Property).setValue(
              layerDef.castsShadows ? 1 : 0
            );
          }
          if (layerDef.shadowDarkness !== undefined) {
            (lightOptions.property("ADBE Light Shadow Darkness") as Property).setValue(
              layerDef.shadowDarkness
            );
          }
          if (layerDef.shadowDiffusion !== undefined) {
            (lightOptions.property("ADBE Light Shadow Diffusion") as Property).setValue(
              layerDef.shadowDiffusion
            );
          }
          break;
        }
        case "shape": {
          newLayer = comp.layers.addShape();
          if (layerDef.shapes && layerDef.shapes.length > 0) {
            applyShapes(newLayer as ShapeLayer, layerDef.shapes);
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

    // Layer styles
    if (layerDef.layerStyles && layerDef.layerStyles.length > 0) {
      applyLayerStyles(newLayer, layerDef.layerStyles, comp);
    }

    layerNameMap[layerDef.name] = newLayer;
  }

  // Second pass: set parenting (must happen after all layers exist)
  for (var j = 0; j < layers.length; j++) {
    if (layers[j].parent) {
      var parentLayer = layerNameMap[layers[j].parent!];
      if (!parentLayer) {
        throw new Error(
          "Parent layer '" + layers[j].parent + "' not found for layer '" + layers[j].name + "'"
        );
      }
      layerNameMap[layers[j].name].parent = parentLayer;
    }
  }

  // Third pass: lock layers (must happen last, locked layers can't be modified)
  for (var k = 0; k < layers.length; k++) {
    if (layers[k].locked) {
      layerNameMap[layers[k].name].locked = true;
    }
  }
};
