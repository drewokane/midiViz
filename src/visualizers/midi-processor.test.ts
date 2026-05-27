import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MidiProcessor } from '../midi-processor';
import { MidiEvent, NoteOnEvent, NoteOffEvent, ControlChangeEvent, PitchBendEvent } from '../midi-events';

describe('MidiProcessor', () => {
  let processor: MidiProcessor;
  let events: MidiEvent[];

  beforeEach(() => {
    events = [];
    processor = new MidiProcessor();
    processor.setDimensions(800, 600);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Note On Events', () => {
    it('emits noteOn event with correct properties when velocity > 0', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([0x90, 60, 100]));

       expect(events.length).toBe(1);
       expect(events[0].type).toBe('noteOn');
       expect((events[0] as NoteOnEvent).noteNumber).toBe(60);
       expect((events[0] as NoteOnEvent).velocity).toBe(100);
    });

    it('maps note number to x coordinate within canvas width', () => {
      processor.onMidiEvent(e => events.push(e));

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      processor.processMidiMessage(new Uint8Array([0x90, 0, 100]));

      expect((events[0] as any).x).toBe(0);
    });

    it('maps velocity to size within expected range', () => {
      processor.onMidiEvent(e => events.push(e));

      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      processor.processMidiMessage(new Uint8Array([0x90, 60, 127]));

      expect((events[0] as any).size).toBeGreaterThanOrEqual(10);
      expect((events[0] as any).size).toBeLessThanOrEqual(200);
    });

     it('emits noteOff event when velocity is 0', () => {
       processor.onMidiEvent(e => events.push(e));
       processor.processMidiMessage(new Uint8Array([0x90, 60, 0]));

       expect(events.length).toBe(1);
       expect(events[0].type).toBe('noteOff');
       expect((events[0] as NoteOffEvent).noteNumber).toBe(60);
     });

    it('ignores note on when no callback is registered', () => {
      processor.processMidiMessage(new Uint8Array([0x90, 60, 100]));
      expect(events.length).toBe(0);
    });
  });

  describe('Note Off Events', () => {
     it('emits noteOff event with correct properties', () => {
       processor.onMidiEvent(e => events.push(e));
       processor.processMidiMessage(new Uint8Array([0x80, 60, 64]));

       expect(events.length).toBe(1);
       expect(events[0].type).toBe('noteOff');
       expect((events[0] as NoteOffEvent).noteNumber).toBe(60);
       expect((events[0] as NoteOffEvent).velocity).toBe(64);
     });
  });

  describe('Control Change Events', () => {
     it('emits controlChange event with controller and value', () => {
       processor.onMidiEvent(e => events.push(e));
       processor.processMidiMessage(new Uint8Array([0xb0, 1, 64]));

       expect(events.length).toBe(1);
       expect(events[0].type).toBe('controlChange');
       expect((events[0] as ControlChangeEvent).controller).toBe(1);
       expect((events[0] as ControlChangeEvent).value).toBe(64);
     });

    it('updates internal hue when controller 1 changes', () => {
      processor.onMidiEvent(e => events.push(e));
      expect(processor.hue).toBe(0);

      processor.processMidiMessage(new Uint8Array([0xb0, 1, 127]));
      expect(processor.hue).toBe(360);
    });

    it('updates internal brightness when controller 7 changes', () => {
      processor.onMidiEvent(e => events.push(e));
      expect(processor.brightness).toBe(100);

      processor.processMidiMessage(new Uint8Array([0xb0, 7, 127]));
      expect(processor.brightness).toBe(100);
    });

    it('updates internal saturation when controller 10 changes', () => {
      processor.onMidiEvent(e => events.push(e));
      expect(processor.saturation).toBe(100);

      processor.processMidiMessage(new Uint8Array([0xb0, 10, 127]));
      expect(processor.saturation).toBe(100);
    });
  });

  describe('Pitch Bend Events', () => {
     it('emits pitchBend event with normalized value', () => {
       processor.onMidiEvent(e => events.push(e));
       processor.processMidiMessage(new Uint8Array([0xe0, 0, 64]));

       expect(events.length).toBe(1);
       expect(events[0].type).toBe('pitchBend');
       expect(typeof (events[0] as PitchBendEvent).value).toBe('number');
     });

    it('returns 0 for center position', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([0xe0, 0, 64]));

      expect((events[0] as any).value).toBeCloseTo(0, 2);
    });

    it('returns positive value for bend up', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([0xe0, 127, 127]));

      expect((events[0] as any).value).toBeGreaterThan(0);
    });

    it('returns negative value for bend down', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([0xe0, 0, 0]));

      expect((events[0] as any).value).toBeLessThan(0);
    });
  });

  describe('Dimension Setting', () => {
    it('uses custom dimensions for x/y mapping', () => {
      processor.setDimensions(1920, 1080);
      processor.onMidiEvent(e => events.push(e));

      vi.spyOn(Math, 'random').mockReturnValue(0);
      processor.processMidiMessage(new Uint8Array([0x90, 127, 100]));

      expect((events[0] as any).x).toBe(1920);
    });
  });

  describe('Message Validation', () => {
    it('ignores messages shorter than 3 bytes', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([0x90, 60]));
      expect(events.length).toBe(0);
    });

    it('ignores empty messages', () => {
      processor.onMidiEvent(e => events.push(e));
      processor.processMidiMessage(new Uint8Array([]));
      expect(events.length).toBe(0);
    });
  });
});