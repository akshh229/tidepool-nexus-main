export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;
export const torusWrap = (v, s) => ((v % s) + s) % s;
export const torusDist = (a, b, s) => { const d = Math.abs(a - b); return d > s / 2 ? s - d : d; };
export const torusVec2 = (from, to, s) => ({
  x: torusWrap(to.x - from.x + s / 2, s) - s / 2,
  y: torusWrap(to.y - from.y + s / 2, s) - s / 2
});
export const vec2Len = v => Math.sqrt(v.x * v.x + v.y * v.y);
export const vec2Norm = v => { const l = vec2Len(v) || 1; return { x: v.x / l, y: v.y / l }; };
export const gaussNoise = sigma => {
  const u = 1 - Math.random(), v = Math.random();
  return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
