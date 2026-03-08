export class Neuron {
  constructor(id, module, type, params) {
    this.id = id;
    this.module = module;   // 'input'|'chemo'|'value'|'predator'|'shelter'|'motor'
    this.type = type;       // 'input'|'R'|'O'
    this.state = [];
    this.output = 0;
    this.params = params || {};
    this.position3D = { x: 0, y: 0, z: 0 };
  }
  step(inputs) { /* override in subclass */ }
}

export class NeuronR extends Neuron {
  constructor(id, module, params) {
    super(id, module, 'R', params);
    this.state = [0]; // [u]
  }
  step(inputs) {
    const { leak = 0.9, bias = 0.0 } = this.params;
    let u = leak * this.state[0] + inputs.reduce((s, v) => s + v, 0) + bias;
    this.state[0] = u;
    this.output = Math.tanh(u);
    if (!isFinite(this.output)) {
      console.warn(`NaN in NeuronR id=${this.id} — resetting`);
      this.state[0] = 0;
      this.output = 0;
    }
  }
}

export class NeuronO extends Neuron {
  constructor(id, module, params) {
    super(id, module, 'O', params);
    this.state = [0, 0]; // [u, v]
  }
  step(inputs) {
    const {
      omega = 2 * Math.PI / 6,
      decay = 0.97,
      coupling = 0.8
    } = this.params;
    const inputSum = inputs.reduce((s, v) => s + v, 0);
    const [u, v] = this.state;
    const cosW = Math.cos(omega), sinW = Math.sin(omega);
    const uNew = decay * (u * cosW - v * sinW) + coupling * inputSum;
    const vNew = decay * (u * sinW + v * cosW);
    this.state[0] = uNew;
    this.state[1] = vNew;
    this.output = Math.tanh(uNew);
    if (!isFinite(this.output)) {
      console.warn(`NaN in NeuronO id=${this.id} — resetting`);
      this.state = [0, 0];
      this.output = 0;
    }
  }
}
