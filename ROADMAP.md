# Compdown Roadmap

Tracking improvements and new features for the project.

## Improvements (In Progress)

### ~~1. Fix anchor point export~~
**Status:** Done
**Effort:** 5 minutes
**Issue:** `readComp()` exports position/scale/rotation/opacity but skips anchorPoint. Breaks round-trip.

### ~~2. Keyframe easing~~
**Status:** Done
**Effort:** Medium
**Issue:** All keyframes are linear. Support `easeIn`, `easeOut`, `hold`, and custom bezier curves.

**Syntax:**
```yaml
transform:
  position:
    - time: 0
      value: [0, 0]
      easing: easeOut
    - time: 2
      value: [1920, 1080]
      easing: easeIn
```

### ~~3. Text styling~~
**Status:** Done
**Effort:** Medium
**Issue:** Only fontSize/font supported. Missing color, tracking, justification, etc.

**Added properties:**
- fillColor (hex)
- strokeColor (hex)
- strokeWidth
- tracking
- leading
- justification (left, center, right)

### ~~4. Markers~~
**Status:** Done
**Effort:** Low
**Issue:** No way to add comp or layer markers. Useful for .mogrt and scripting.

**Syntax:**
```yaml
compositions:
  - name: My Comp
    markers:
      - time: 1
        comment: "Intro starts"
      - time: 5
        comment: "Outro"
        duration: 2
```

### ~~5. Warn on missing parent layer~~
**Status:** Done
**Effort:** Low
**Issue:** If you reference a non-existent parent layer, it silently skips. Should warn or error.

**Fixed:** Now throws an error with the missing parent name and the layer that referenced it.

---

## Future Features

### Shape layers
Create rectangles, ellipses, and custom paths via YAML.

### ~~Expressions~~
**Status:** Done
Link properties with AE expressions via `expressions` object on transform and effects.

### ~~3D camera/lights~~
**Status:** Done
Create camera and light layers with full property support.

### Masks/paths
Add masks to layers with animatable paths.

### Audio layers
Create standalone audio layers (not just imported files).

### ~~Separate position dimensions~~
**Status:** Done
Keyframe X and Y position independently via `positionX` and `positionY`.

### Text animators
Per-character animation via text animators.

---

## Completed

_(Items move here when done)_
