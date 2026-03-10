export class RingBuffer {
  constructor(size) {
    this.size = Math.max(1, Math.floor(size));
    this.buf = new Float32Array(this.size);
    this.head = 0;
  }
  push(val) {
    this.buf[this.head % this.size] = val;
    this.head++;
  }
  get(stepsAgo) {
    const clamped = Math.min(Math.max(0, stepsAgo), this.size - 1);
    return this.buf[((this.head - 1 - clamped) % this.size + this.size) % this.size];
  }
  toArray() {
    const arr = [];
    const count = Math.min(this.head, this.size);
    for (let i = 0; i < count; i++)
      arr.push(this.get(count - 1 - i));
    return arr;
  }
}
