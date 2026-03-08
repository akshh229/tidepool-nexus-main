export class RingBuffer {
  constructor(size) {
    this.size = size;
    this.buf = new Float32Array(size);
    this.head = 0;
  }
  push(val) {
    this.buf[this.head % this.size] = val;
    this.head++;
  }
  get(stepsAgo) {
    return this.buf[((this.head - 1 - stepsAgo) % this.size + this.size) % this.size];
  }
  toArray() {
    const arr = [];
    const count = Math.min(this.head, this.size);
    for (let i = 0; i < count; i++)
      arr.push(this.get(count - 1 - i));
    return arr;
  }
}
