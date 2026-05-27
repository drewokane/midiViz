import { MIDIManager } from './midi';
import { MidiProcessor } from './midi-processor';
import { Sketch } from './sketch';
import { VisualizerDialog } from './ui/visualizer-dialog';
import { MIDIDialog } from './ui/midi-dialog';

let midiManager: MIDIManager | null = null;
let midiProcessor: MidiProcessor | null = null;
let sketch: Sketch | null = null;
let vizDialog: VisualizerDialog | null = null;
let midiDialog: MIDIDialog | null = null;

async function initApp(): Promise<void> {
  console.log('Initializing app...');

  const midiSelectContainer = document.getElementById('midi-controls');
  const sketchContainer = document.getElementById('sketch-container');

  if (!midiSelectContainer || !sketchContainer) {
    console.error('Required DOM containers not found');
    return;
  }

  console.log('Creating MIDI manager...');
  midiManager = new MIDIManager();

  console.log('Creating MIDI dialog...');
  midiDialog = new MIDIDialog();
  midiDialog.updateDevices(midiManager.getAvailableDevices());

  midiManager.onDeviceChange((devices) => {
    midiDialog?.updateDevices(devices, midiManager?.getSelectedDeviceId() ?? '');
  });

  midiDialog.setOnDeviceSelect((deviceId) => {
    if (deviceId) {
      midiManager?.selectDevice(deviceId);
    }
  });

  console.log('Creating MIDI processor...');
  midiProcessor = new MidiProcessor();

  console.log('Creating sketch...');
  sketch = new Sketch();
  sketch.init(sketchContainer);

  console.log('Creating visualizer dialog...');
  vizDialog = new VisualizerDialog();
  if (sketch) {
    vizDialog.setManager(sketch.getManager());
    vizDialog.setOnReorder((from, to) => {
      sketch?.getManager().reorderVisualizers(from, to);
    });
  }

  const midiButton = document.createElement('button');
  midiButton.textContent = 'MIDI';
  midiButton.id = 'midi-btn';
  midiButton.style.marginLeft = '10px';
  midiButton.style.padding = '4px 8px';
  midiButton.style.backgroundColor = 'rgba(53, 192, 35, 0.2)';
  midiButton.style.border = '1px solid rgba(53, 192, 35, 0.5)';
  midiButton.style.color = '#fff';
  midiButton.style.borderRadius = '4px';
  midiButton.style.cursor = 'pointer';
  midiButton.addEventListener('click', () => midiDialog?.toggle());
  midiSelectContainer.appendChild(midiButton);

  const vizButton = document.createElement('button');
  vizButton.textContent = 'Visualizers';
  vizButton.id = 'visualizer-btn';
  vizButton.style.marginLeft = '10px';
  vizButton.style.padding = '4px 8px';
  vizButton.style.backgroundColor = 'rgba(53, 192, 35, 0.2)';
  vizButton.style.border = '1px solid rgba(53, 192, 35, 0.5)';
  vizButton.style.color = '#fff';
  vizButton.style.borderRadius = '4px';
  vizButton.style.cursor = 'pointer';
  vizButton.addEventListener('click', () => vizDialog?.toggle());
  midiSelectContainer.appendChild(vizButton);

  midiProcessor.setDimensions(sketchContainer.clientWidth, sketchContainer.clientHeight);

  console.log('Setting up MIDI message handler...');
  midiManager.onMIDIMessage((message: Uint8Array) => {
    console.log('MIDI Message Received:', message);
    midiProcessor?.processMidiMessage(message);
  });

  midiProcessor.onMidiEvent((event) => {
    if (sketch) {
      sketch.getManager().handleMidiEvent(event);
    }
  });

  console.log('Application initialized');
}

function cleanup(): void {
  sketch?.destroy();
  midiManager?.disconnect();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('beforeunload', cleanup);