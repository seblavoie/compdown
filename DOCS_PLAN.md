# Compdown Documentation Repository Plan

## Overview

Create a new repository `docs` in the compdown org using VitePress to host user-focused documentation on GitHub Pages.

## Summary

| Aspect | Decision |
|--------|----------|
| Repo name | `docs` (in compdown org) |
| Framework | VitePress |
| Hosting | GitHub Pages |
| Versioning | Single version (latest only) |
| Theme | Default VitePress |
| Audience | End users |

---

## Phase 1: Repository Setup

### 1.1 Create Repository Structure

```
docs/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment
├── .vitepress/
│   └── config.ts               # VitePress configuration
├── public/
│   └── favicon.ico             # (optional branding later)
├── guide/
│   ├── index.md                # Getting Started landing
│   ├── installation.md         # Install instructions
│   └── quick-start.md          # First composition tutorial
├── reference/
│   ├── index.md                # Reference landing
│   ├── folders.md              # folders schema
│   ├── files.md                # files schema
│   ├── compositions.md         # compositions schema
│   ├── layers.md               # layers schema (biggest page)
│   ├── transform.md            # transform + keyframes
│   ├── effects.md              # effects schema
│   ├── shapes.md               # shape layers
│   ├── essential-graphics.md   # Essential Graphics Panel
│   └── markers.md              # markers schema
├── examples/
│   ├── index.md                # Examples landing
│   ├── lower-third.md          # Lower third recipe
│   ├── animated-background.md  # Animated background
│   ├── text-animations.md      # Text layer examples
│   └── motion-templates.md     # MOGRT workflow
├── index.md                    # Homepage
└── package.json
```

### 1.2 Initialize Project

```bash
mkdir docs && cd docs
npm init -y
npm install -D vitepress
```

