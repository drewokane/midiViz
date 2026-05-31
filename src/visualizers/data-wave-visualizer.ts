import p5 from 'p5';
import { BaseVisualizer } from './base-visualizer';
import { MidiEvent } from '../midi-events';
import { getPaletteColor, mapCCToPaletteIndex, NUM_COLORS } from '../color-palette';

function sumSines4(amp: number): (t: number) => number {
  const alphas = Array.from({ length: 4 }, () => 5 * Math.random());
  const phis = Array.from({ length: 4 }, () => 10 * Math.random());
  const params = Array.from({ length: 4 }, () => 2 * Math.random());

  return (t: number): number => {
    let result = 0;
    for (let i = 0; i < 4; i++) {
      result += params[i] * Math.sin(alphas[i] * t + phis[i]);
    }
    return amp * result;
  };
}

class Band {
  x: number;
  yUpper: number;
  yBaseUpper: number;
  yLower: number;
  yBaseLower: number;
  fUpper: (t: number) => number = sumSines4(10);
  fLower: (t: number) => number = sumSines4(11);

  constructor(x: number, yUpper: number, yLower: number) {
    this.x = x;
    this.yUpper = yUpper;
    this.yBaseUpper = yUpper;
    this.yLower = yLower;
    this.yBaseLower = yLower;
  }

  update(t: number): void {
    this.yUpper = this.yBaseUpper + this.fUpper(t);
    this.yLower = this.yBaseLower + this.fLower(t);
  }

  triggerBounce(h: number): void {
    this.yBaseLower = h * (0.05 + Math.random() * 0.3);
    this.yBaseUpper = Math.min(
      this.yBaseLower + h * (0.1 + Math.random() * 0.5),
      h * 0.95
    );
  }
}

class Wave {
  bands: Band[] = [];
  accumTime: number = 0;
  color: { hue: number; sat: number; bright: number };
  numBands: number;
  xWidth: number;
  private height: number;

  constructor(numBands: number, width: number, height: number, color: { hue: number; sat: number; bright: number }) {
    this.numBands = numBands;
    this.xWidth = width / numBands;
    this.height = height;
    this.color = color;

    for (let i = 0; i < numBands; i++) {
      const low = height * (0.05 + Math.random() * 0.3);
      const high = Math.min(
        low + height * (0.1 + Math.random() * 0.5),
        height * 0.95
      );
      const band = new Band(i * this.xWidth, low, high);
      this.bands.push(band);
    }
  }

  update(timeInc: number): void {
    this.accumTime += timeInc;
    for (const b of this.bands) {
      b.update(this.accumTime);
    }
  }

  draw(g: p5.Graphics): void {
    g.noStroke();
    g.fill(this.color.hue, this.color.sat, this.color.bright, 80);

    g.curveTightness(0.5);

    g.beginShape();
    g.vertex(0, this.height / 2);

    for (const b of this.bands) {
      g.curveVertex(b.x, b.yUpper);
    }

    g.curveVertex(this.xWidth * this.numBands, this.height / 2);

    for (let i = this.bands.length - 1; i >= 0; i--) {
      g.curveVertex(this.bands[i].x, this.bands[i].yLower);
    }

    g.endShape(g.CLOSE);
  }

  triggerBounce(): void {
    const index = Math.floor(Math.random() * this.bands.length);
    const band = this.bands[index];
    if (band) {
      band.triggerBounce(this.height);
    }
  }
}

export class DataWaveVisualizer extends BaseVisualizer {
  private static readonly DEFAULT_NUM_WAVES = 3;
  private static readonly DEFAULT_NUM_BANDS = 40;
  private static readonly TIME_INCREMENT = 0.01;

  private waves: Wave[] = [];
  private paletteIndex: number = 0;
  private currentWaveIndex: number = 0;
  private numWaves: number;

  constructor(numWaves: number = DataWaveVisualizer.DEFAULT_NUM_WAVES) {
    super('DataWaveVisualizer');
    this.numWaves = numWaves;
  }

  init(sketch: p5 | p5.Graphics, width: number, height: number): void {
    this.sketch = sketch;
    this.width = width;
    this.height = height;
    this.currentWaveIndex = 0;

    this.waves = [];
    for (let i = 0; i < this.numWaves; i++) {
      const colorIdx = (this.paletteIndex + i) % NUM_COLORS;
      const wave = new Wave(
        DataWaveVisualizer.DEFAULT_NUM_BANDS,
        width,
        height,
        getPaletteColor(colorIdx)
      );
      this.waves.push(wave);
    }
  }

  handleMidiEvent(event: MidiEvent): void {
    switch (event.type) {
      case 'noteOn':
        const wave = this.waves[this.currentWaveIndex];
        if (wave) {
          wave.triggerBounce();
        }
        this.currentWaveIndex = (this.currentWaveIndex + 1) % this.numWaves;
        break;
      case 'controlChange':
        if (event.controller === 1) {
          this.paletteIndex = mapCCToPaletteIndex(event.value);
          this.waves.forEach((w, i) => {
            const colorIdx = (this.paletteIndex + i) % NUM_COLORS;
            w.color = getPaletteColor(colorIdx);
          });
        }
        break;
    }
  }

  draw(): void {
    const g = this.sketch as p5.Graphics;
    if (!g) return;

    for (const wave of this.waves) {
      wave.draw(g);
    }
  }

  update(): void {
    for (const wave of this.waves) {
      wave.update(DataWaveVisualizer.TIME_INCREMENT);
    }
  }

  destroy(): void {
    this.waves = [];
  }
}
