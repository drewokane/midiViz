// MIDI Device Handling Module
export interface MIDIDevice {
  id: string;
  name: string;
  version: string;
  manufacturer: string;
}

type DeviceChangeCallback = (devices: MIDIDevice[]) => void;

export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private selectedInput: MIDIInput | null = null;
  private midiCallback: ((message: Uint8Array) => void) | null = null;
  private devices: MIDIDevice[] = [];
  private changeCallbacks: DeviceChangeCallback[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      if ('requestMIDIAccess' in navigator) {
        this.midiAccess = await navigator.requestMIDIAccess({
          sysex: false
        });
        this.midiAccess.addEventListener('statechange', this.handleStateChange.bind(this));
        this.updateDeviceList();
      } else {
        console.warn('WebMIDI API not supported in this browser.');
      }
    } catch (err) {
      console.error('Failed to get MIDI access:', err);
    }
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    console.log('MIDI connection state change:', event);
    this.updateDeviceList();
  }

  private updateDeviceList(): void {
    if (!this.midiAccess) return;

    this.devices = [];
    const inputs = this.midiAccess.inputs;
    
    inputs.forEach((input: MIDIInput) => {
      this.devices.push({
        id: input.id,
        name: input.name ?? 'Unknown',
        version: input.version ?? '',
        manufacturer: input.manufacturer ?? 'Unknown'
      });
    });

    this.notifyChange();
  }

  public getAvailableDevices(): MIDIDevice[] {
    return [...this.devices];
  }

  public getSelectedDeviceId(): string {
    return this.selectedInput?.id ?? '';
  }

  public selectDevice(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
    }

    const inputs = this.midiAccess.inputs;
    const newInput = inputs.get(deviceId);
    
    if (newInput) {
      this.selectedInput = newInput;
      this.selectedInput.onmidimessage = (event: MIDIMessageEvent) => {
        if (this.midiCallback && event.data) {
          this.midiCallback(event.data);
        }
      };
      console.log(`Connected to MIDI input: ${this.selectedInput.name}`);
      return true;
    } else {
      console.error(`MIDI input with ID ${deviceId} not found`);
      this.selectedInput = null;
      return false;
    }
  }

  public onMIDIMessage(callback: (message: Uint8Array) => void): void {
    this.midiCallback = callback;
  }

  public onDeviceChange(callback: DeviceChangeCallback): void {
    this.changeCallbacks.push(callback);
  }

  private notifyChange(): void {
    this.changeCallbacks.forEach(cb => cb(this.getAvailableDevices()));
  }

  public disconnect(): void {
    if (this.selectedInput) {
      this.selectedInput.onmidimessage = null;
      this.selectedInput = null;
    }
    if (this.midiAccess) {
      this.midiAccess = null;
    }
  }
}