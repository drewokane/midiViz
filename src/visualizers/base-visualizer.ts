import p5 from 'p5';
import { MidiEvent } from '../midi-events';

export abstract class BaseVisualizer {
  name: string;
  enabled: boolean;
  protected sketch: p5 | p5.Graphics | null = null;
  protected width: number = 800;
  protected height: number = 600;
  public midiChannels: number[] = []; // Empty array = listen to all channels

  constructor(name: string, channels: number[] = []) {
    this.name = name;
    this.setMidiChannels(channels)
    this.enabled = false;
  }

  abstract init(sketch: p5 | p5.Graphics, width: number, height: number): void;
  abstract handleMidiEvent(event: MidiEvent): void;
  abstract draw(): void; //draws the stuff to canvas, every frame
  abstract update(): void; //updates the drawing (physics, movemnet, etc), every frame
  abstract destroy(): void;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getName(): string {
    return this.name;
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  setMidiChannels(channels: number[]): void {
    this.midiChannels = channels;
  }

  getMidiChannels(): number[] {
    return this.midiChannels;
  }

  shouldHandleChannel(channel: number): boolean {
    // Empty array means listen to all channels
    if (this.midiChannels.length === 0) return true;
    return this.midiChannels.includes(channel);
  }
}