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
- **Layer types**: Solids, nulls, adjustment layers, text layers, file-based layers (footage, images), and comp-in-comp nesting via the `comp` key
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

A Compdown document has three optional top-level keys: `folders`, `files`, and `compositions`. At least one must be present.

### Minimal example

```yaml
compositions:
  - name: My Comp
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
        comp: Lower Third
        transform:
          position:
            - time: 2
              value: [960, 1280]
            - time: 3
              value: [960, 980]
      - name: adjustment
        type: adjustment
        blendingMode: softLight
      - name: guide
        type: null
        threeDLayer: true
        locked: true
        shy: true
```

### Reference

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

#### `layers`

Each layer must have exactly one of `type`, `file`, or `comp`.

| Property     | Type             | Required            | Description                           |
| ------------ | ---------------- | ------------------- | ------------------------------------- |
| name         | string           | yes                 | Layer name                            |
| type         | string           | if no `file`/`comp` | `solid`, `null`, `adjustment`, `text` |
| file         | string \| number | if no `type`/`comp` | References a file `id`                |
| comp         | string           | if no `type`/`file` | References another comp by name       |
| inPoint      | number           | no                  | In point (seconds, >= 0)              |
| outPoint     | number           | no                  | Out point (seconds, >= 0)             |
| startTime    | number           | no                  | Start time offset                     |
| width        | int              | no                  | Solid width                           |
| height       | int              | no                  | Solid height                          |
| color        | string           | yes for `solid`     | 6-char hex color (e.g. `FF0000`)      |
| text         | string           | yes for `text`      | Text content                          |
| fontSize     | number           | no                  | Font size                             |
| font         | string           | no                  | Font family name                      |
| enabled      | boolean          | no                  | Layer visibility                      |
| shy          | boolean          | no                  | Shy flag                              |
| locked       | boolean          | no                  | Lock flag                             |
| threeDLayer  | boolean          | no                  | Enable 3D                             |
| parent       | string           | no                  | Parent layer name                     |
| blendingMode | string           | no                  | Blending mode (see list below)        |
| transform    | object           | no                  | Transform properties (see below)      |

#### `effects`

An optional array on each layer. Each effect has:

| Property   | Type    | Required | Description                               |
| ---------- | ------- | -------- | ----------------------------------------- |
| name       | string  | yes      | Effect display name                       |
| matchName  | string  | no       | AE internal match name (for portability)  |
| enabled    | boolean | no       | Default `true`; set `false` to disable    |
| properties | object  | no       | Key-value map of property names to values |

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

| Property    | Static type | Keyframe value | Description        |
| ----------- | ----------- | -------------- | ------------------ |
| anchorPoint | [x, y]      | [x, y]         | Anchor point       |
| position    | [x, y]      | [x, y]         | Position           |
| scale       | [x, y]      | [x, y]         | Scale (percent)    |
| rotation    | number      | number         | Rotation (degrees) |
| opacity     | number      | number (0-100) | Opacity            |

**Keyframe syntax**: each keyframe is an object with `time` (seconds, >= 0) and `value`. You can mix static and keyframed properties on the same layer.

```yaml
transform:
  rotation: 45 # static
  position: # keyframed
    - time: 0
      value: [0, 0]
    - time: 5
      value: [1920, 1080]
  opacity:
    - time: 0
      value: 0
    - time: 2
      value: 100
```

#### Blending modes

`normal`, `dissolve`, `darken`, `multiply`, `colorBurn`, `linearBurn`, `darkerColor`, `lighten`, `screen`, `colorDodge`, `linearDodge`, `lighterColor`, `overlay`, `softLight`, `hardLight`, `vividLight`, `linearLight`, `pinLight`, `hardMix`, `difference`, `exclusion`, `subtract`, `divide`, `hue`, `saturation`, `color`, `luminosity`

## Architecture

The extension runs two separate runtimes connected by [Bolt CEP](https://github.com/nicholaseager/bolt-cep):

- **Panel** (React + TypeScript): UI, YAML editing, schema validation. All parsing and validation happen here before anything is sent to AE.
- **ExtendScript** (ES3, runs inside AE): Receives validated JSON and executes After Effects API calls. Handles creation of project items and reading of compositions.

Creation order when building from YAML: folders -> files -> compositions -> layers. Each step's output feeds into the next (layers need comp references, file-based layers need footage references).

## Tech stack

- [React](https://react.dev/) 19 + TypeScript
- [CodeMirror 6](https://codemirror.net/) (YAML editor)
- [Zod](https://zod.dev/) (schema validation)
- [js-yaml](https://github.com/nodeca/js-yaml) (YAML parsing)
- [Vite](https://vite.dev/) + [Bolt CEP](https://github.com/nicholaseager/bolt-cep) (build tooling)
