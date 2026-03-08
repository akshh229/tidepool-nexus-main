// simWorker.js — Stub for Web Worker offloading (Fix 9)
// This file exists so Vite doesn't error on dynamic worker imports.
// Full worker implementation is a stretch goal for timeScale > 3.
//
// When implemented, this worker would:
// 1. Import World, Network, buildDefaultBrain, Scorer
// 2. Run N simulation steps per message batch
// 3. Post back state snapshots for rendering on the main thread

self.onmessage = function (e) {
  // Placeholder — echoes back a no-op
  self.postMessage({ type: 'noop', data: e.data });
};
