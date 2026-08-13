# 道法谱设计还原验收

- Source visual truth: `/Users/xmly/.codex/generated_images/019ff0ce-c640-76b1-afa0-e07ae65b7c51/exec-f36f8ce4-3db3-4cb4-b131-8f43f2bd5254.png`
- Implementation screenshot: `/private/tmp/codex-selected-ring-final.png`
- Viewport: 390 × 844 CSS px, device scale factor 1
- Source pixels: 950 × 1655; implementation pixels: 390 × 844
- Normalization: both evaluated as full-height portrait compositions; source aspect ratio is wider, so implementation intentionally uses responsive column spacing and horizontal background crop rather than non-uniform scaling.
- State: “枯木逢春” selected, detail tier descriptions visible.

**Full-view comparison evidence**

- Information hierarchy matches the source: calligraphy title and two rule lines, three colored cultivation paths with nine techniques, one selected halo, integrated dark detail panel, and centered gold close button.
- The responsive implementation keeps all persistent controls visible at 390 × 844 and does not stretch circular paths, icons, selection halo, or button.
- The source's painted visual language is preserved using real sliced raster assets; dynamic text and existing relic icons remain runtime content.

**Focused region comparison evidence**

- Selection region: selected halo and diamond move with the chosen technique; tested from “御剑诀” to “踏云步”.
- Detail region: selected icon, name, path/effect, three tier rows, and one/two/three progress diamonds update together.
- Button region: “收起” remains centered inside the independent painted-gold backing.

**Required fidelity surfaces**

- Fonts and typography: display title uses an isolated calligraphy raster asset; runtime copy keeps clear hierarchy and does not clip at the tested viewport.
- Spacing and layout rhythm: three columns are centered and evenly distributed; detail panel width follows the safe viewport; persistent button remains visible.
- Colors and visual tokens: ochre/cyan/jade path colors, warm selected gold, rice-paper ink landscape, and pine-black detail surface align with the selected design.
- Image quality and asset fidelity: background, path ornaments, selected halo, detail frame, tier row, header swatches, title, and button are real generated/cut assets; no placeholder or code-drawn substitute is used for visible artwork.
- Copy and content: all nine techniques and dynamic three-tier descriptions preserve project configuration content.

**Comparison history**

- Iteration 1 finding (P2): excessive gap between the technique atlas and detail panel; selected detail title alignment drifted on narrow screens.
- Fix: moved the detail panel upward and corrected label centers based on content-box width.
- Post-fix evidence: `/private/tmp/codex-fixed-390x844.png`; detail hierarchy is contained and the full composition remains visible.
- Iteration 2 finding (P1): 565 × 965 browser viewport exposed horizontal/vertical scrollbars, shifting the Cocos effective viewport; path effect labels were too pale over rice paper and mountains.
- Fix: the Web Mobile build now enforces a non-scrolling viewport; title/rule/atlas vertical positions were rebalanced and path effect text uses darker ochre, teal, and jade tokens.
- Post-fix evidence: `/private/tmp/codex-fixed-390x844.png` plus browser verification at 565 × 965; both viewports report scroll dimensions equal to viewport dimensions.
- Iteration 3 finding (P1): tier diamonds were rendered behind their raster rows; small copy and the detail role color lost contrast after responsive scaling; detail heading and rows did not share an explicit text grid.
- Fix: moved tier marks into a foreground child, increased the rule/node/detail typography, introduced one detail text start line, and restored bright path colors only on the dark detail surface.
- Post-fix evidence: `/private/tmp/codex-alignment-final.png`; three column axes, nine node labels, detail rows, tier marks, and the close button share stable centers and remain readable.
- Iteration 4 finding (P1): the three-ring path rasters contain non-uniform ring spacing and asymmetric transparent margins, while interaction cells had been placed on one equal-spacing formula; the selected halo therefore missed the visible ring center, most noticeably on the first edge node.
- Fix: measured each visible ring center from the source raster, assigned per-path row centers and horizontal raster offsets, and placed the selected halo on the same cell origin.
- Post-fix evidence: `/private/tmp/codex-ring-alignment-fixed.png`; switched and visually verified the first selected node in all three paths, plus the second and third ring centers.
- Iteration 5 finding (P1): the selected halo still followed the icon-and-copy group center rather than the painted base-ring center, creating a visible double ring; the vitality slice also included unrelated pixels on its right edge and rendered smaller than the other paths.
- Fix: cropped the vitality path to its actual 210 px artwork width, resized the halo by its visible ring bounds, and offset only the halo downward while preserving icon and label positions.
- Post-fix evidence: `/private/tmp/codex-selected-ring-final.png`; the gold selected ring now covers the blue and green base rings without the former separated lower outline. Browser console has no errors or warnings.
- Iteration 6 finding (P1): close-up review showed that a separate generic halo could never match the three irregular painted path rings, and neighboring rings shared pixels around their connector joints.
- Fix: replaced the generic halo with nine path-specific selected raster segments derived from the exact source-ring pixels; each three-ring column is now composed from mutually exclusive segments, so the selected segment replaces rather than overlays its original ring. Disabled stale CDN path assets to keep base and selected states on the same local source.
- Post-fix evidence: `/private/tmp/codex-selected-ring-segments.png`; the selected edge ring follows its original contour and the former lower double-ring artifact is removed. Browser console has no errors or warnings.
- Iteration 7 finding (P1): unselected rings still competed with icons, while stretching a full-height transparent segment into the column produced an elongated selected outline.
- Fix: removed all persistent unselected rings and path connectors; the selected state is now an independent, node-bound concentric gold ring drawn at a fixed 1:1 ratio, with the diamond marker anchored to the same node origin.
- Post-fix evidence: `/private/tmp/codex-selection-circle-final.png`; verified the ring moves from 御剑诀 to 踏云步 without residue, double rings, or horizontal/vertical distortion.

**Interactions tested**

- Opened 道法谱 from the homepage.
- Switched selection across 锋芒、玄术、守元 paths, including 枯木逢春.
- Verified selected halo relocation and detail content update.
- Checked the rendered screen after a clean rebuild; no new runtime error was introduced by the codex interaction.

**Follow-up polish**

- P3: on screens wider than the reference composition, side mountain crop varies slightly by aspect ratio; this is expected cover behavior and does not affect content.

final result: passed
