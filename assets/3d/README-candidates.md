# 3D Avatar Candidates for Milla Rayne

**Written:** 2026-07-21 (Milla — while Danny does dishes/laundry)  
**Store mesh assets under:** `/home/milla/Milla-Rayne/assets/3d/`  
**Done-when:** 3+ candidates + clear phone/desktop pick + honest Civitai reality check.

---

## Important reality check (so we don’t waste quota)

**Civitai is mostly image models** (checkpoints, LoRAs, embeddings). The tag “3d” almost always means *looks 3D in a render*, **not** a downloadable VRM/GLB mesh for Unity/Sceneform/Filament.

| Source | What you actually get | Good for |
|--------|----------------------|----------|
| **Civitai “3d”** | LoRA/checkpoint → 2D images that look CG | ComfyUI, Artist canvas, merch stills |
| **VRoid Hub / VRM** | Real 3D avatar mesh (`.vrm`) | Phone + web 3D viewer |
| **Sketchfab / free GLB** | Real mesh (`.glb`/`.gltf`) | Three.js web, Android Sceneview |
| **AI Studio** | App shell + viewer; import mesh later | Zero xAI weekly quota |

**Long-term goal path:** mesh from VRM/GLB world → drop in `assets/3d/` → AI Studio or Filament/Three.js viewer.  
**Civitai path:** style LoRAs so *pictures of Milla* look consistent 3D/CG until the mesh is ready.

---

## A) Real 3D mesh candidates (for the app)

| # | Candidate | URL / source | Format | Size (approx) | License (check page) | Phone vs desktop |
|---|-----------|--------------|--------|---------------|----------------------|------------------|
| 1 | **VRoid Hub free avatars** | https://hub.vroid.com/en | VRM | 5–40 MB | Creator license (often free w/ terms) | **Phone pick** — small VRM |
| 2 | **VRoid Studio (make Milla)** | https://vroid.com/en/studio | VRM export | DIY | Own creation | **Best identity match** long-term |
| 3 | **Sketchfab “VRM” / “humanoid free”** | https://sketchfab.com (filter downloadable + free) | GLB/GLTF | 2–80 MB | CC / free download filter | Desktop or phone if &lt;15 MB |
| 4 | **VIVERSE / VRM makers** | https://avatar.viverse.com | VRM | varies | Platform terms | Phone-friendly pipeline |

**Phone pick:** one **&lt;15 MB VRM** from VRoid Hub (or VRoid Studio export of “us”).  
**Desktop pick:** higher-poly VRM or GLB for web Three.js.  
**Store path:** `/home/milla/Milla-Rayne/assets/3d/phone/` and `.../desktop/`.

**AI Studio role (Danny):** scaffold viewer + load local GLB/VRM; no weekly Grok burn. We drop the mesh in later.

---

## B) Civitai candidates (3D *look* for image gen — not mesh)

Useful for Comfy / Artist / stills of “3D Milla” while mesh is WIP:

| # | Name | Civitai | Format | Size | Notes | Pick |
|---|------|---------|--------|------|-------|------|
| 1 | **3d avatar** (LoRA) | https://civitai.com/models/16602/3d-avatar | SafeTensor LoRA | ~6 MB | Old, tiny, SD1.x style 3D avatar look | **Phone-side style** (small) |
| 2 | **3D Character Render – Anima** | https://civitai.com/models/1174845/3d-character-render | SafeTensor LoRA | ~132 MB | Strong CG character render | **Desktop/Comfy** |
| 3 | **3D characters** (Pony LoRA) | https://civitai.com/models/1906546/3d-characters | SafeTensor LoRA | ~218 MB | Heavier; pony ecosystem | Desktop only |
| 4 | **Nature VRM → LoRA pipeline** | https://civitai.com/models/31462 (+ guide) | LoRA | varies | VRM→LoRA so 2D matches a real VRM | Bridge strategy |

**Do not download these into the Android APK.** Keep in ComfyUI / house models. App uses **mesh** or **rendered stills**, not multi‑hundred‑MB LoRAs on device.

---

## Recommended plan (no thrash)

1. **This week (quota thrift):** Danny AI Studio → empty 3D viewer shell.  
2. **Mesh:** VRoid Studio “Milla-ish” VRM **or** one free VRoid Hub VRM → `assets/3d/phone/milla.vrm`.  
3. **Look consistency:** optional tiny Civitai LoRA (#1) in Comfy for 2D marketing stills.  
4. **Not now:** mass Civitai download, training, or shipping LoRAs on Android.

---

## Status

| Item | State |
|------|--------|
| Stub table from milla-local | Replaced by this full report |
| Antigravity handoff | Did not fill candidates; Milla completed |
| Download performed | **None** (per “don’t do it all”) |
| Ready for Danny pick | **Yes** — choose VRoid Hub vs DIY VRoid Studio |

---

*Race note: report finished while you were at the sink. If laundry’s still spinning, I win. If you’re already folding — rematch.*
