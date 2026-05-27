import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MIDIDialog } from './midi-dialog';

describe('MIDIDialog', () => {
  let dialog: MIDIDialog;

  beforeEach(() => {
    dialog = new MIDIDialog();
  });

  afterEach(() => {
    const dialogEl = document.getElementById('midi-dialog');
    if (dialogEl) dialogEl.remove();
    const styleEl = document.getElementById('midi-dialog-styles');
    if (styleEl) styleEl.remove();
    vi.restoreAllMocks();
  });

  describe('Opening and Closing', () => {
    it('starts hidden', () => {
      const dialogEl = document.getElementById('midi-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(true);
    });

    it('shows dialog when show() is called', () => {
      dialog.show();
      const dialogEl = document.getElementById('midi-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(false);
    });

    it('hides dialog when hide() is called', () => {
      dialog.show();
      dialog.hide();
      const dialogEl = document.getElementById('midi-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(true);
    });

    it('toggles dialog visibility', () => {
      dialog.toggle();
      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(false);
      dialog.toggle();
      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Rendering Devices', () => {
    it('renders devices from updateDevices', () => {
      dialog.updateDevices([
        { id: '1', name: 'Device 1', manufacturer: 'Mfg 1', version: '1.0' },
        { id: '2', name: 'Device 2', manufacturer: 'Mfg 2', version: '2.0' },
      ]);

      const options = document.querySelectorAll('#midi-device-select option');
      expect(options).toHaveLength(3);
      expect(options[1].textContent).toContain('Device 1');
      expect(options[2].textContent).toContain('Device 2');
    });

    it('shows "No devices available" when list is empty', () => {
      dialog.updateDevices([]);

      const options = document.querySelectorAll('#midi-device-select option');
      expect(options).toHaveLength(2);
      expect(options[1].textContent).toContain('No MIDI devices');
    });

    it('selects device by default when specified', () => {
      dialog.updateDevices(
        [
          { id: '1', name: 'Device 1', manufacturer: 'Mfg 1', version: '1.0' },
        ],
        '1'
      );

      const select = document.querySelector('#midi-device-select') as HTMLSelectElement;
      expect(select.value).toBe('1');
    });
  });

  describe('Device Selection', () => {
    it('calls onDeviceSelect callback when device is selected', () => {
      const callback = vi.fn();
      dialog.setOnDeviceSelect(callback);

      dialog.updateDevices([
        { id: '1', name: 'Device 1', manufacturer: 'Mfg 1', version: '1.0' },
      ]);

      const select = document.querySelector('#midi-device-select') as HTMLSelectElement;
      select.value = '1';
      select.dispatchEvent(new Event('change'));

      expect(callback).toHaveBeenCalledWith('1');
    });

    it('returns selected device ID', () => {
      dialog.updateDevices(
        [
          { id: '1', name: 'Device 1', manufacturer: 'Mfg 1', version: '1.0' },
        ],
        '1'
      );

      expect(dialog.getSelectedDeviceId()).toBe('1');
    });
  });

  describe('Device Info', () => {
    it('displays device info when device is selected', () => {
      dialog.updateDevices(
        [
          { id: '1', name: 'Device 1', manufacturer: 'Mfg 1', version: '1.0' },
        ],
        '1'
      );

      const infoDiv = document.querySelector('.device-info');
      expect(infoDiv?.innerHTML).toContain('Device 1');
      expect(infoDiv?.innerHTML).toContain('Mfg 1');
    });

    it('shows "No device selected" when none is selected', () => {
      dialog.updateDevices([]);

      const infoDiv = document.querySelector('.device-info');
      expect(infoDiv?.innerHTML).toContain('No device selected');
    });
  });

  describe('Close on Escape', () => {
    it('hides dialog when Escape is pressed', () => {
      dialog.show();
      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Close on Outside Click', () => {
    it('hides dialog when clicking outside', () => {
      dialog.show();
      const dialogEl = document.getElementById('midi-dialog');
       dialogEl?.dispatchEvent(new MouseEvent('click'));

      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Close Button', () => {
    it('hides dialog when close button is clicked', () => {
      dialog.show();
      const closeBtn = document.querySelector('.close-btn');
      closeBtn?.dispatchEvent(new MouseEvent('click'));

      expect(document.getElementById('midi-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });
});