### 1.3 VitePress Configuration

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Compdown',
  description: 'A natural language for After Effects',

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ]
        }
      ],
      '/reference/': [
        {
          text: 'YAML Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'Folders', link: '/reference/folders' },
            { text: 'Files', link: '/reference/files' },
            { text: 'Compositions', link: '/reference/compositions' },
            { text: 'Layers', link: '/reference/layers' },
            { text: 'Transform', link: '/reference/transform' },
            { text: 'Effects', link: '/reference/effects' },
            { text: 'Shapes', link: '/reference/shapes' },
            { text: 'Essential Graphics', link: '/reference/essential-graphics' },
            { text: 'Markers', link: '/reference/markers' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Lower Third', link: '/examples/lower-third' },
            { text: 'Animated Background', link: '/examples/animated-background' },
            { text: 'Text Animations', link: '/examples/text-animations' },
            { text: 'Motion Templates', link: '/examples/motion-templates' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/compdown/compdown' }
    ],

    footer: {
      message: 'Released under the MIT License.',
    }
  }
})
```

---

## Phase 2: Content Migration & Structure

### 2.1 Homepage (`index.md`)

- Hero section with tagline: "A natural language for After Effects"
- Features grid: Readable, Shareable, Fast, AI-friendly
- Quick example (minimal YAML)
- Links to Guide, Reference, Examples

### 2.2 Getting Started Section

**`/guide/index.md`** - Introduction
- What is Compdown?
- Why text-based workflows?
- What you can do with it

**`/guide/installation.md`** - Installation
- Prerequisites (AE version requirements)
- Option 1: Build from source
- Option 2: Install ZXP release
- Enable unsigned extensions (debug mode)
- Verify installation

**`/guide/quick-start.md`** - Quick Start Tutorial
- Your first composition (solid + text)
- Understanding the YAML structure
- Creating layers
- Adding animation (keyframes intro)
- Exporting back to YAML

### 2.3 Reference Section

Break the monolithic README schema docs into focused pages:

**`/reference/index.md`** - Overview
- Document structure (3 top-level keys)
- How sections relate (folders → files → compositions → layers)
- YAML parsing notes (null handling, color parsing)

**`/reference/folders.md`** - Folders
- Schema table
- Nested folders example

**`/reference/files.md`** - Files
- Schema table
- Image sequences
- File placement in folders

**`/reference/compositions.md`** - Compositions
- Schema table with defaults
- Comp-in-comp nesting
- Folder placement

**`/reference/layers.md`** - Layers (comprehensive)
- Core identity (name, type/file/comp)
- Layer types breakdown:
  - Solid layers
  - Null layers
  - Adjustment layers
  - Text layers
  - Camera layers
  - Light layers
  - Shape layers
  - File-based layers
  - Comp layers
- Timing properties
- Switches and toggles
- Parenting
- Blending modes (full list)
- Quality and rendering settings

**`/reference/transform.md`** - Transform & Animation
- Static values vs keyframes
- Property list with types
- Position: combined vs separate (X/Y/Z)
- 3D rotation (rotationX/Y)
- Keyframe syntax
- Easing types with examples
- Expressions

**`/reference/effects.md`** - Effects
- Effect structure
- matchName for portability
- Property value types
- Keyframed effect properties
- Effect expressions
- Examples with built-in effects

**`/reference/shapes.md`** - Shape Layers
- Shape types (rectangle, ellipse, polygon, star)
- Shape properties
- Fill and stroke
- Limitations (parametric only)

**`/reference/essential-graphics.md`** - Essential Graphics
- What is Essential Graphics?
- Simple vs expanded form
- Property path format
- Round-trip encoding
- Limitations and AE version notes

**`/reference/markers.md`** - Markers
- Marker properties
- Duration markers
- Chapters and URLs

### 2.4 Examples Section

**`/examples/index.md`** - Overview
- List of available examples
- How to use examples

**`/examples/lower-third.md`** - Lower Third
- Full YAML for animated lower third
- Explanation of each part
- Variations

**`/examples/animated-background.md`** - Animated Background
- Solid with keyframed transform
- Adding effects

**`/examples/text-animations.md`** - Text Animations
- Text layer styling
- Animated text properties
- Multiple text layers

**`/examples/motion-templates.md`** - Motion Templates (MOGRT)
- Creating a template comp
- Adding Essential Graphics
- Exporting for Premiere

---

## Phase 3: GitHub Pages Deployment

### 3.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Install dependencies
        run: npm ci

      - name: Build with VitePress
        run: npm run docs:build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3.2 Package.json Scripts

```json
{
  "scripts": {
    "docs:dev": "vitepress dev",
    "docs:build": "vitepress build",
    "docs:preview": "vitepress preview"
  }
}
```

### 3.3 Enable GitHub Pages

1. Go to repo Settings > Pages
2. Source: GitHub Actions
3. Done - deploys on every push to main

---

## Phase 4: Future Enhancements (Notes)

### Developer Guide (deferred)

When ready to add:
- Architecture overview
- Contributing guide
- ExtendScript constraints
- Adding new layer types
- Testing guide

### Potential Improvements

- Search (VitePress built-in Algolia or local)
- Dark/light mode toggle
- Custom branding/logo
- Versioned docs (if schema changes significantly)
- API docs generation from Zod schemas

---

## Implementation Steps

1. **Create the repository**
   - `gh repo create compdown/docs --public`
   - Clone locally

2. **Initialize VitePress**
   - `npm init -y`
   - `npm install -D vitepress`
   - Create `.vitepress/config.ts`

3. **Create directory structure**
   - guide/, reference/, examples/ directories
   - Placeholder index.md files

4. **Migrate content from README.md**
   - Split schema docs into reference pages
   - Reformat for VitePress (tip boxes, code groups)
   - Add navigation frontmatter

5. **Write new content**
   - Homepage
   - Installation guide
   - Quick start tutorial
   - Example walkthroughs

6. **Set up deployment**
   - Add GitHub Actions workflow
   - Enable Pages in repo settings
   - Verify deployment

7. **Update main repo**
   - Add link to docs site in compdown README
   - Keep README as quick overview, link to full docs

---

## Content Source Mapping

| Docs Page | Source |
|-----------|--------|
| Homepage | New (based on README intro) |
| Installation | README "Installation" section |
| Quick Start | New tutorial |
| Reference/* | README "YAML Schema" section (split) |
| Examples/* | README examples (expanded) + new |

---

## Questions Resolved

- **Audience**: End users (not developers)
- **Hosting**: GitHub Pages
- **Versioning**: Single latest version
- **Theme**: Default VitePress
- **Dev Guide**: Deferred, noted for future
