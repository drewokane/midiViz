export interface NoteOnEvent {
  type: 'noteOn';
  noteNumber: number;
  velocity: number;
  x: number;
  y: number;
  size: number;
  channel: number;
}

export interface NoteOffEvent {
  type: 'noteOff';
  noteNumber: number;
  velocity: number;
  channel: number;
}

export interface ControlChangeEvent {
  type: 'controlChange';
  controller: number;
  value: number;
  channel: number;
}

export interface PitchBendEvent {
  type: 'pitchBend';
  value: number;
  channel: number;
}

export type MidiEvent = NoteOnEvent | NoteOffEvent | ControlChangeEvent | PitchBendEvent;