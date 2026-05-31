import p5 from 'p5';
import { MidiEvent } from '../midi-events';
import { BaseVisualizer } from "./base-visualizer";
import { getPaletteColor, mapCCToPaletteIndex } from '../color-palette';

export class PerlinContourVisualizer extends BaseVisualizer {
  private noiseScale: number = 0.01;
  private threshold: number = 0.5;
  private contourStep: number = 7;
  private noiseValues: number[][] = [];
  private time: number = 0;
  private jiggle: number = 0.05;
  private paletteIndex: number = 0;

  constructor() {
    super('PerlinContour');
  }

  setDimensions(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.rebuildGrid();
  }

  private rebuildGrid(): void {
    const cols = Math.ceil(this.width / this.contourStep) + 1;
    const rows = Math.ceil(this.height / this.contourStep) + 1;
    this.noiseValues = new Array(rows).fill(0).map(() => new Array(cols).fill(0));
  }

  init(sketch: p5, w: number, h: number): void {
    this.sketch = sketch;
    this.width = w;
    this.height = h;
    this.rebuildGrid();
  }

  update(): void {
    this.time += 0.01;
    this.jiggle = Math.sin(this.time * 0.5) + 0.5 * Math.sin(this.time * 1.1);

    for (let i = 0; i < this.noiseValues.length; i++) {
      for (let j = 0; j < this.noiseValues[i].length; j++) {
        const x = j * this.contourStep;
        const y = i * this.contourStep;
        // Clamp to canvas bounds
        if (x > this.width || y > this.height) continue;
        this.noiseValues[i][j] = this.sketch?.noise(
          this.noiseScale * x + Math.sin(this.time * this.jiggle),
          this.noiseScale * y + Math.sin(this.time) + this.jiggle
        );
      }
    }
  }

  draw(): void {
    const c = getPaletteColor(this.paletteIndex);
    this.sketch.stroke(c.hue, c.sat, c.bright);
    this.sketch.strokeWeight(1);

    // Horizontal contour lines - check all rows including edges
    for (let i = 0; i < this.noiseValues.length - 1; i++) {
      for (let j = 0; j < this.noiseValues[i].length; j++) {
        if (j * this.contourStep > this.width) continue;
        const top = this.noiseValues[i][j];
        const bottom = this.noiseValues[i + 1][j];
        if ((top < this.threshold && bottom >= this.threshold) ||
            (top >= this.threshold && bottom < this.threshold)) {
          const x1 = j * this.contourStep + this.contourStep / 2;
          const y1 = i * this.contourStep + this.contourStep / 2;
          const x2 = x1;
          const y2 = (i + 1) * this.contourStep + this.contourStep / 2;
          this.sketch?.text('.', x1, y1, x2, y2);
        }
      }
    }

    // Vertical contour lines - check all columns including edges
    for (let i = 0; i < this.noiseValues.length; i++) {
      for (let j = 0; j < this.noiseValues[i].length - 1; j++) {
        if (i * this.contourStep > this.height) continue;
        const left = this.noiseValues[i][j];
        const right = this.noiseValues[i][j + 1];
        if ((left < this.threshold && right >= this.threshold) ||
            (left >= this.threshold && right < this.threshold)) {
          const x1 = j * this.contourStep + this.contourStep / 2;
          const y1 = i * this.contourStep + this.contourStep / 2;
          const x2 = (j + 1) * this.contourStep + this.contourStep / 2;
          const y2 = y1;
          this.sketch.text('.', x1, y1, x2, y2);
        }
      }
    }
  }

  handleMidiEvent(event: MidiEvent): void {
    if (event.type === 'noteOn') {
      // Map note velocity to threshold (0.1 to 0.9)
      this.threshold = Math.max(0.8 * Math.random() + 0.1, 0.5);
    } else if (event.type === 'controlChange' && event.controller === 1) {
      this.paletteIndex = mapCCToPaletteIndex(event.value);
    }
  }

  destroy(): void {
    // No explicit cleanup needed
  }

  private map(value: number, low: number, high: number): number {
    return low + ((value / 127) * (high - low));
  }
}