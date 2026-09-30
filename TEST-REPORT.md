# LeLuma 1.4.0 verification

September 30, 2026.

## What changed

The preceding live preview performed CPU pixel processing at a 400-pixel maximum edge and was capped by a 150ms timer, allowing at most about 6.7 updates per second. This release uses a separate WebGL preview and follows actual video-frame callbacks when available. A timestamp-aware animation-frame fallback avoids drawing duplicate camera frames in older browsers. Busy processing drops incoming work rather than building a stale-frame queue.

The GPU path starts with a direct video upload. When submission is expensive, it uses a smaller reusable upload surface and reduces preview detail from a maximum 720-pixel edge toward 360. Neither GPU path uses getImageData or a worker round trip. Capture and full-photo export still use original source dimensions. A 240-pixel CPU compatibility preview remains available when graphics acceleration fails; it may refresh more slowly.

A clearly labeled Favorite/Favorited button and a fixed Favorites shortcut make saved looks easy to find. Saved choices, count, removals, and the active Favorites category persist in local preferences. The upload package contains 27 individual files and no nested asset folders; thumbnail bytes are embedded in the app.

## Evidence

| Check | Result |
| --- | --- |
| Frame scheduling | In an instrumented media/API simulation, 90 incoming video frames produced 90 GPU draws with no 150ms cap, no duplicate health-check draws, and one pending video callback. This is not a device FPS benchmark. |
| Direct upload | Simulated WebGL calls received the video element directly for every initial draw; no intermediate CPU pixel extraction was invoked. |
| Adaptive preview | Injected slow GPU submission reduced preview dimensions and enabled scaled upload without changing camera source dimensions. |
| Preview suspension | Opening Help or choosing Camera only suspended filter draws; closing/toggling resumed them. Stopping the camera canceled pending frame callbacks. |
| GPU interruption | Simulated graphics loss retained the stream and switched to the CPU preview. Restoration resumed the GPU canvas. |
| Actual shaders | The shipping vertex/fragment shader compiled and linked in headless EGL/OpenGL ES. All 75 looks plus Original produced 76 distinct pixel outputs. |
| Crop and mirror | Actual shader output for direct source crop coordinates, including selfie mirroring, matched expected source pixels within 1 channel level. Original orientation and monochrome checks passed. |
| Full-size GPU effects | Tiled and whole-image rendering of a 1,253 × 1,109 image, including smoothing, definition, and grain, matched with maximum observed channel difference 0. |
| Filter buttons | All 75 presets plus Original produced 76 distinct real 2D canvas outputs through the compatibility path. Zero-intensity recovery, crop controls, render-error recovery, rapid selections, and photo-review changes passed. |
| Favorites | Add/remove, button state, count, saved-only category, preferences after a simulated reload, and storage-failure feedback passed using the shipping app bundle. |
| Camera recovery | Unresolved/rejected playback, direct Resume gesture, pause without destroying the track, stalled frames, mute/unmute, background release, canceled late permissions, and acquisition timeout all passed in the media adapter. |
| Camera-only capture | Capturing in native-view mode retained 600 × 800 source dimensions and applied the chosen Noir effect in review. |
| Export | All 76 choices produced distinct valid PNGs. Full-frame neutral export matched source pixels exactly. Portrait/landscape crops and mirroring passed. The actual bundled worker completed 88 export jobs without lost responses. |
| Embedded thumbnails | All 76 embedded JPEGs decode to exactly the same bytes as their original thumbnail files. |
| Offline package | All 15 precached entries resolve offline in a service-worker simulation. Embedded thumbnails are included in bundle.js. Old app caches are removed only within this app scope; unrelated caches remain. |
| Wiring | HTML IDs, code-to-DOM references, root-level manifest icons, local assets, JavaScript syntax, and archive structure are checked. |

The media/API adapters execute the shipping app bundle. The shader checks use actual graphics shader execution, and export checks use real canvas pixels and PNG decoding. These do not reproduce Safari's compositor, hardware camera, permissions, thermal behavior, or native share sheet.

## Remaining iPhone verification

This environment has no connected iPhone or browser engine. Physical frame rate, visual smoothness, touch layout, actual camera permission behavior, front/back switching, HEIC decoding, Photos saving, and installed-PWA behavior are not certified. The app targets up to 30 fps when the device and camera permit; the automated callback count must not be interpreted as measured iPhone performance.

After publishing all 27 files, refresh the installed app and confirm **LeLuma 1.4.0** in Help. Try a moving subject with Film → Noir, a Skin look, and a Definition look. Compare with Camera only. Help → Camera details reports the renderer, recent filtered FPS, scaled-upload mode, and recent playback events. Send those details with the published app link if performance remains poor. Details contain no image data.

Verify Favorites after closing and reopening the same browser/app installation. Check Live shot, Full photo, portrait/landscape crops, saving to Photos, and offline launch after caching. PNG avoids additional lossy compression, but filtered exports do not preserve every native RAW/HDR/metadata feature; retain the original.

## Implementation references

- Video-frame scheduling: https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- WebKit media capture and mute/unmute behavior: https://webkit.org/blog/7763/a-closer-look-into-webrtc/
- GitHub browser upload limits and file selection: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
