# Rehyle

An Adobe After Effects extension that converts YAML into AE compositions and vice versa.

Write declarative YAML to describe compositions, layers, folders, and footage — then create them in After Effects with a single click. Or go the other direction: read an existing composition back into YAML.

## Features

- **YAML-to-AE**: Define compositions, layers, folders, and file imports in YAML and create them in After Effects
- **AE-to-YAML**: Generate YAML from an existing composition (full comp or selected layers)
- **Built-in editor**: CodeMirror 6 with YAML syntax highlighting, code folding, and real-time schema validation
- **Schema validation**: Errors display inline in the editor with line numbers before anything is sent to AE
- **Load from file**: Import `.yaml` / `.yml` files from disk

## Installation

1. Build the extension:

   ```bash
   npm install
   npm run build
   ```

2. Enable unsigned extensions in After Effects (use [aescripts ZXP Installer](https://aescripts.com/learn/zxp-installer/) > Settings > Debug > Enable Debugging, or set the `PlayerDebugMode` registry/plist flag).

3. Restart After Effects. The panel appears under **Window > Extensions > Rehyle**.

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

A Rehyle document has three optional top-level keys: `folders`, `files`, and `comps`. At least one must be present.

### Minimal example

```yaml
comps:
  - name: My Comp
    layers:
      - name: background
        type: solid
        color: "1a1a2e"
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

comps:
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

| Property | Type   | Required | Description          |
| -------- | ------ | -------- | -------------------- |
| name     | string | yes      | Folder name          |
| parent   | string | no       | Parent folder name   |

#### `files`

| Property | Type             | Required | Description                    |
| -------- | ---------------- | -------- | ------------------------------ |
| id       | string \| number | yes      | Unique identifier for the file |
| path     | string           | yes      | Absolute file path             |
| sequence | boolean          | no       | Import as image sequence       |
| folder   | string           | no       | Target project folder          |

#### `comps`

| Property    | Type   | Required | Default    | Description              |
| ----------- | ------ | -------- | ---------- | ------------------------ |
| name        | string | yes      |            | Composition name         |
| width       | int    | no       | 1920       | Width in pixels          |
| height      | int    | no       | 1080       | Height in pixels         |
| duration    | number | no       | 10         | Duration in seconds      |
| framerate   | number | no       | 30         | Frames per second        |
| pixelAspect | number | no       | 1          | Pixel aspect ratio       |
| color       | string | no       | `"000000"` | Background hex color     |
| folder      | string | no       |            | Target project folder    |
| layers      | array  | no       |            | List of layers (below)   |

#### `layers`

Each layer must have either `type` or `file` (not both).

| Property     | Type             | Required                    | Description                        |
| ------------ | ---------------- | --------------------------- | ---------------------------------- |
| name         | string           | yes                         | Layer name                         |
| type         | string           | if no `file`                | `solid`, `null`, `adjustment`, `text` |
| file         | string \| number | if no `type`                | References a file `id`             |
| inPoint      | number           | no                          | In point (seconds, >= 0)           |
| outPoint     | number           | no                          | Out point (seconds, >= 0)          |
| startTime    | number           | no                          | Start time offset                  |
| width        | int              | no                          | Solid width                        |
| height       | int              | no                          | Solid height                       |
| color        | string           | yes for `solid`             | 6-char hex color (e.g. `FF0000`)   |
| text         | string           | yes for `text`              | Text content                       |
| fontSize     | number           | no                          | Font size                          |
| font         | string           | no                          | Font family name                   |
| enabled      | boolean          | no                          | Layer visibility                   |
| shy          | boolean          | no                          | Shy flag                           |
| locked       | boolean          | no                          | Lock flag                          |
| threeDLayer  | boolean          | no                          | Enable 3D                          |
| parent       | string           | no                          | Parent layer name                  |
| blendingMode | string           | no                          | Blending mode (see list below)     |
| transform    | object           | no                          | Transform properties (see below)   |

#### `transform`

| Property    | Type            | Description                   |
| ----------- | --------------- | ----------------------------- |
| anchorPoint | [x, y]          | Anchor point                  |
| position    | [x, y]          | Position                      |
| scale       | [x, y]          | Scale (percent)               |
| rotation    | number          | Rotation (degrees)            |
| opacity     | number          | Opacity (0-100)               |

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
