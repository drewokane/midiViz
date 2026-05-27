# AGENTS.md - mini-midi-viz Project Reference

## Project Status
✅ **Production Ready** - Core features complete, extensible architecture

## Overview
A TypeScript + p5.js + WebMIDI visualizer with plugin-based architecture.
MIDI input drives real-time visual effects through a modular visualizer system.

## Architecture Overview

### Core Systems
1. **MIDI System** - Device management and message handling
2. **Event Processing Pipeline** - MIDI → MidiProcessor → MidiEvent → Visualizers
3. **Visualizer Plugin System** - Extensible visualization modules
4. **Rendering System** - p5.js canvas with visual effects layer
5. **UI System** - Modal dialogs for configuration

### File Structure
```
src/
├── midi.ts                    # MIDI device management (MIDIManager class)
├── midi-processor.ts          # Converts MIDI messages to visual events
├── midi-events.ts             # TypeScript interfaces for MIDI events
├── sketch.ts                  # p5.js canvas and rendering loop
├── main.ts                    # Application entry point
├── visual-effects.ts          # Global visual effects (scanlines, vignette, etc.)
├── ui/
│   ├── midi-dialog.ts         # Modal for MIDI device selection
│   ├── midi-dialog.test.ts    # Tests for MIDI dialog
│   ├── visualizer-dialog.ts   # Modal for visualizer management
│   └── visualizer-dialog.test.ts
├── visualizers/
│   ├── base-visualizer.ts     # Abstract base class for visualizers
│   ├── manager.ts             # Manages multiple visualizer instances
│   ├── manager.test.ts        # Tests for visualizer manager
│   ├── circle-visualizer.ts   # Circle-based visualization
│   ├── midi-processor.test.ts # Tests for MIDI processing
│   └── index.ts               # Visualizer exports
├── visual-elements/
│   └── circle.ts              # Circle visual element with lifecycle
└── shaders/                   # GLSL shaders (not yet integrated)
    ├── common.vert            # Vertex shader for full-screen quad
    ├── noise.frag             # Procedural noise effect
    └── crt.frag               # CRT monitor effect

index.html                     # HTML entry point
vite.config.ts                 # Vite build configuration
vitest.config.ts               # Vitest test configuration
tsconfig.json                  # TypeScript configuration
package.json                   # Dependencies and scripts
```

## Module Responsibilities

### Core Modules

#### midi.ts
- **Purpose**: MIDI device lifecycle management
- **Key Class**: `MIDIManager`
- **Key Methods**:
  - `getAvailableDevices(): MIDIDevice[]` - Enumerate MIDI inputs
  - `selectDevice(deviceId: string): boolean` - Connect to device
  - `onMIDIMessage(callback: (message: Uint8Array) => void)` - Register message handler
  - `onDeviceChange(callback: DeviceChangeCallback)` - Handle hotplug events
  - `disconnect()` - Cleanup MIDI connections
- **Responsibilities**:
  - Request MIDI access via WebMIDI API
  - Track connected/disconnected devices
  - Route MIDI messages to registered callbacks
  - Handle permission errors gracefully

#### midi-processor.ts
- **Purpose**: Translate raw MIDI to positioned visual events
- **Key Class**: `MidiProcessor`
- **Key Methods**:
  - `processMidiMessage(message: Uint8Array)` - Parse and route MIDI
  - `setDimensions(width: number, height: number)` - Update screen bounds
  - `onMidiEvent(callback: (event: MidiEvent) => void)` - Register event handler
- **Responsibilities**:
  - Parse MIDI status bytes (note on/off, CC, pitch bend)
  - Map MIDI note numbers to screen X coordinates
  - Map velocity to visual size
  - Map control changes to visual parameters (hue, brightness, saturation)
  - Emit typed MidiEvent objects

#### sketch.ts
- **Purpose**: p5.js integration and render loop
- **Key Class**: `Sketch`
- **Key Methods**:
  - `init(container: HTMLElement)` - Initialize p5.js canvas
  - `getManager(): VisualizerManager` - Access visualizer manager
  - `destroy()` - Cleanup resources
- **Responsibilities**:
  - Create p5.js instance with setup/draw/windowResized
  - Set color mode to HSB for easier color manipulation
  - Coordinate VisualizerManager update/draw cycle
  - Apply global visual effects each frame
  - Handle canvas resize events

#### main.ts
- **Purpose**: Application bootstrap and wiring
- **Responsibilities**:
  - Create MIDIManager instance
  - Create and configure MIDI dialog
  - Create and configure visualizer dialog
  - Initialize MidiProcessor
  - Initialize Sketch with p5.js
  - Wire up MIDI → Processor → Visualizers pipeline
  - Create UI buttons for dialogs
  - Handle application lifecycle (init, cleanup)

