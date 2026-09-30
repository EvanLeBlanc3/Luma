# LeLuma 1.3.0 verification

September 30, 2026.

## Scope and limits

This release addresses camera-display and playback failure paths found in the source. The exact cause on the user's phone remains unconfirmed: no published app URL, device diagnostic report, connected iPhone, or browser engine was available. The checks below run the shipping JavaScript with DOM/media adapters and real Skia canvas pixels. They do not reproduce Safari's permissions, compositor, or physical camera.

## Camera changes

The preceding release placed an opaque canvas over the native video even before a filter frame was ready. Its video pause listener also stopped and detached the stream immediately. LeLuma keeps the native video exposed until a current filtered frame commits, retains the stream across playback pauses, and separates media acquisition from play() completion.

Native playback has a direct-tap Resume button. Missing or stalled frames, muted tracks, and renderer failures expose recovery controls. Camera-only display is explicitly labeled; the selected filter still applies to the captured photo. Capture is disabled while the video has no usable current frame. Backgrounding releases the camera, and returning offers Resume camera.

The classic worker and local fallback still apply all filter operations. Live previews use a 400-pixel maximum working edge; capture and export use the source dimensions. Full-size export code and filter recipes are unchanged from 1.2.

## Checks

| Check | Evidence |
| --- | --- |
| Playback promise never resolves | The native surface remains exposed, the permission-pending state clears, and Flip and Import remain usable. |
| Playback rejects | The stream is retained. Resume invokes play() synchronously from the click handler and restores the filtered canvas when frames arrive. |
| Video pauses | An injected pause event does not stop the track. Resume recovers using the same stream. |
| Frames stop advancing | A controlled clock and constant video time trigger the stalled-frame message, hide the stale canvas, and block Live shot. New video timestamps recover the preview. |
| Track mute/unmute | Mute exposes recovery controls and prevents capture. Unmute restarts playback and rendering. |
| Filter rendering fails | An injected renderer exception reveals native video with the Camera-only label. Retry restores the selected look. |
| Camera-only mode | Switching mode hides the canvas. New filter selections keep native video visible. Switching back renders the selected look. |
| Native framing | Portrait/Landscape crop dimensions are applied to the native video container; filtered output retains the corresponding aspect ratio. |
| Background and return | Simulated visibility changes stop tracks in the background and allow reacquisition from Resume camera. |
| Permission cancellation | A stream returned after Cancel is stopped and cannot attach. |
| Permission timeout | Advancing the acquisition deadline clears pending state and restores the Open button. |
| Camera-only capture | The source retains the camera's 600 × 800 test dimensions. The selected Noir filter is applied to review pixels. |
| Every filter button | All 75 presets plus Original produce 76 distinct pixel outputs on the actual output canvas using a simulated, advancing camera source. Selecting a preset restores 100% intensity. |
| Filter consistency | Noir produces equal RGB channels. Portrait/Landscape controls change composition, rapid selections commit the latest revision, and captured-photo review remains editable. |
| Every exported filter | All 76 choices export distinct valid PNG images at the test input dimensions. |
| Full-size export | A neutral 1,253 × 1,109 PNG decodes at the same dimensions and matches source pixels exactly. |
| Exact crop export | An 831 × 1,108 portrait crop and a 1,252 × 939 landscape crop match the corresponding original source pixels. Mirroring also passes. |
| Worker delivery | The actual classic worker script completes 88 export jobs through a worker-thread adapter with no lost responses. |
| Offline update | All 91 precached entries resolve without a network request in a service-worker simulation. Legacy EvCam/Luma caches in this app's scope are removed; unrelated caches remain. |
| Package wiring | HTML IDs, code-to-DOM references, local assets, manifest icons, bundle syntax, and ZIP contents are checked. |

## Real-iPhone verification still needed

1. Upload all package contents, wait for deployment, and confirm **Help → LeLuma 1.3.0** in Safari. Refresh the installed app cache if the old version remains.
2. Tap Open camera and allow access. Verify a moving front-camera feed, then switch to the rear camera.
3. Try **Show camera only**, then **Show live filters**. Film → Noir at 100% should turn the filtered preview black and white.
4. Background and reopen the app, then tap Resume camera. Rotate back upright if the orientation guard is visible.
5. Take Live shot and Full photo images; verify the chosen crop, effects, pixel dimensions, and Save Image behavior in Photos.
6. Check the Home Screen installation and offline camera launch after all assets are cached.
7. If preview still fails, copy **Help → Camera details** and provide the published app URL. The details contain playback state and events, not image data.

Safari layout, actual camera permissions and frames, front/back switching, phone performance, HEIC decoding, iOS share-sheet saving, and installed-PWA behavior remain unverified on hardware. A dark scene alone is not treated as a failed camera; the app monitors playback state and frame advancement rather than assuming dark pixels indicate an error.

## Implementation references

- Apple's video guidance recommends a play button for one-way WebRTC experiences: https://developer.apple.com/documentation/webkit/delivering-video-content-for-safari
- WebKit documents media-track mute/unmute events when capture is paused or another tab takes capture access: https://webkit.org/blog/7763/a-closer-look-into-webrtc/

Skin softening uses skin-like colors and may affect similarly colored objects. Definition enhances existing contrast and texture; it does not reshape anatomy. Full frame preserves source dimensions; Portrait/Landscape deliberately crop. Maximum export size depends on device memory, and filtered copies do not retain all native RAW/HDR/metadata features.
