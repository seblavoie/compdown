# Compdown

**A natural language for After Effects.**

Compdown is an After Effects extension that lets you describe After Effects content (compositions, layers, folders, files, keyframes, effects, etc.) in YAML and create them with a single click.

It also allows you to export existing comps back into YAML.

## Why text?

- **Readable** — Elegant syntax that stays clean when you ship it across teams
- **Shareable** — Save it, gist it, email it, or drop it in a repo. Text travels well
- **Fast** — Copy, paste, process. Stay in After Effects and skip binary presets
- **AI-friendly** — If an AI can read and write the same text you use, it can help draft scenes, explore variations, or build first passes

## Supported Features

### After Effects

- **Project structure**: Define **folders**, **files**, and **compositions** in YAML; creation order is folders → files → compositions → layers
- **Layer types**: Solids, nulls, adjustment layers, text layers, shape layers, camera layers, light layers, audio layers, file-based layers (footage, images), and composition-in-composition nesting via the `composition` key
- **Shape layers**: Parametric shapes (rectangle, ellipse, polygon, star) and custom paths with fill and stroke properties
- **Masks**: Per-layer masks with modes, opacity, feather, expansion, and optional animated paths
- **Text animators**: Per-character animation via text animators (opacity/position/scale/rotation/etc.)
- **Keyframe animation**: Transform properties (position, scale, rotation, opacity, anchor point) with static values or arrays of keyframes
- **Layer effects**: Native effects on layers, with properties supporting static or animated values, by display name or `matchName`

### Extension

- **Schema validation**: Real-time type and structure validation for all YAML, with detailed, line-numbered errors before anything reaches AE
- **Built-in editor**: CodeMirror 6 with YAML syntax highlighting, code folding, one-dark theme, and error gutter
- **Import/export**: Load `.yaml`/`.yml` files from disk and export existing AE comps back to YAML with a single click

## Installation

1. Build the extension:

   ```bash
   npm install
   npm run build
   ```

