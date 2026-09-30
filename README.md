# LeLuma 1.4.0

Private iPhone camera and photo editor with **75 filters plus Original**, offline installation, full-photo import, live capture, and PNG/JPEG export.

Open **START-HERE.html** for installation and update instructions. Upload the **contents** of this folder to the root of your existing GitHub Pages repository. Keep your existing repository URL if you want; the app is now called LeLuma.

## Changes in 1.4

- Live filters use a dedicated WebGL canvas and upload video directly, avoiding per-frame CPU pixel readback and worker round trips. The scheduler follows incoming camera frames, targeting up to 30 fps instead of the previous approximately 7 fps cap.
- Preview resolution adapts from a maximum 720-pixel edge down to 360 when GPU submission is expensive, and a smaller reusable upload surface reduces texture-transfer work. This changes preview detail only; capture/export retain source dimensions. The compatibility CPU preview uses a 240-pixel edge and may refresh more slowly.
- No stale-frame backlog: busy rendering skips incoming frames, and the next draw uses the current video. The UI only updates when labels or playback state change.
- Graphics interruption reveals the native camera and switches to compatibility filtering. Graphics restoration can resume acceleration. Existing Resume video and Restart camera controls remain available.
- A labeled **Favorite / Favorited** button saves any selected look. **Favorites** stays visible beside the scrolling categories and shows the saved count. Favorites, removals, and the selected Favorites category persist locally between visits.
- The download contains **27 individual files with no subfolders**. Thumbnails are embedded; app icons sit alongside index.html. You can use GitHub's file picker without dragging folders.

## Update an existing installation

1. Save any in-progress photo and unzip **LeLuma-iPhone.zip**.
2. Open the **LeLuma** folder. It contains 27 files, including index.html, bundle.js, and the icons. There are no icons or thumbnails subfolders to upload.
3. In your existing GitHub repository, select **Add file → Upload files → Choose your files**. Select all 27 files inside the unpacked LeLuma folder and commit the changes to the branch used by Pages. The files belong at the repository root; do not upload the ZIP itself.
4. Wait for GitHub Pages to finish publishing, then open the published HTTPS URL in iPhone Safari while online. Help should say **LeLuma 1.4.0**. If it does not, use **Help → Repair app / refresh installed version**, then refresh the app files.
5. The existing repository URL stays the same. Old icons/thumbnails folders already in the repository can remain; this version does not depend on them.
6. For a new Home Screen installation, use Safari → Share → Add to Home Screen and name it LeLuma. Open online once and wait for Offline ready.

GitHub's web uploader accepts up to 100 files at once. The previous 102-file package exceeded that limit if uploaded together; this package fits within it. Official instructions: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

## Favorites

Select a look, tap **★ Favorite**, and open **★ Favorites** to find it again. A filled star and **Favorited** label confirm the selection. Tap again to remove it. Favorites work offline and stay on the same device/browser installation while its website data remains. Clearing website data can remove them. The app reports if storage is unavailable instead of promising a permanent save.

## Camera recovery

Tap **Open camera** and allow access. The direct feed is labeled **Camera only · preparing look** until the first filtered frame appears. A completed live frame shows the filter name and **Live · look applied**.

If playback stops, use **Resume video**. Use **Show camera only** to check the direct feed, then **Show live filters** to return. **Restart camera** releases and reacquires the stream. If neither view works, copy **Help → Camera details**, along with the published app link, for diagnosis. This build has automated media-state and real-pixel tests, but has not been verified on a physical iPhone.

## Capture, framing, and quality

**Live shot** captures the camera feed at its returned dimensions, then keeps the edit adjustable. **Full photo** opens the iPhone's camera and applies the look after the photo is accepted. LeLuma's live effects are not visible inside the native camera sheet. You can also import an existing photo.

**Full frame** exports the entire image at its source dimensions. **Portrait** and **Landscape** retain source pixels within an exact 3:4 or 4:3 center crop; they do not rotate, stretch, or upscale the picture. For a landscape photo with the widest native field of view, use Full photo or import a landscape original. Unfiltered original export retains the entire input, regardless of framing.

PNG is the default and avoids additional lossy encoding. JPEG uses maximum quality. Filtered exports are standard 8-bit color images: original RAW, HDR, depth, Live Photo, wide-gamut processing, and metadata are not preserved. Keep the original for archival quality. Very large photos can exceed an iPhone's memory capacity; export failures do not silently substitute a smaller image.

Use **Save photo → Share / Save Image → Save Image** to save to Photos. The app cannot silently write to the camera roll. Current edits stay in memory; save before closing.

## Offline and privacy

Open online once and wait for **Offline ready**. Install using Safari → Share → Add to Home Screen. Camera, looks, and export work locally while cached assets remain available. iOS may remove website data; reopen online if needed. Photos stored only in iCloud must be downloaded first for offline import.

There are no accounts, analytics, third-party fonts, or photo uploads. Only static same-origin app files are fetched. The camera requests no audio and stops in the background. Repair removes only LeLuma/EvCam/Luma app caches and registration within the current scope, keeping saved Photos and local preferences.

## Development

No build is required to install the supplied package. After changing source files, run `python3 build.py` to rebuild `bundle.js`, `pixel-worker.bundle.js`, and the service worker's preset list. Bump the cache version when releasing changed assets.

- `filters.js`: 75 preset recipes, adjustment defaults.
- `pixels.js`: portable tone, skin-color softening, sharpness, local definition, and film effects.
- `renderer.js`: direct-video GPU preview, crop/mirror uniforms, portable fallback, and tiled full-size export.
- `framing.js`: integer source-pixel center-crop geometry.
- `app.js`: controls, camera lifecycle, render scheduling, import/capture, saving.
- `sw.js`, `manifest.webmanifest`: scoped offline cache and Home Screen identity.
- `repair.html`, `repair.js`: cache-refresh recovery.
- `demo.png`, `thumbnails.js`: local sample and embedded preset thumbnails.
- Root-level icon files: Home Screen and browser branding.

Use `python3 -m http.server 8000` for desktop localhost development. iPhone camera access requires the published HTTPS site; a local file preview is not a camera installation.

See `TEST-REPORT.md` for actual verification and the remaining real-iPhone limitations.
