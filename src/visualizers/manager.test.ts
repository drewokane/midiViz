import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualizerManager } from './manager';
import { BaseVisualizer } from './base-visualizer';
import { MidiEvent } from '../midi-events';
import p5 from 'p5';

const mockP5Instance = {
  setup: vi.fn(),
  draw: vi.fn(),
  background: vi.fn(),
  createCanvas: vi.fn(),
  resizeCanvas: vi.fn(),
  remove: vi.fn(),
  colorMode: vi.fn(),
  noStroke: vi.fn(),
  fill: vi.fn(),
  ellipse: vi.fn(),
  line: vi.fn(),
  stroke: vi.fn(),
  noFill: vi.fn(),
  width: 800,
  height: 600,
  drawingContext: {
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  },
} as unknown as p5;

class MockVisualizer extends BaseVisualizer {
  public initCalled = false;
  public updateCalled = false;
  public drawCalled = false;
  public destroyCalled = false;
  public lastEvent: MidiEvent | null = null;
  public mockDimensions = { width: 800, height: 600 };
  public setDimensionsCalled = false;

  constructor(name: string) {
    super(name);
  }

  init(sketch: p5, width: number, height: number): void {
    this.initCalled = true;
    this.mockDimensions = { width, height };
  }

  handleMidiEvent(event: MidiEvent): void {
    this.lastEvent = event;
  }

  draw(): void {
    this.drawCalled = true;
  }

  update(): void {
    this.updateCalled = true;
  }

  destroy(): void {
    this.destroyCalled = true;
  }

  setDimensions(width: number, height: number): void {
    this.setDimensionsCalled = true;
    this.mockDimensions = { width, height };
    super.setDimensions(width, height);
  }
}

describe('VisualizerManager', () => {
  let manager: VisualizerManager;

  beforeEach(() => {
    manager = new VisualizerManager();
    vi.clearAllMocks();
  });

  describe('Adding and Removing Visualizers', () => {
    it('starts with no visualizers', () => {
      expect(manager.getVisualizers()).toHaveLength(0);
    });

    it('adds a visualizer', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);
      expect(manager.getVisualizers()).toHaveLength(1);
      expect(manager.getVisualizers()[0].getName()).toBe('Test Viz');
    });

    it('removes a visualizer', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);
      manager.removeVisualizer(viz);
      expect(manager.getVisualizers()).toHaveLength(0);
      expect(viz.destroyCalled).toBe(true);
    });

    it('initializes visualizer when sketch is set', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);
      manager.setSketch(mockP5Instance);
      expect(viz.initCalled).toBe(true);
    });
  });

  describe('Reordering', () => {
    it('reorders visualizers correctly', () => {
      const viz1 = new MockVisualizer('First');
      const viz2 = new MockVisualizer('Second');
      const viz3 = new MockVisualizer('Third');

      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);
      manager.addVisualizer(viz3);

      manager.reorderVisualizers(0, 2);

      const names = manager.getVisualizers().map(v => v.getName());
      expect(names).toEqual(['Second', 'Third', 'First']);
    });

    it('does nothing for invalid indices', () => {
      const viz1 = new MockVisualizer('First');
      const viz2 = new MockVisualizer('Second');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);

      manager.reorderVisualizers(-1, 1);
      manager.reorderVisualizers(0, 10);

      const names = manager.getVisualizers().map(v => v.getName());
      expect(names).toEqual(['First', 'Second']);
    });
  });

  describe('Enabling/Disabling', () => {
    it('toggles visualizer enabled state', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);
      expect(viz.isEnabled()).toBe(true);

      manager.toggleVisualizer(0);
      expect(viz.isEnabled()).toBe(false);

      manager.toggleVisualizer(0);
      expect(viz.isEnabled()).toBe(true);
    });

    it('sets visualizer enabled state directly', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);

      manager.setVisualizerEnabled(0, false);
      expect(viz.isEnabled()).toBe(false);

      manager.setVisualizerEnabled(0, true);
      expect(viz.isEnabled()).toBe(true);
    });

    it('ignores toggle for invalid index', () => {
      const viz = new MockVisualizer('Test Viz');
      manager.addVisualizer(viz);
      manager.toggleVisualizer(99);
      expect(viz.isEnabled()).toBe(true);
    });
  });

  describe('Draw and Update', () => {
    it('calls draw and update on enabled visualizers', () => {
      const viz1 = new MockVisualizer('Enabled');
      const viz2 = new MockVisualizer('Disabled');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);
      viz2.setEnabled(false);

      manager.draw();
      manager.update();

      expect(viz1.drawCalled).toBe(true);
      expect(viz1.updateCalled).toBe(true);
      expect(viz2.drawCalled).toBe(false);
      expect(viz2.updateCalled).toBe(false);
    });
  });

  describe('MIDI Event Routing', () => {
    it('routes MIDI events to enabled visualizers', () => {
      const viz1 = new MockVisualizer('Viz1');
      const viz2 = new MockVisualizer('Viz2');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);

      const event: MidiEvent = {
        type: 'noteOn',
        noteNumber: 60,
        velocity: 100,
        x: 0,
        y: 0,
        size: 50,
      };

      manager.handleMidiEvent(event);

      expect(viz1.lastEvent).toEqual(event);
      expect(viz2.lastEvent).toEqual(event);
    });

    it('does not route events to disabled visualizers', () => {
      const viz = new MockVisualizer('Disabled');
      manager.addVisualizer(viz);
      viz.setEnabled(false);

      const event: MidiEvent = {
        type: 'noteOn',
        noteNumber: 60,
        velocity: 100,
        x: 0,
        y: 0,
        size: 50,
      };

      manager.handleMidiEvent(event);
      expect(viz.lastEvent).toBeNull();
    });
  });

  describe('Dimensions', () => {
    it('updates dimensions on all visualizers', () => {
      const viz1 = new MockVisualizer('Viz1');
      const viz2 = new MockVisualizer('Viz2');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);
      manager.setSketch(mockP5Instance);

      manager.setDimensions(1920, 1080);

      expect(viz1.setDimensionsCalled).toBe(true);
      expect(viz2.setDimensionsCalled).toBe(true);
    });
  });

  describe('Change Callbacks', () => {
    it('notifies on visualizer changes', () => {
      let callCount = 0;
      manager.onVisualizersChange(() => callCount++);

      const viz1 = new MockVisualizer('Viz1');
      manager.addVisualizer(viz1);
      expect(callCount).toBe(1);

      manager.toggleVisualizer(0);
      expect(callCount).toBe(2);

      manager.reorderVisualizers(0, 0);
      expect(callCount).toBe(3);

      manager.removeVisualizer(viz1);
      expect(callCount).toBe(4);
    });
  });

  describe('Destroy', () => {
    it('destroys all visualizers', () => {
      const viz1 = new MockVisualizer('Viz1');
      const viz2 = new MockVisualizer('Viz2');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);

      manager.destroy();

      expect(viz1.destroyCalled).toBe(true);
      expect(viz2.destroyCalled).toBe(true);
      expect(manager.getVisualizers()).toHaveLength(0);
    });
  });
});