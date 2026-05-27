import p5 from 'p5';
import { MidiEvent } from '../midi-events';

class Band {
    x: number;
    yUpper: number;
    yLower: number;

    constructor(x: number, yUpper: number, yLower: number) {
        this.x = x;
        this.yUpper = yUpper;
        this.yLower = yLower;
    }

}

export class DataWaveVisualizer extends BaseVisualizer {
    private bands: Band[];
    private numBands: number = 10;

  constructor() {
    super('DataWaveVisualizer')
  }

  init(sketch: p5 | p5.Graphics, width: number, height: number): void {
    this.sketch = sketch;
    this.width = width;
    this.height = height;

    for (let i = 0; i < this.numBands; i++) {
        
    }
  }
  abstract handleMidiEvent(event: MidiEvent): void;
  abstract draw(): void {

  }; //draws the stuff to canvas, every frame
  abstract update(): void; //updates the drawing (physics, movemnet, etc), every frame
  abstract destroy(): void;
}