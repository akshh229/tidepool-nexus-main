import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../utils/ringBuffer.js';
import { torusWrap, torusDist, clamp } from '../utils/math.js';
import { NeuronR, NeuronO } from '../sim/brain/neuron.js';
import { Network, buildDefaultBrain } from '../sim/brain/network.js';

describe('RingBuffer', () => {
  it('stores and retrieves values', () => {
    const rb = new RingBuffer(4);
    rb.push(10);
    rb.push(20);
    rb.push(30);
    expect(rb.get(0)).toBe(30);
    expect(rb.get(1)).toBe(20);
    expect(rb.get(2)).toBe(10);
  });

  it('wraps around correctly', () => {
    const rb = new RingBuffer(3);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    rb.push(4); // overwrites slot 0
    expect(rb.get(0)).toBe(4);
    expect(rb.get(1)).toBe(3);
    expect(rb.get(2)).toBe(2);
  });

  it('clamps stepsAgo to valid range', () => {
    const rb = new RingBuffer(4);
    rb.push(5);
    // should not throw for out-of-range stepsAgo
    expect(rb.get(-1)).toBe(rb.get(0));
    expect(rb.get(100)).toBe(rb.get(3));
  });

  it('toArray returns values in chronological order', () => {
    const rb = new RingBuffer(5);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    expect(rb.toArray()).toEqual([1, 2, 3]);
  });
});

describe('Math utils', () => {
  it('torusWrap wraps negative values', () => {
    expect(torusWrap(-5, 100)).toBe(95);
    expect(torusWrap(105, 100)).toBe(5);
    expect(torusWrap(50, 100)).toBe(50);
  });

  it('torusDist returns shortest distance on torus', () => {
    expect(torusDist(5, 95, 100)).toBe(10);
    expect(torusDist(10, 30, 100)).toBe(20);
  });

  it('clamp constrains values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('Neurons', () => {
  it('NeuronR produces finite output and recovers from NaN', () => {
    const nr = new NeuronR(0, 'chemo', { leak: 0.9, bias: 0 });
    nr.step([1.0]);
    expect(Number.isFinite(nr.output)).toBe(true);

    // Force NaN and verify recovery
    nr.state[0] = NaN;
    nr.step([0]);
    expect(Number.isFinite(nr.output)).toBe(true);
    expect(nr.output).toBe(0);
  });

  it('NeuronO produces finite output and recovers from NaN', () => {
    const no = new NeuronO(0, 'chemo', { omega: 1.0, decay: 0.97, coupling: 0.8 });
    no.step([1.0]);
    expect(Number.isFinite(no.output)).toBe(true);

    // Force NaN and verify recovery
    no.state = [NaN, NaN];
    no.step([0]);
    expect(Number.isFinite(no.output)).toBe(true);
    expect(no.output).toBe(0);
  });
});

describe('buildDefaultBrain', () => {
  it('creates expected neuron and connection counts', () => {
    const net = new Network();
    buildDefaultBrain(net);
    // Should have 30 input neurons + processing neurons (around 500 total due to cap)
    expect(net.inputNeuronIds.length).toBe(30);
    expect(net.neurons.length).toBeGreaterThan(30);
    expect(net.neurons.length).toBeLessThanOrEqual(500);
    expect(net.connections.length).toBeGreaterThan(0);
    expect(net.connections.length).toBeLessThanOrEqual(10000);
  });

  it('has all required output neurons', () => {
    const net = new Network();
    buildDefaultBrain(net);
    expect(net.outputIds.thrust).toBeDefined();
    expect(net.outputIds.turnRate).toBeDefined();
    expect(net.outputIds.eat).toBeDefined();
  });

  it('getSnapshot returns valid structure', () => {
    const net = new Network();
    buildDefaultBrain(net);
    const snap = net.getSnapshot();
    expect(snap.neurons.length).toBe(net.neurons.length);
    expect(snap.moduleNeuronCounts).toBeDefined();
    expect(typeof snap.activityThisStep).toBe('number');
  });
});
