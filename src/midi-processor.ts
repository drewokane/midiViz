import { MidiEvent } from './midi-events';

export class MidiProcessor {
  private width: number = 800;
  private height: number = 600;
  
  public hue: number = 0;
  public saturation: number = 100;
  public brightness: number = 100;
  public size: number = 50;
  
  private eventCallback: ((event: MidiEvent) => void) | null = null;
  
  constructor() {}
  
  public setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  
  public onMidiEvent(callback: (event: MidiEvent) => void): void {
    this.eventCallback = callback;
  }
  
  public processMidiMessage(message: Uint8Array): void {
    if (message.length < 3 || !this.eventCallback) return;
    
    const [status, data1, data2] = message;
    const command = status & 0xf0;
    const channel = status & 0x0f; // Extract MIDI channel (0-15)
    
    switch (command) {
      case 0x90:
        this.handleNoteOn(data1, data2, channel);
        break;
      case 0x80:
        this.handleNoteOff(data1, data2, channel);
        break;
      case 0xb0:
        this.handleControlChange(data1, data2, channel);
        break;
      case 0xe0:
        this.handlePitchBend(data1, data2, channel);
        break;
    }
  }
  
  private handleNoteOn(noteNumber: number, velocity: number, channel: number): void {
    if (velocity > 0 && this.eventCallback) {
      const x = this.mapValue(noteNumber, 0, 127, 0, this.width);
      const y = this.mapValue(Math.random() * 127, 0, 127, 0, this.height);
      const size = this.mapValue(velocity, 0, 127, 10, 200, true);
      
      this.hue = (this.hue + 10) % 360;
      
      this.eventCallback({
        type: 'noteOn',
        noteNumber,
        velocity,
        x,
        y,
        size,
        channel
      });
    } else {
      this.handleNoteOff(noteNumber, 0, channel);
    }
  }
  
  private handleNoteOff(noteNumber: number, velocity: number, channel: number): void {
    if (this.eventCallback) {
      this.eventCallback({
        type: 'noteOff',
        noteNumber,
        velocity,
        channel
      });
    }
  }
  
  private handleControlChange(controller: number, value: number, channel: number): void {
    if (!this.eventCallback) return;
    
    switch (controller) {
      case 1:
        this.hue = this.mapValue(value, 0, 127, 0, 360, true);
        break;
      case 7:
        this.brightness = this.mapValue(value, 0, 127, 0, 100, true);
        break;
      case 10:
        this.saturation = this.mapValue(value, 0, 127, 0, 100, true);
        break;
      case 11:
        const sizeMod = this.mapValue(value, 0, 127, 0.5, 2, true);
        this.size = Math.max(10, this.size * sizeMod);
        break;
    }
    
    this.eventCallback({
      type: 'controlChange',
      controller,
      value,
      channel
    });
  }
  
  private handlePitchBend(data1: number, data2: number, channel: number): void {
    if (!this.eventCallback) return;
    
    const bendValue = (data2 << 7) | data1;
    const normalizedBend = (bendValue - 8192) / 8192;
    
    this.eventCallback({
      type: 'pitchBend',
      value: normalizedBend,
      channel
    });
  }
  
  private mapValue(
    value: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number,
    withinBounds: boolean = false
  ): number {
    const newval = ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
    if (!withinBounds) {
      return newval;
    }
    if (start2 < stop2) {
      return Math.max(start2, Math.min(newval, stop2));
    } else {
      return Math.min(start2, Math.max(newval, stop2));
    }
  }
}