2. Enable unsigned extensions in After Effects (use [aescripts ZXP Installer](https://aescripts.com/learn/zxp-installer/) > Settings > Debug > Enable Debugging, or set the `PlayerDebugMode` registry/plist flag).

3. Restart After Effects. The panel appears under **Window > Extensions > Compdown**.

For distribution as a signed ZXP:

```bash
npm run zxp
```

## Development

```bash
npm run dev        # Dev server with HMR (localhost:3000)
npm run build      # Production build
npm run serve      # Preview production build (localhost:5000)
```

Type-check the panel side:

```bash
npx tsc -p tsconfig-build.json --noEmit
```

## YAML Schema

A Compdown document has optional top-level keys: `_timeline`, `destination`, `layers`, `folders`, `files`, and `compositions`. At least one content section must be present (`layers`, `folders`, `files`, or `compositions`).

Preferred top-level layers syntax:

```yaml
_timeline:
  layers:
    - name: My Layer
      type: text
      text: Hello
```

This adds the layers into the currently active composition timeline.
Legacy syntax is still supported:

```yaml
destination: _timeline
layers:
  - name: My Layer
    type: text
    text: Hello
```

> [!NOTE]
> Compdown automatically handles some YAML parsing quirks so you don't need extra quotes:
> - `type: null` works as-is (YAML would normally parse this as a null value, not the string "null")
> - `color: 000000` works as-is (YAML would normally parse all-digit values as numbers)

### Minimal example

```yaml
_timeline:
  layers:
    - name: background
      type: solid
      color: 1a1a2e
    - name: title
      type: text
      text: Hello World
      transform:
        position: [960, 540]
```

### Full example

```yaml
folders:
  - name: Footage
  - name: Renders
  - name: Plates
    parent: Footage

files:
  - id: bg
    path: /path/to/background.png
    folder: Footage
  - id: seq
    path: /path/to/sequence/frame_[0001-0100].png
    sequence: true

compositions:
  - name: Lower Third
    width: 1920
    height: 200
    duration: 5
    layers:
      - name: bar
        type: solid
        color: 1a1a2e
      - name: label
        type: text
        text: Breaking News
        transform:
          opacity:
            - time: 0
              value: 0
            - time: 1
              value: 100

  - name: Main Comp
    width: 1920
    height: 1080
    duration: 10
    framerate: 30
    pixelAspect: 1
    color: "000000"
    folder: Renders
    layers:
      - name: bg plate
        file: bg
        transform:
          position: [960, 540]
          scale: [100, 100]
          opacity: 80
      - name: lower third
        composition: Lower Third
        transform:
          position:
            - time: 2
              value: [960, 1280]
            - time: 3
              value: [960, 980]
      - name: adjustment
        type: adjustment
        blendingMode: softLight
        effectsActive: true
      - name: video clip
        file: seq
        motionBlur: true
        quality: best
        samplingQuality: bicubic
        frameBlendingType: pixelMotion
        label: 4
      - name: guide
        type: null
        threeDLayer: true
        locked: true
        shy: true
        guideLayer: true
```

### Reference

#### `_timeline`

Preferred target block for top-level `layers`.

| Value       | Description |
| ----------- | ----------- |
| `_timeline` | Create `layers` in the currently active composition timeline |

Notes:
- Use `_timeline.layers` for top-level layer authoring.
- If no composition timeline is active in After Effects, creation fails with an explicit error.
- Legacy `destination: _timeline` + top-level `layers` is still supported for backward compatibility.

#### `folders`

| Property | Type   | Required | Description        |
| -------- | ------ | -------- | ------------------ |
| name     | string | yes      | Folder name        |
| parent   | string | no       | Parent folder name |

#### `files`

| Property | Type             | Required | Description                    |
| -------- | ---------------- | -------- | ------------------------------ |
| id       | string \| number | yes      | Unique identifier for the file |
| path     | string           | yes      | Absolute file path             |
| sequence | boolean          | no       | Import as image sequence       |
| folder   | string           | no       | Target project folder          |

#### `compositions`

| Property    | Type   | Required | Default    | Description            |
| ----------- | ------ | -------- | ---------- | ---------------------- |
| name        | string | yes      |            | Composition name       |
| width       | int    | no       | 1920       | Width in pixels        |
| height      | int    | no       | 1080       | Height in pixels       |
| duration    | number | no       | 10         | Duration in seconds    |
| framerate   | number | no       | 30         | Frames per second      |
| pixelAspect | number | no       | 1          | Pixel aspect ratio     |
| color       | string | no       | `"000000"` | Background hex color   |
| folder      | string | no       |            | Target project folder  |
| layers      | array  | no       |            | List of layers (below) |
| markers     | array  | no       |            | List of markers (below)|

#### `layers`

Each layer must have exactly one of `type`, `file`, or `composition`.

`layers` can be used in two places:
- Nested under a composition in `compositions[].layers`
- Inside `_timeline.layers` at the top level (preferred)
- As legacy top-level `layers` (requires `destination: _timeline`)

##### Core identity and source

| Property  | Type             | Required            | Description                              |
| --------- | ---------------- | ------------------- | ---------------------------------------- |
| name      | string           | yes                 | Layer name                               |
| type      | string           | if no `file`/`composition` | `solid`, `null`, `adjustment`, `text`, `camera`, `light`, `shape`, `audio` |
| file      | string \| number | if no `type`/`composition` | References a file `id`                   |
| composition | string         | if no `type`/`file` | References another composition by name   |
| transform | object           | no                  | Transform properties (see below)         |

##### Timing and placement

| Property  | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| inPoint   | number | no       | In point (seconds, >= 0) |
| outPoint  | number | no       | Out point (seconds, >= 0)  |
| startTime | number | no       | Start time offset        |
| label     | int    | no       | Color label index (0-16) |

##### Type-specific (solid and text)

| Property      | Type   | Required        | Description                      |
| ------------- | ------ | --------------- | -------------------------------- |
| width         | int    | no              | Solid width                      |
| height        | int    | no              | Solid height                     |
| color         | string | yes for `solid` | 6-char hex color (e.g. `FF0000`) |
| text          | string | yes for `text`  | Text content                     |
| fontSize      | number | no              | Font size                        |
| font          | string | no              | Font family name                 |
| fillColor     | string | no              | Text fill color (6-char hex)     |
| strokeColor   | string | no              | Text stroke color (6-char hex)   |
| strokeWidth   | number | no              | Text stroke width                |
| tracking      | number | no              | Character spacing                |
| leading       | number | no              | Line spacing                     |
| justification | string | no              | `left`, `center`, `right`        |

##### Type-specific (audio)

| Property | Type             | Required         | Description               |
| -------- | ---------------- | ---------------- | ------------------------- |
| file     | string \| number | yes for `audio`  | References a file `id`    |

##### Layer switches and toggles

| Property               | Type    | Required | Description                           |
| ---------------------- | ------- | -------- | ------------------------------------- |
| enabled                | boolean | no       | Layer visibility                      |
| shy                    | boolean | no       | Shy flag                              |
| locked                 | boolean | no       | Lock flag                             |
| threeDLayer            | boolean | no       | Enable 3D                             |
| solo                   | boolean | no       | Solo the layer                        |
| audioEnabled           | boolean | no       | Enable/disable audio                  |
| motionBlur             | boolean | no       | Enable motion blur                    |
| collapseTransformation | boolean | no       | Continuously rasterize / collapse     |
| guideLayer             | boolean | no       | Mark as guide layer                   |
| effectsActive          | boolean | no       | Global effects toggle                 |
| timeRemapEnabled       | boolean | no       | Enable time remapping                 |

##### Parenting and render behavior

| Property          | Type   | Required | Description                                             |
| ----------------- | ------ | -------- | ------------------------------------------------------- |
| parent            | string | no       | Parent layer name                                       |
| blendingMode      | string | no       | Blending mode (see list below)                          |
| quality           | string | no       | `best`, `draft`, `wireframe`                            |
| samplingQuality   | string | no       | `bicubic`, `bilinear`                                   |
| autoOrient        | string | no       | `off`, `alongPath`, `cameraOrPointOfInterest`           |
| frameBlendingType | string | no       | `none`, `frameMix`, `pixelMotion`                       |
| trackMatteType    | string | no       | `none`, `alpha`, `alphaInverted`, `luma`, `lumaInverted` |

##### Camera-specific

| Property      | Type    | Required | Description                              |
| ------------- | ------- | -------- | ---------------------------------------- |
| cameraType    | string  | no       | `oneNode`, `twoNode` (for camera layers) |
| zoom          | number  | no       | Camera zoom                              |
| depthOfField  | boolean | no       | Enable depth of field                    |
| focusDistance | number  | no       | Camera focus distance                    |
| aperture      | number  | no       | Camera aperture                          |
| blurLevel     | number  | no       | Blur level (0-100)                       |

##### Light-specific

| Property       | Type    | Required        | Description                            |
| -------------- | ------- | --------------- | -------------------------------------- |
| lightType      | string  | yes for `light` | `parallel`, `spot`, `point`, `ambient` |
| intensity      | number  | no              | Light intensity                        |
| lightColor     | string  | no              | Light color (6-char hex)               |
| coneAngle      | number  | no              | Spot light cone angle (0-180)          |
| coneFeather    | number  | no              | Spot light cone feather (0-100)        |
| castsShadows   | boolean | no              | Enable shadow casting                  |
| shadowDarkness | number  | no              | Shadow darkness (0-100)                |
| shadowDiffusion | number  | no              | Shadow diffusion                       |

##### Shape-layer specific

| Property | Type  | Required         | Description                 |
| -------- | ----- | ---------------- | --------------------------- |
| shapes   | array | yes for `shape`  | Array of shapes (see below) |

#### `shapes` (Shape Layers)

Shape layers support parametric shapes (rectangle, ellipse, polygon, star) and custom paths with fill and stroke. Each shape layer requires a `shapes` array with at least one shape.

> [!NOTE]
> Shape-group gradient fills (`fill.gradient`) are not part of the schema. For gradient looks, use layer styles/effects on the layer.

**Shape types and properties:**

| Shape Type | Required Properties | Optional Properties |
|------------|---------------------|---------------------|
| `rectangle` | `size: [w, h]` | `position`, `roundness`, `fill`, `stroke`, `name` |
| `ellipse` | `size: [w, h]` | `position`, `fill`, `stroke`, `name` |
| `polygon` | `points`, `outerRadius` | `position`, `outerRoundness`, `rotation`, `fill`, `stroke`, `name` |
| `star` | `points`, `outerRadius`, `innerRadius` | `position`, `outerRoundness`, `innerRoundness`, `rotation`, `fill`, `stroke`, `name` |
| `path` | `vertices` | `inTangents`, `outTangents`, `closed`, `position`, `fill`, `stroke`, `name` |

**Fill and stroke:**

| Property | Type | Description |
|----------|------|-------------|
| `fill.color` | string | 6-char hex color (required for fill) |
| `fill.opacity` | number | Opacity 0-100 (default: 100) |
| `stroke.color` | string | 6-char hex color (required for stroke) |
| `stroke.width` | number | Stroke width (default: 1) |
| `stroke.opacity` | number | Opacity 0-100 (default: 100) |

**Shape operators (`operators` on each shape):**

| Operator type | Supported properties |
|---|---|
| `trimPaths` | `start`, `end`, `offset`, `trimMultipleShapes` |
| `zigZag` | `size`, `ridgesPerSegment`, `points` |
| `repeater` | `copies`, `offset`, `transform.anchorPoint`, `transform.position`, `transform.scale`, `transform.rotation`, `transform.startOpacity`, `transform.endOpacity` |
| `offsetPaths` | `amount`, `lineJoin`, `miterLimit` |
| `puckerBloat` | `amount` |
| `roundCorners` | `radius` |
| `mergePaths` | `mode` |
| `twist` | `angle`, `center` |
| `wigglePaths` | `size`, `detail`, `points`, `wigglesPerSecond`, `correlation`, `temporalPhase`, `spatialPhase`, `randomSeed` |

**Example:**

```yaml
layers:
  - name: Shape Layer
    type: shape
    shapes:
      - type: rectangle
        name: Background
        size: [400, 200]
        position: [0, 0]
        roundness: 20
        fill:
          color: FF5500
          opacity: 100
        stroke:
          color: "000000"
          width: 2

      - type: ellipse
        name: Circle
        size: [100, 100]
        position: [50, 50]
        fill:
          color: 00FF00

      - type: polygon
        name: Triangle
        points: 3
        outerRadius: 50
        fill:
          color: 0000FF

      - type: star
        name: Star
        points: 5
        outerRadius: 100
        innerRadius: 40
        fill:
          color: FFFF00

      - type: path
        name: Custom Path
        vertices:
          - [0, 0]
          - [120, 0]
          - [120, 80]
          - [0, 80]
        closed: true
        stroke:
          color: "00FFFF"
          width: 2

  - name: VO
    type: audio
    file: voiceover-01
```

> [!NOTE]
> For `path` shapes, `inTangents` and `outTangents` are optional. If omitted, tangents default to `[0, 0]`.

#### `masks`

Masks can be added to any layer type.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | no | Mask name |
| `path` | object or array | yes | Mask path (see below) |
| `mode` | string | no | `add`, `subtract`, `intersect`, `lighten`, `darken`, `difference`, `none` |
| `opacity` | number | no | Opacity 0-100 |
| `feather` | [number, number] | no | Feather [x, y] |
| `expansion` | number | no | Expansion in pixels |
| `inverted` | boolean | no | Invert mask |

**Mask path:**

```yaml
path:
  vertices:
    - [0, 0]
    - [100, 0]
    - [100, 100]
    - [0, 100]
  inTangents:  # optional
    - [0, 0]
    - [0, 0]
    - [0, 0]
    - [0, 0]
  outTangents: # optional
    - [0, 0]
    - [0, 0]
    - [0, 0]
    - [0, 0]
  closed: true
```

**Example:**

```yaml
layers:
  - name: Masked Solid
    type: solid
    color: FF0000
    masks:
      - name: Hole
        mode: subtract
        feather: [8, 8]
        path:
          vertices:
            - [200, 200]
            - [400, 200]
            - [400, 400]
            - [200, 400]
```

#### `textAnimators`

Text animators are available on text layers and let you animate properties per-character.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | no | Animator name |
| `properties` | object | yes | Properties to animate (see below) |
| `selector` | object | no | Range selector settings |

**Animator properties (supported):**

`opacity`, `position`, `scale`, `rotation`, `anchorPoint`, `tracking`

**Selector properties (supported):**

`start`, `end`, `offset`, `smoothness`

**Example:**

```yaml
layers:
  - name: Title
    type: text
    text: "Compdown"
    textAnimators:
      - name: Fade In
        properties:
          opacity:
            - time: 0
              value: 0
            - time: 1
              value: 100
              easing: easeOut
        selector:
          start: 0
          end: 100
```

#### `effects`

An optional array on each layer. Each effect has:

| Property   | Type    | Required | Description                               |
| ---------- | ------- | -------- | ----------------------------------------- |
| name        | string  | yes      | Effect display name                       |
| matchName   | string  | no       | AE internal match name (for portability)  |
| enabled     | boolean | no       | Default `true`; set `false` to disable    |
| properties  | object  | no       | Key-value map of property names to values |
| expressions | object  | no       | Key-value map of property names to expressions |

**Property value types:**

| Type           | Example                       | Description                    |
| -------------- | ----------------------------- | ------------------------------ |
| number         | `10`                          | Scalar value                   |
| boolean        | `true`                        | Checkbox (converted to 1/0)    |
| number array   | `[960, 540]`                  | 2D point, color, etc.          |
| keyframe array | `[{time: 0, value: 10}, ...]` | Animated (minimum 2 keyframes) |

```yaml
effects:
  - name: Gaussian Blur
    matchName: ADBE Gaussian Blur 2
    properties:
      Blurriness: 10
      Repeat Edge Pixels: true
  - name: CC Radial Fast Blur
    enabled: false
    properties:
      Amount: 50
      Center:
        - time: 0
          value: [960, 540]
        - time: 5
          value: [0, 0]
```

#### `transform`

Each transform property accepts either a static value or an array of keyframes (minimum 2).

| Property    | Static type | Keyframe value | Description                    |
| ----------- | ----------- | -------------- | ------------------------------ |
| anchorPoint | [x, y]      | [x, y]         | Anchor point                   |
| position    | [x, y]      | [x, y]         | Position (combined X/Y)        |
| positionX   | number      | number         | X position (separate)          |
| positionY   | number      | number         | Y position (separate)          |
| positionZ   | number      | number         | Z position (3D layers)         |
| scale       | [x, y]      | [x, y]         | Scale (percent)                |
| rotation    | number      | number         | Z Rotation (degrees)           |
| rotationX   | number      | number         | X Rotation (3D layers)         |
| rotationY   | number      | number         | Y Rotation (3D layers)         |
| opacity     | number      | number (0-100) | Opacity                        |

> **Note:** Use either `position` OR `positionX`/`positionY`/`positionZ`, not both. Separate dimensions allow independent easing per axis. Using `positionZ`, `rotationX`, or `rotationY` automatically enables the layer's 3D switch.

**Keyframe syntax**: each keyframe is an object with `time` (seconds, >= 0), `value`, and optional `easing`. You can mix static and keyframed properties on the same layer.

```yaml
transform:
  rotation: 45 # static
  position: # keyframed with easing
    - time: 0
      value: [0, 0]
      easing: easeOut
    - time: 5
      value: [1920, 1080]
      easing: easeIn
  opacity:
    - time: 0
      value: 0
    - time: 2
      value: 100
```

**Easing types**: `linear` (default), `easeIn`, `easeOut`, `easeInOut`, `hold`

| Easing | Description |
|--------|-------------|
| `linear` | Constant speed (default, no need to specify) |
| `easeIn` | Slow arrival at this keyframe |
| `easeOut` | Slow departure from this keyframe |
| `easeInOut` | Slow arrival and departure |
| `hold` | Hold value until next keyframe (no interpolation) |

**Expressions**: Add an `expressions` object to apply AE expressions to transform properties:

```yaml
transform:
  position: [960, 540]
  rotation: 0
  expressions:
    position: "wiggle(5, 50)"
    rotation: "time * 36"
```

#### `markers`

Optional array on compositions. Each marker has:

| Property | Type   | Required | Description                        |
|----------|--------|----------|------------------------------------|
| time     | number | yes      | Marker time in seconds             |
| comment  | string | no       | Marker comment/label               |
| duration | number | no       | Marker duration (for range markers)|
| chapter  | string | no       | Chapter name                       |
| url      | string | no       | URL link                           |
| label    | int    | no       | Color label (0-16)                 |

```yaml
compositions:
  - name: My Comp
    markers:
      - time: 0
        comment: "Intro"
      - time: 5
        comment: "Main Content"
        duration: 10
      - time: 15
        comment: "Outro"
        chapter: "Credits"
```

#### Blending modes

`normal`, `dissolve`, `darken`, `multiply`, `colorBurn`, `linearBurn`, `darkerColor`, `lighten`, `screen`, `colorDodge`, `linearDodge`, `lighterColor`, `overlay`, `softLight`, `hardLight`, `vividLight`, `linearLight`, `pinLight`, `hardMix`, `difference`, `exclusion`, `subtract`, `divide`, `hue`, `saturation`, `color`, `luminosity`

#### `essentialGraphics`

Expose layer properties to the Essential Graphics Panel for creating Motion Graphics Templates (.mogrt). Each composition can have an optional `essentialGraphics` array.

**Two forms are supported:**

Simple form (string path, uses property path as display name):
```yaml
essentialGraphics:
  - title.transform.position
  - title.text
```

Expanded form (custom display name and options):
```yaml
essentialGraphics:
  - property: title.transform.position
    name: "Logo Position"
  - property: title.text
    name: "Headline"
  - property: bar.transform.opacity
    encodePathInName: false  # Disable round-trip encoding
```

| Property        | Type    | Required | Description                                |
|-----------------|---------|----------|--------------------------------------------|
| property        | string  | yes      | Property path (e.g. `layer.transform.position`) |
| name            | string  | no       | Custom display name (defaults to property path) |
| encodePathInName| boolean | no       | Encode property path for round-trip (default: true) |

**Property path format:** `layerName.propertyPath`

| Path Pattern | Description |
|--------------|-------------|
| `layer.transform.position` | Position property |
| `layer.transform.scale` | Scale property |
| `layer.transform.rotation` | Rotation property |
| `layer.transform.opacity` | Opacity property |
| `layer.transform.anchorPoint` | Anchor point property |
| `layer.text` | Text source property |
| `layer.effects.EffectName.PropName` | Effect property |

**Full example:**
```yaml
compositions:
  - name: Lower Third
    layers:
      - name: title
        type: text
        text: "Breaking News"
      - name: bar
        type: solid
        color: FF0000
        effects:
          - name: Gaussian Blur
            properties:
              Blurriness: 10

    essentialGraphics:
      - property: title.text
        name: "Headline"
      - property: title.transform.position
        name: "Title Position"
      - property: bar.effects.Gaussian Blur.Blurriness
        name: "Bar Blur"
```

**Round-trip support:**

By default, Compdown encodes the property path in the controller name (format: `Display Name [path:layer.transform.position]`). This allows exported YAML to include the full property path, enabling true round-trip workflows:

1. Create a comp from YAML with Essential Graphics entries
2. Export the comp back to YAML
3. The exported YAML includes both the property path and display name

To disable this encoding (for cleaner controller names in Premiere):
```yaml
essentialGraphics:
  - property: title.text
    name: "Headline"
    encodePathInName: false  # Controller name will be just "Headline"
```

> [!NOTE]
> - Not all properties can be added to the Essential Graphics Panel. Compdown checks `canAddToMotionGraphicsTemplate()` and skips unsupported properties silently.
> - `addToMotionGraphicsTemplateAs()` (custom names) requires After Effects CC 2019 (16.1) or later.
> - Legacy Essential Graphics entries (created manually or without path encoding) export as name-only objects.

## Architecture

The extension runs two separate runtimes connected by [Bolt CEP](https://github.com/nicholaseager/bolt-cep):

- **Panel** (React + TypeScript): UI, YAML editing, schema validation. All parsing and validation happen here before anything is sent to AE.
- **ExtendScript** (ES3, runs inside AE): Receives validated JSON and executes After Effects API calls. Handles creation of project items and reading of compositions.

Creation order when building from YAML: folders -> files -> compositions -> layers. Each step's output feeds into the next (layers need composition references, file-based layers need footage references).

## Tech stack

- [React](https://react.dev/) 19 + TypeScript
- [CodeMirror 6](https://codemirror.net/) (YAML editor)
- [Zod](https://zod.dev/) (schema validation)
- [js-yaml](https://github.com/nodeca/js-yaml) (YAML parsing)
- [Vite](https://vite.dev/) + [Bolt CEP](https://github.com/nicholaseager/bolt-cep) (build tooling)