### Visualizer System

#### visualizers/base-visualizer.ts
- **Purpose**: Abstract base class for all visualizers
- **Key Properties**:
  - `name: string` - Display name
  - `enabled: boolean` - Active state
  - `sketch: p5 | null` - p5.js instance reference
  - `width, height: number` - Canvas dimensions
- **Key Methods** (abstract, must implement):
  - `init(sketch: p5, width: number, height: number)` - Setup with p5.js instance
  - `handleMidiEvent(event: MidiEvent)` - Process MIDI input
  - `update()` - Update state per frame (physics, lifecycle)
  - `draw()` - Render to canvas
  - `destroy()` - Cleanup resources
- **Key Methods** (concrete):
  - `setEnabled(enabled: boolean)` - Toggle active state
  - `isEnabled(): boolean` - Check if active
  - `getName(): string` - Get display name
  - `setDimensions(width: number, height: number)` - Update canvas size

#### visualizers/manager.ts
- **Purpose**: Manage multiple visualizer instances
- **Key Class**: `VisualizerManager`
- **Key Methods**:
  - `addVisualizer(viz: BaseVisualizer)` - Register new visualizer
  - `removeVisualizer(viz: BaseVisualizer)` - Unregister visualizer
  - `reorderVisualizers(from: number, to: number)` - Change draw order
  - `toggleVisualizer(index: number)` - Enable/disable by index
  - `setVisualizerEnabled(index: number, enabled: boolean)` - Set state
  - `handleMidiEvent(event: MidiEvent)` - Broadcast to all enabled visualizers
  - `update()` - Update all enabled visualizers
  - `draw()` - Draw all enabled visualizers in order
  - `getVisualizers(): BaseVisualizer[]` - Get visualizer list
  - `onVisualizersChange(callback)` - Register change listener
- **Responsibilities**:
  - Maintain ordered list of visualizers
  - Initialize visualizers with p5.js instance
  - Broadcast MIDI events to enabled visualizers
  - Coordinate update/draw cycle
  - Notify UI of visualizer changes

#### visualizers/circle-visualizer.ts
- **Purpose**: Example visualizer implementation
- **Key Class**: `CircleVisualizer extends BaseVisualizer`
- **Behavior**:
  - Creates expanding/fading circles on MIDI note events
  - Maps note number to X position
  - Maps velocity to circle size
  - Responds to CC#1 (modulation) for hue
  - Responds to CC#7 (volume) for brightness
  - Responds to CC#10 (pan) for saturation
- **Implementation Details**:
  - Maintains array of Circle instances
  - Updates circles each frame (fade, shrink)
  - Removes dead circles (lifetime expired)

### UI System

#### ui/midi-dialog.ts
- **Purpose**: Modal dialog for MIDI device selection
- **Key Class**: `MIDIDialog`
- **Key Methods**:
  - `show()` - Display dialog
  - `hide()` - Hide dialog
  - `toggle()` - Toggle visibility
  - `updateDevices(devices: MIDIDevice[], selectedId?: string)` - Refresh device list
  - `setOnDeviceSelect(callback: (deviceId: string) => void)` - Register selection handler
- **Features**:
  - Dropdown list of available MIDI devices
  - Device info display (name, manufacturer, version)
  - Close button and ESC key support
  - Click outside to close
  - Styled with inline CSS for portability

#### ui/visualizer-dialog.ts
- **Purpose**: Modal dialog for visualizer management
- **Key Class**: `VisualizerDialog`
- **Key Methods**:
  - `show()` - Display dialog
  - `hide()` - Hide dialog
  - `toggle()` - Toggle visibility
  - `setManager(manager: VisualizerManager)` - Connect to manager
  - `setOnReorder(callback: (from: number, to: number) => void)` - Register reorder handler
- **Features**:
  - List of visualizers with enable/disable toggles
  - Reorder controls (up/down buttons)
  - Remove visualizer button
  - Real-time updates when visualizers change
  - Styled with inline CSS

### Visual Effects

#### visual-effects.ts
- **Purpose**: Post-processing effects layer applied after visualizers
- **Functions**:
  - `drawScanlines(p: p5, counter: number)` - Animated horizontal scanline overlay with sine wave modulation
  - `drawVignette(p: p5)` - Radial gradient vignette (dark edges)
  - `drawDotMatrix(p: p5, counter: number)` - Animated dot pattern grid
  - `drawRandomRectGlitch(p: p5, counter: number)` - Random glitch rectangles every 20 frames
  - `drawVisualEffects(p: p5, counter: number)` - Applies all effects in sequence
- **Usage**: Called from sketch.ts draw loop after visualizers render

### Type Definitions

