# Design-Core TODO list

## Beta
### Paperspace

### Entity Editing

### Dimensions
- Linear dimension
- Angular Dimension
- Radial Dimension
- Diametric Dimension

### Text sizing
- Text size - need a non-hacky glyph-advance measuring API on each the renderer
- ArcAlignedText characterSpacing=0 overlap — Cairo's cap-height correction scales glyph advances wider than getApproximateWidth predicts;

### performance optimisation

#### 1. `LType.getPattern(scale)` — cache the scaled array (easy)
Called once per entity per frame. Currently allocates a new array every call via `.map()`.
A two-field cache (`#lastScale`, `#cachedPattern`) returns the existing array when scale hasn't changed.

- **Effort**: ~10 lines, isolated to `ltype.js`
- **Expected gain**: small but consistent; removes N allocations per frame where N = entity count

#### 2. State dedup in renderers — skip no-op `setColour`/`setLineWidth`/`setDash` calls (medium)
`setContext` is called unconditionally for every entity. For entities sharing colour and line width (the common case), the underlying Canvas/Cairo API calls are redundant.
Track the last-set value in each renderer and return early when unchanged.

- **Effort**: ~20 lines per renderer, self-contained
- **Expected gain**: meaningful for large scenes with many same-layer entities; could save 10–30% of state-setting overhead

#### 3. Skip `save()`/`restore()` for leaf entities (medium)
`#paintEntity` wraps every entity in `save()`/`restore()` even though only container entities (Insert, BaseDimension) actually change the transform. Requires an `entity.isContainer` flag or restructuring to save lazily.

- **Effort**: entity API change + `#paintEntity` refactor
- **Expected gain**: ~1 `save`/`restore` pair eliminated per leaf entity per frame; measurable at high entity counts

#### 4. Offscreen canvas for static scene (large, architectural)
The full scene repaints on every mouse move (hover detection, rubber band, cursor). Splitting into a static layer (repaint on data change only) and a dynamic overlay (hover, preview, selection) would eliminate most per-frame work.

- **Effort**: significant — touches `canvas.js`, rendering pipeline, and UI integration
- **Expected gain**: potentially 3–5× frame rate improvement during mouse movement over a complex scene

#### 5. Viewport culling — skip entities outside the visible area (medium, high impact when zoomed in)
Every entity already has `boundingBox()` and `canvas.getSceneOffset()` returns the visible scene rectangle.
A simple AABB overlap test in `#paintEntities` would skip entities outside the viewport before calling `#paintEntity`.

- **Effort**: ~10 lines in `#paintEntities`; call `getSceneOffset()` once per `paint()` and pass it in

- **Caveat — bounding box caching**: `Hatch.boundingBox()` and `Block.boundingBox()` iterate all child entities on every call. Per-frame culling cost could exceed draw cost for those types unless bboxes are cached on the entity and invalidated on edit. Simple entity types (Line, Circle, Arc) have trivial bbox cost and benefit immediately.

- **Caveat — Text**: `Text.boundingBox()` depends on `boundingRect` which is only populated after the first `draw()` call — needs a fallback to avoid incorrectly culling undrawn text.

- **Expected gain**: negligible when fully zoomed out; potentially 5–50× reduction in draw calls when working zoomed into a small area of a large drawing

### Test clean up
- Have the renderer changes provided any opportunity to clean up tests
- Is there opportunity for extended testing with the mock renderer


