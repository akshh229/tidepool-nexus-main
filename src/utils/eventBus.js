const listeners = {};
export const on = (e, cb) => { (listeners[e] = listeners[e] || []).push(cb); };
export const off = (e, cb) => { listeners[e] = (listeners[e] || []).filter(f => f !== cb); };
export const emit = (e, d) => (listeners[e] || []).forEach(cb => { try { cb(d); } catch (err) { console.error(`[eventBus] error in '${e}' listener:`, err); } });