#### midi-events.ts
- **Purpose**: TypeScript interfaces for strongly-typed MIDI events
- **Types**:
  - `NoteOnEvent` - Note triggered (noteNumber, velocity, x, y, size)
  - `NoteOffEvent` - Note released (noteNumber, velocity)
  - `ControlChangeEvent` - CC message (controller, value)
  - `PitchBendEvent` - Pitch wheel (value: -1 to 1)
  - `MidiEvent` - Union type of all event types

### Visual Elements

#### visual-elements/circle.ts
- **Purpose**: Circle visual element with lifecycle management
- **Key Class**: `Circle`
- **Properties**:
  - `x, y: number` - Position
  - `size: number` - Diameter
  - `lifetime: number` - Frames remaining
  - `hue, saturation, brightness: number` - HSB color
- **Key Methods**:
  - `draw(p: p5, w: number, h: number)` - Render with fade-out alpha
  - `update(): boolean` - Decrement lifetime, shrink size, return alive status
  - `setVisualProperties(h, s, b)` - Update color

## Development Guidelines

### Adding a New Visualizer
1. Create new file in `src/visualizers/` (e.g., `waveform-visualizer.ts`)
2. Extend `BaseVisualizer` abstract class
3. Implement required methods:
   - `init(sketch, width, height)` - Store references, initialize state
   - `handleMidiEvent(event)` - Respond to MIDI (switch on event.type)
   - `update()` - Update animation state, remove dead elements
   - `draw()` - Render using p5.js API via `this.sketch`
   - `destroy()` - Clean up resources
4. Register in `sketch.ts` constructor:
   ```typescript
   this.manager.addVisualizer(new YourVisualizer());
   ```
5. Visualizer will automatically appear in visualizer dialog

### Adding Visual Effects
1. Create function in `visual-effects.ts`:
   ```typescript
   export function drawYourEffect(p: p5, counter: number): void {
     // Use p5.js drawing API
     p.stroke(255, 100);
     p.line(0, 0, p.width, p.height);
   }
   ```
2. Call from `drawVisualEffects()` function
3. Effect will be applied after all visualizers render

### Adding New MIDI Event Types
1. Add interface to `midi-events.ts`:
   ```typescript
   export interface YourEvent {
     type: 'yourType';
     // ... properties
   }
   ```
2. Add to `MidiEvent` union type
3. Handle in `midi-processor.ts` `processMidiMessage()` method
4. Visualizers can now handle in their `handleMidiEvent()` method

### Testing
- Test files use vitest with jsdom environment
- Run: `npm test` (watch mode) or `npm run test:run` (single run)
- Mock MIDI API: `navigator.requestMIDIAccess = vi.fn()`
- Mock p5.js: Create stub objects with required methods
- Test visualizer logic independently of p5.js rendering

### Code Style
- Use TypeScript strict mode
- Prefer composition over inheritance (except visualizers)
- Keep files small and focused (< 150 lines ideal)
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Handle errors gracefully (console.warn, not throw)

## Known Issues & Future Work

### Shader System (Not Yet Integrated)
**Status**: Shader files exist but are not integrated into rendering pipeline

**Files**:
- `src/shaders/common.vert` - Vertex shader for full-screen quad
- `src/shaders/noise.frag` - Procedural noise effect with time/scale uniforms
- `src/shaders/crt.frag` - CRT monitor effect (scanlines, barrel distortion, vignette)

**Why Not Working**: Previous attempts resulted in blank screen, likely due to:
- Shader compilation errors not caught/logged
- Missing or incorrect uniform values
- Texture binding issues (tex0 not set)
- p5.js requires WEBGL mode for shaders (not currently enabled)

**Integration Plan**:

1. **Enable WEBGL Mode**:
   ```typescript
   // In sketch.ts setup()
   const canvas = sketch.createCanvas(width, height, sketch.WEBGL);
   ```

2. **Load Shader Files** (Vite raw import):
   ```typescript
   import vertShader from './shaders/common.vert?raw';
   import fragShader from './shaders/crt.frag?raw';
   ```

3. **Create Shader Wrapper Class**:
   ```typescript
   class ShaderEffect {
     shader: p5.Shader;
     buffer: p5.Graphics;
     
     init(p: p5, vertSrc: string, fragSrc: string) {
       this.shader = p.createShader(vertSrc, fragSrc);
       // Check for compilation errors
       if (!this.shader) {
         console.error('Shader compilation failed');
         console.error(p.drawingContext.getShaderInfoLog());
       }
     }
     
     apply(p: p5, sourceTexture: p5.Graphics) {
       p.shader(this.shader);
       this.shader.setUniform('tex0', sourceTexture);
       this.shader.setUniform('u_time', p.millis() / 1000.0);
       this.shader.setUniform('u_resolution', [p.width, p.height]);
       // Set shader-specific uniforms
       this.shader.setUniform('u_scanline_intensity', 0.1);
       this.shader.setUniform('u_curvature', 0.15);
       this.shader.setUniform('u_vignette', 0.8);
       // Draw full-screen quad
       p.rect(-p.width/2, -p.height/2, p.width, p.height);
     }
   }
   ```

