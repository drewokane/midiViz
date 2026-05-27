import { MIDIDevice } from '../midi';

export class MIDIDialog {
  private dialog: HTMLElement | null = null;
  private onDeviceSelect: ((deviceId: string) => void) | null = null;
  private onDeviceChange: (() => void) | null = null;
  private devices: MIDIDevice[] = [];
  private selectedDeviceId: string = '';

  constructor() {
    this.createDialog();
  }

  private createDialog(): void {
    this.dialog = document.createElement('div');
    this.dialog.id = 'midi-dialog';
    this.dialog.className = 'midi-dialog hidden';
    this.dialog.innerHTML = `
      <div class="dialog-header">
        <h3>MIDI Input</h3>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      <div class="dialog-content">
        <label for="midi-device-select">Select Device:</label>
        <select id="midi-device-select" class="midi-device-select">
          <option value="">-- Select MIDI Device --</option>
        </select>
        <div class="device-info"></div>
      </div>
    `;

    const style = document.createElement('style');
    style.id = 'midi-dialog-styles';
    style.textContent = `
      .midi-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 0;
        min-width: 300px;
        max-width: 400px;
        z-index: 2000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }

      .midi-dialog.hidden {
        display: none;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dialog-header h3 {
        margin: 0;
        font-size: 16px;
        color: #fff;
      }

      .close-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .close-btn:hover {
        opacity: 0.7;
      }

      .dialog-content {
        padding: 16px;
      }

      .dialog-content label {
        display: block;
        color: #fff;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .midi-device-select {
        width: 100%;
        padding: 8px 12px;
        background: #333;
        color: #fff;
        border: 1px solid #555;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
      }

      .midi-device-select:focus {
        outline: none;
        border-color: #35c023;
      }

      .device-info {
        margin-top: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
      }

      .device-info .device-name {
        color: #fff;
        font-weight: bold;
        margin-bottom: 4px;
      }

      .device-info .device-manufacturer {
        color: rgba(255, 255, 255, 0.5);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.dialog);

    const closeBtn = this.dialog.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.dialog?.classList.contains('hidden')) {
        this.hide();
      }
    });

    const select = this.dialog.querySelector('#midi-device-select') as HTMLSelectElement;
    select.addEventListener('change', () => {
      const deviceId = select.value;
      this.selectedDeviceId = deviceId;
      this.updateDeviceInfo();
      if (this.onDeviceSelect && deviceId) {
        this.onDeviceSelect(deviceId);
      }
    });
  }

  setOnDeviceSelect(callback: (deviceId: string) => void): void {
    this.onDeviceSelect = callback;
  }

  setOnDeviceChange(callback: () => void): void {
    this.onDeviceChange = callback;
  }

  show(): void {
    this.dialog?.classList.remove('hidden');
  }

  hide(): void {
    this.dialog?.classList.add('hidden');
  }

  toggle(): void {
    if (this.dialog?.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  updateDevices(devices: MIDIDevice[], selectedId: string = ''): void {
    this.devices = devices;
    this.selectedDeviceId = selectedId;

    const select = this.dialog?.querySelector('#midi-device-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '<option value="">-- Select MIDI Device --</option>';

    if (devices.length === 0) {
      select.innerHTML += '<option value="" disabled>No MIDI devices available</option>';
    } else {
      devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = `${device.name} (${device.manufacturer})`;
        if (device.id === selectedId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    }

    this.updateDeviceInfo();
  }

  getSelectedDeviceId(): string {
    return this.selectedDeviceId;
  }

  private updateDeviceInfo(): void {
    const infoDiv = this.dialog?.querySelector('.device-info');
    if (!infoDiv) return;

    if (!this.selectedDeviceId) {
      infoDiv.innerHTML = '<span class="no-device">No device selected</span>';
      return;
    }

    const device = this.devices.find(d => d.id === this.selectedDeviceId);
    if (device) {
      infoDiv.innerHTML = `
        <div class="device-name">${device.name}</div>
        <div class="device-manufacturer">${device.manufacturer}</div>
        ${device.version ? `<div class="device-version">Version: ${device.version}</div>` : ''}
      `;
    }
  }
}