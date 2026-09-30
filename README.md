# LeLuma 1.3.0

Private iPhone camera and photo editor with **75 filters plus Original**, offline installation, full-photo import, live capture, and PNG/JPEG export.

Open **START-HERE.html** for installation and update instructions. Upload the **contents** of this folder to the root of your existing GitHub Pages repository. Keep your existing repository URL if you want; the app is now called LeLuma.

## Changes in 1.3

- The native camera is visible as soon as its stream is attached. An empty filter canvas no longer covers it. The canvas appears only after a current filtered frame finishes rendering.
- Playback is independent from camera acquisition. An unresolved or rejected `play()` call cannot leave camera buttons disabled. **Resume video** calls playback directly from a fresh tap.
- A video pause no longer destroys the camera stream. Muted tracks and stalled frames display recovery controls and prevent a stale live capture. Backgrounding still releases the camera.
- **Show camera only** displays the direct feed with the chosen crop and selfie mirroring. Its label explains that filters apply after capture. **Show live filters** restores the filtered canvas; failures reveal the native video with a Retry control.
- Help includes copyable **Camera details** for checking an actual iPhone. The report contains playback status and recent events, never image data.
- The name, manifest, exported filenames, installation guide, and offline cache now use **LeLuma**. Existing EvCam/Luma preferences and favorites migrate locally.

All 75 looks plus Original, skin softening, local Definition, Portrait 3:4 / Landscape 4:3 framing, and full-size export remain available. Live processing uses a smaller working preview to reduce device load; capture and export still use the full source dimensions.

## Update an existing installation

1. Save any in-progress photo.
2. Upload **all** files and folders from this package to the existing repository root, including `thumbnails/`, `icons/`, `bundle.js`, `pixel-worker.bundle.js`, `sw.js`, and `index.html`.
3. Wait for GitHub Pages to finish publishing.
4. Open the published HTTPS URL in Safari while online. Wait a few seconds and reload. Help should say **LeLuma 1.3.0**.
5. If cached files persist, use **Help → Repair app → Refresh LeLuma**.
6. To use the new Home Screen name, add the updated site to the Home Screen from Safari and name it **LeLuma**. The existing GitHub URL does not have to change.

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
- `renderer.js`: visible 2D renderer, worker/local fallback, optional GPU export, tiled full-size export.
- `framing.js`: integer source-pixel center-crop geometry.
- `app.js`: controls, camera lifecycle, render scheduling, import/capture, saving.
- `sw.js`, `manifest.webmanifest`: scoped offline cache and Home Screen identity.
- `repair.html`, `repair.js`: cache-refresh recovery.
- `demo.png`, `thumbnails/`: local sample and static preset thumbnails.

Use `python3 -m http.server 8000` for desktop localhost development. iPhone camera access requires the published HTTPS site; a local file preview is not a camera installation.

See `TEST-REPORT.md` for actual verification and the remaining real-iPhone limitations.
