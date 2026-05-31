import p5 from 'p5';
import { BaseVisualizer } from './base-visualizer';
import { MidiEvent } from '../midi-events';
import { getPaletteColor, mapCCToPaletteIndex } from '../color-palette';

class Circle {
  x: number;
  y: number;
  size: number;
  maxLifetime: number = 100;
  lifetime: number = 100;
  hue: number = 200;

  constructor(x: number, y: number, size: number) {
    this.x = x;
    this.y = y;
    this.size = size;
  }

  construct(): void {
    this.lifetime = this.maxLifetime;
    this.size = this.size;
  }

  draw(p: p5, w: number, h: number, sat: number, bright: number): void {
    p.noStroke();
    const lifeRatio = this.lifetime / this.maxLifetime;
    const alpha = Math.pow(lifeRatio, 2) * 80;
    p.fill(this.hue, sat, bright, alpha);
    p.ellipse(this.x, this.y, this.size, this.size);
  }

  update(): boolean {
    this.lifetime -= 1;
    this.size *= 0.95;
    return this.lifetime > 0;
  }
}

export class CircleVisualizer extends BaseVisualizer {
  private circles: Circle[] = [];
  private paletteIndex: number = 0;
  private globalSaturation: number = 100;
  private globalBrightness: number = 100;

  constructor() {
    super('Circle');
  }

  init(sketch: p5, width: number, height: number): void {
    this.sketch = sketch;
    this.width = width;
    this.height = height;
  }

  handleMidiEvent(event: MidiEvent): void {
    switch (event.type) {
      case 'noteOn':
        this.createCircle(event.x, event.y, event.size);
        break;
      case 'controlChange':
        this.handleControlChange(event.controller, event.value);
        break;
    }
  }

  private createCircle(x: number, y: number, size: number): void {
    const circle = new Circle(x, y, size);
    circle.hue = getPaletteColor(this.paletteIndex).hue;
    this.circles.push(circle);
  }

  private handleControlChange(controller: number, value: number): void {
    switch (controller) {
      case 1:
        this.paletteIndex = mapCCToPaletteIndex(value);
        break;
      case 7:
        this.globalBrightness = (value / 127) * 100;
        break;
      case 10:
        this.globalSaturation = (value / 127) * 100;
        break;
    }
  }

  draw(): void {
    if (!this.sketch) return;

    this.circles.forEach(circle => {
      circle.draw(this.sketch!, this.width, this.height, this.globalSaturation, this.globalBrightness);
    });
  }

  update(): void {
    this.circles = this.circles.filter(circle => circle.update());
  }

  destroy(): void {
    this.circles = [];
  }

  getCircleCount(): number {
    return this.circles.length;
  }
}