4. **Implement Offscreen Rendering**:
   ```typescript
   // In sketch.ts
   let mainBuffer: p5.Graphics;
   let shaderEffect: ShaderEffect;
   
   sketch.setup = () => {
     // Create WEBGL canvas
     createCanvas(width, height, WEBGL);
     // Create offscreen buffer for visualizers (2D mode)
     mainBuffer = createGraphics(width, height);
     // Initialize shader
     shaderEffect = new ShaderEffect();
     shaderEffect.init(sketch, vertSrc, fragSrc);
   };
   
   sketch.draw = () => {
     // Draw visualizers to offscreen buffer
     mainBuffer.background(0);
     // ... draw visualizers to mainBuffer ...
     
     // Apply shader to main canvas
     shaderEffect.apply(sketch, mainBuffer);
   };
   ```

5. **Debug Shader Issues**:
   ```typescript
   // Check compilation status
   const gl = p.drawingContext as WebGLRenderingContext;
   const shaderObj = shader._getShader(); // p5.js internal
   console.log('Compile status:', gl.getShaderParameter(shaderObj, gl.COMPILE_STATUS));
   console.log('Info log:', gl.getShaderInfoLog(shaderObj));
   
   // Validate uniforms
   console.log('Uniform locations:', {
     tex0: gl.getUniformLocation(program, 'tex0'),
     u_time: gl.getUniformLocation(program, 'u_time'),
     // ... check all uniforms
   });
   ```

**Common Shader Issues**:
- **Blank screen**: Shader compilation error (check info log)
- **Black screen**: Missing texture uniform or incorrect binding
- **Distorted output**: Wrong texture coordinates or resolution uniform
- **Performance issues**: Shader too complex, reduce calculations
- **WEBGL mode differences**: Coordinate system is centered (0,0 = center, not top-left)

**Testing Strategy**:
1. Start with simplest shader (solid color output)
2. Add texture sampling (pass-through)
3. Add one effect at a time (scanlines, then curvature, then vignette)
4. Test each uniform individually
5. Profile performance with multiple visualizers

### Future Enhancements

#### High Priority
- [ ] Integrate shader post-processing system (see plan above)
- [ ] Add more visualizer types (waveform, particles, bars)
- [ ] Visualizer parameter controls (sliders for size, speed, color)

#### Medium Priority
- [ ] Preset system (save/load visualizer + parameter combinations)
- [ ] MIDI CC mapping UI (assign CCs to visualizer parameters)
- [ ] Performance optimizations (object pooling for circles)
- [ ] Keyboard shortcuts (space = toggle visualizers, etc.)

#### Low Priority
- [ ] MIDI recording/playback
- [ ] Multi-device support (combine multiple MIDI inputs)
- [ ] MIDI output capabilities
- [ ] Audio input visualization (microphone)
- [ ] Video export/recording
- [ ] Mobile touch support

## Success Criteria

### Completed ✅
- [x] Vite dev server launches without errors
- [x] MIDI device dropdown populates with available inputs
- [x] User can select MIDI device from dropdown
- [x] Selected MIDI device sends messages to sketch
- [x] Sketch updates visually in response to MIDI input
- [x] Canvas resizes with window
- [x] Production build outputs working static assets
- [x] Modular architecture with separation of concerns
- [x] Plugin-based visualizer system
- [x] UI dialogs for configuration
- [x] Visual effects layer
- [x] Test coverage for core modules

### In Progress / Planned
- [ ] Shader post-processing integration
- [ ] Additional visualizer implementations
- [ ] Visualizer parameter controls
- [ ] Preset management system
- [ ] Performance optimizations

## Resources

### Documentation
- [p5.js Reference](https://p5js.org/reference/)
- [p5.js Shaders Tutorial](https://itp-xstory.github.io/p5js-shaders/)
- [WebMIDI API](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### MIDI Testing
- Any USB MIDI controller works
- Virtual MIDI ports for testing:
  - Windows: loopMIDI
  - Mac: IAC Driver (built-in)
  - Linux: ALSA virtual ports
- Browser MIDI support: Chrome, Edge (Firefox does not support WebMIDI)
- Test with online MIDI tools: [WebMIDI Test](https://www.onlinemusictools.com/webmiditest/)

### Development Tools
- Vite dev server: `npm run dev` (http://localhost:5173)
- Tests: `npm test` (watch mode)
- Build: `npm run build` (outputs to dist/)
- Preview build: `npm run preview`
