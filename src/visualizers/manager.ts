import p5 from 'p5';
import { MidiEvent } from '../midi-events';
import { BaseVisualizer } from './base-visualizer';

export type VisualizerChangeCallback = (visualizers: BaseVisualizer[]) => void;

export class VisualizerManager {
  private visualizers: BaseVisualizer[] = [];
  private sketch: p5 | p5.Graphics | null = null;
  private width: number = 800;
  private height: number = 600;
  private changeCallbacks: VisualizerChangeCallback[] = [];

  constructor() {}

  setSketch(sketch: p5 | p5.Graphics): void {
    this.sketch = sketch;
    this.visualizers.forEach(v => v.init(sketch, this.width, this.height));
  }

  reinit(sketch: p5, width: number, height: number): void {
    this.destroy();
    this.sketch = sketch;
    this.width = width;
    this.height = height;
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.visualizers.forEach(v => v.setDimensions(width, height));
  }

  addVisualizer(visualizer: BaseVisualizer): void {
    this.visualizers.push(visualizer);
    if (this.sketch) {
      visualizer.init(this.sketch, this.width, this.height);
    }
    this.notifyChange();
  }

  removeVisualizer(visualizer: BaseVisualizer): void {
    const index = this.visualizers.indexOf(visualizer);
    if (index !== -1) {
      visualizer.destroy();
      this.visualizers.splice(index, 1);
      this.notifyChange();
    }
  }

  getVisualizers(): BaseVisualizer[] {
    return [...this.visualizers];
  }

  reorderVisualizers(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.visualizers.length) return;
    if (toIndex < 0 || toIndex >= this.visualizers.length) return;

    const [removed] = this.visualizers.splice(fromIndex, 1);
    this.visualizers.splice(toIndex, 0, removed);
    this.notifyChange();
  }

  toggleVisualizer(index: number): void {
    if (index >= 0 && index < this.visualizers.length) {
      const viz = this.visualizers[index];
      viz.setEnabled(!viz.isEnabled());
      this.notifyChange();
    }
  }

  setVisualizerEnabled(index: number, enabled: boolean): void {
    if (index >= 0 && index < this.visualizers.length) {
      this.visualizers[index].setEnabled(enabled);
      this.notifyChange();
    }
  }

  draw(): void {
    this.visualizers.forEach(v => {
      if (v.isEnabled()) {
        v.draw();
      }
    });
  }

  update(): void {
    this.visualizers.forEach(v => {
      if (v.isEnabled()) {
        v.update();
      }
    });
  }

  handleMidiEvent(event: MidiEvent): void {
    this.visualizers.forEach(v => {
      if (v.isEnabled()) {
        // Check if visualizer should handle this channel
        if ('channel' in event && !v.shouldHandleChannel(event.channel)) {
          return; // Skip this visualizer
        }
        v.handleMidiEvent(event);
      }
    });
  }

  destroy(): void {
    this.visualizers.forEach(v => v.destroy());
    this.visualizers = [];
  }

  onVisualizersChange(callback: VisualizerChangeCallback): void {
    this.changeCallbacks.push(callback);
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach(cb => cb(this.getVisualizers()));
  }
}