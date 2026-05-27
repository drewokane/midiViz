# Project Plan: mini-midi-viz

## Project History

### Phase 1: Initial Implementation ✅ COMPLETE
**Goal**: Create minimal TypeScript + p5.js + WebMIDI project

**Completed Features**:
- Vite + TypeScript build setup
- MIDI device enumeration and selection
- p5.js canvas rendering
- Modular file structure (midi.ts, sketch.ts, main.ts)
- Basic MIDI → visual mapping
- Responsive canvas that resizes with window
- Basic error handling for MIDI access

### Phase 2: Architecture Enhancement ✅ COMPLETE
**Goal**: Extend to plugin-based system

**Completed Features**:
- Abstract `BaseVisualizer` class for extensibility
- `VisualizerManager` for multi-visualizer support
- `CircleVisualizer` implementation
- `MidiProcessor` for event translation
- Typed `MidiEvent` system (NoteOn, NoteOff, ControlChange, PitchBend)
- Modal UI dialogs (MIDI device selection, visualizer management)
- Visual effects layer (scanlines, vignette, glitch, dot matrix)
- Test coverage with vitest
- Clean, modular code with separation of concerns

### Phase 3: Current State ✅ PRODUCTION READY
**Status**: Fully functional MIDI visualizer with extensible architecture

**Technology Stack**:
- Build: Vite 5.2
- Language: TypeScript 5.4
- Graphics: p5.js 1.9
- Testing: vitest 4.1
- MIDI: WebMIDI API

**File Structure**:
```
src/
├── midi.ts                    # MIDI device management
├── midi-processor.ts          # MIDI to visual event conversion
├── midi-events.ts             # TypeScript event interfaces
├── sketch.ts                  # p5.js rendering loop
├── main.ts                    # Application bootstrap
├── visual-effects.ts          # Post-processing effects
├── ui/                        # Modal dialogs
├── visualizers/               # Plugin system
├── visual-elements/           # Reusable visual components
└── shaders/                   # GLSL shaders (not yet integrated)
```

---

## Roadmap

### Phase 4: Shader Integration 🎯 NEXT PRIORITY
**Goal**: Add GPU-accelerated post-processing effects

**Background**: Shader files exist (crt.frag, noise.frag, common.vert) but previous integration attempts resulted in blank screens. Need systematic approach to debug and integrate.

**Tasks**:
1. Configure p5.js for WEBGL mode
2. Load shader files (.vert, .frag) via Vite raw imports
3. Create shader wrapper class for uniform management
4. Implement offscreen rendering pipeline (2D visualizers → buffer → shader → screen)
5. Apply CRT shader as post-process effect
6. Add noise shader as optional effect
7. Debug shader compilation issues systematically
8. Add shader enable/disable UI controls

**Technical Approach**:
```typescript
// Shader integration pseudocode
import vertShader from './shaders/common.vert?raw';
import crtShader from './shaders/crt.frag?raw';

class ShaderEffect {
  shader: p5.Shader;
  buffer: p5.Graphics;
  
  init(p: p5, vertSrc: string, fragSrc: string) {
    this.shader = p.createShader(vertSrc, fragSrc);
    
    // Critical: Check for compilation errors
    if (!this.shader) {
      const gl = p.drawingContext as WebGLRenderingContext;
      console.error('Shader compilation failed');
      console.error(gl.getShaderInfoLog(this.shader));
      return;
    }
  }
  
  apply(p: p5, sourceTexture: p5.Graphics) {
    p.shader(this.shader);
    
    // Set required uniforms
    this.shader.setUniform('tex0', sourceTexture);
    this.shader.setUniform('u_time', p.millis() / 1000.0);
    this.shader.setUniform('u_resolution', [p.width, p.height]);
    
    // CRT-specific uniforms
    this.shader.setUniform('u_scanline_intensity', 0.1);
    this.shader.setUniform('u_curvature', 0.15);
    this.shader.setUniform('u_vignette', 0.8);
    
    // Draw full-screen quad (WEBGL mode uses centered coords)
    p.rect(-p.width/2, -p.height/2, p.width, p.height);
  }
}

// In sketch.ts
sketch.setup = () => {
  // Enable WEBGL mode for shader support
  createCanvas(width, height, WEBGL);
  
  // Create offscreen buffer for 2D visualizers
  mainBuffer = createGraphics(width, height);
  
  // Initialize shader
  shaderEffect = new ShaderEffect();
  shaderEffect.init(sketch, vertShader, crtShader);
};

sketch.draw = () => {
  // Draw visualizers to offscreen buffer (2D mode)
  mainBuffer.background(0);
  // ... visualizer rendering to mainBuffer ...
  
  // Apply shader to main canvas (WEBGL mode)
  shaderEffect.apply(sketch, mainBuffer);
};
```

**Debugging Strategy**:
1. Start with simplest shader (solid color output) to verify pipeline
2. Add texture sampling (pass-through shader)
3. Add effects incrementally (scanlines → curvature → vignette)
4. Log shader compilation status and uniform locations
5. Validate texture binding before drawing
6. Profile performance with multiple visualizers active

**Common Issues to Watch For**:
- **Blank screen**: Shader compilation error (check `getShaderInfoLog()`)
- **Black screen**: Missing texture uniform or incorrect binding
- **Distorted output**: Wrong texture coordinates or resolution uniform
- **Performance drop**: Shader too complex, optimize fragment calculations
- **Coordinate mismatch**: WEBGL mode uses centered coordinates (0,0 = center)

**Success Criteria**:
- [ ] Shaders compile without errors
- [ ] CRT effect visible on screen (scanlines, curvature, vignette)
- [ ] No performance degradation (maintain 60fps)
- [ ] Shader can be toggled on/off via UI
- [ ] Works with all existing visualizers

---

### Phase 5: Visualizer Library 📚 FUTURE
**Goal**: Expand visualizer options beyond circles

**Planned Visualizers**:

1. **Waveform Visualizer** (oscilloscope-style)
   - Horizontal line that oscillates with note velocity
   - Multiple waveforms for polyphonic input
   - Decay over time

2. **Particle System**
   - Notes spawn particle bursts
   - Particles affected by velocity (speed/count)
   - Physics simulation (gravity, friction)

3. **Bar Graph Visualizer**
   - Frequency-style vertical bars per note
   - Height mapped to velocity
   - Color mapped to note number

4. **Trail Visualizer**
   - Moving points leave motion trails
   - Trail length based on sustain
   - Fade out over time

5. **Grid Visualizer**
   - Light up grid cells on note events
   - Grid position mapped to note number
   - Brightness mapped to velocity

6. **Spiral Visualizer**
   - Notes appear on spiral path
   - Spiral rotates over time
   - Distance from center based on velocity

**Implementation Pattern**:
```typescript
export class WaveformVisualizer extends BaseVisualizer {
  private waveforms: Waveform[] = [];
  
  constructor() {
    super('Waveform');
  }
  
  handleMidiEvent(event: MidiEvent): void {
    if (event.type === 'noteOn') {
      this.waveforms.push(new Waveform(event));
    }
  }
  
  update(): void {
    this.waveforms = this.waveforms.filter(w => w.update());
  }
  
  draw(): void {
    this.waveforms.forEach(w => w.draw(this.sketch!));
  }
}
```

---

### Phase 6: Configuration System ⚙️ FUTURE
**Goal**: User-customizable visualizer parameters

**Features**:

1. **Per-Visualizer Parameters**
   - Color palette selection
   - Size/scale multipliers
   - Speed/animation rate
   - Opacity/blend mode
   - UI sliders in visualizer dialog

2. **MIDI CC Mapping**
   - Assign any CC to any parameter
   - Visual feedback for mapped controls
   - Save mappings per visualizer
   - Learn mode (move control to assign)

3. **Preset System**
   - Save current visualizer configuration
   - Load presets from library
   - Export/import as JSON files
   - Share presets with others
   - Default presets included

4. **Global Settings**
   - Background color/opacity
   - Visual effects intensity
   - Performance mode (reduce quality for speed)
   - MIDI input sensitivity

**UI Mockup**:
```
Visualizer Dialog
├── Circle Visualizer [✓ Enabled]
│   ├── Color: [Hue Slider] [Saturation Slider]
│   ├── Size: [Scale Slider]
│   ├── Speed: [Decay Rate Slider]
│   └── MIDI Mapping: CC#1 → Hue
├── Waveform Visualizer [✗ Disabled]
└── [+ Add Visualizer]

Presets: [Default ▼] [Save] [Load] [Export]
```

**Data Structure**:
```typescript
interface VisualizerPreset {
  name: string;
  version: string;
  visualizers: {
    type: string;
    enabled: boolean;
    parameters: Record<string, number>;
    midiMappings: Record<number, string>; // CC# → parameter name
  }[];
  globalSettings: {
    backgroundColor: string;
    effectsIntensity: number;
  };
}
```

---

### Phase 7: Advanced Features 🚀 FUTURE
**Goal**: Professional-grade features for live performance

**Features**:

1. **MIDI Recording/Playback**
   - Record MIDI input to timeline
   - Playback recorded sessions
   - Export as MIDI file
   - Scrub through timeline
   - Loop sections

2. **Multi-Device Support**
   - Connect multiple MIDI inputs simultaneously
   - Route devices to specific visualizers
   - Merge all inputs to all visualizers
   - Device-specific color coding

3. **MIDI Output**
   - Send MIDI to external devices
   - Visual events trigger MIDI notes
   - Generative MIDI patterns
   - MIDI echo/delay effects

4. **Audio Input Visualization**
   - Microphone input via Web Audio API
   - FFT analysis for frequency visualization
   - Beat detection
   - Amplitude envelope following

5. **Performance Mode**
   - Fullscreen with hidden UI
   - Keyboard shortcuts for all actions
   - MIDI-controlled scene switching
   - Crossfade between presets

6. **Video Export/Recording**
   - Capture canvas to video file
   - Real-time encoding (WebCodecs API)
   - Export as MP4/WebM
   - Configurable resolution/framerate

---

## Technical Debt & Improvements

### Code Quality
- [ ] Add comprehensive JSDoc comments to public APIs
- [ ] Increase test coverage (target 80%+)
- [ ] Add integration tests for MIDI → Visualizer pipeline
- [ ] Implement error boundaries for visualizer crashes
- [ ] Add TypeScript strict null checks

### Performance
- [ ] Profile draw loop performance with multiple visualizers
- [ ] Implement object pooling for circles (reduce GC pressure)
- [ ] Optimize visual effects (reduce overdraw)
- [ ] Consider WebGL rendering for all visualizers
- [ ] Implement visualizer culling (skip offscreen elements)
- [ ] Add performance monitoring overlay (FPS, draw time)

### User Experience
- [ ] Add keyboard shortcuts (space = toggle visualizers, etc.)
- [ ] Improve mobile responsiveness (touch controls)
- [ ] Add loading states for MIDI access
- [ ] Better error messages for MIDI failures
- [ ] Add tooltips for UI controls
- [ ] Implement undo/redo for visualizer changes
- [ ] Add first-run tutorial/onboarding

### Developer Experience
- [ ] Add hot module replacement for visualizers
- [ ] Create visualizer template generator
- [ ] Add development mode with debug overlays
- [ ] Improve build performance
- [ ] Add pre-commit hooks (lint, format, test)

---

## Development Workflow

### Setup
```bash
npm install              # Install dependencies
npm run dev              # Start dev server on :5173
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run build            # Production build to dist/
npm run preview          # Preview production build
```

### Adding Features
1. Create feature branch from main
2. Implement feature with tests
3. Update AGENTS.md if architecture changes
4. Test with real MIDI device
5. Build and test production bundle
6. Create pull request with description

### Testing Strategy
- **Unit tests**: Logic in isolation (MidiProcessor, VisualizerManager)
- **Integration tests**: MIDI → Visualizer pipeline
- **Manual testing**: Real MIDI controller required for full validation
- **Visual regression**: Screenshot comparison (future)

### MIDI Testing Tools
- **Hardware**: Any USB MIDI controller
- **Virtual MIDI**: 
  - Windows: loopMIDI
  - Mac: IAC Driver (built-in)
  - Linux: ALSA virtual ports
- **Browser**: Chrome or Edge (Firefox lacks WebMIDI support)
- **Online tools**: [WebMIDI Test](https://www.onlinemusictools.com/webmiditest/)

---

## Architecture Decisions

### Why p5.js?
- Simple, expressive API for creative coding
- Large community and examples
- Good performance for 2D graphics
- WebGL support for shaders
- Easy to learn for non-programmers

### Why Plugin Architecture?
- Extensibility without modifying core
- Easy to add new visualizers
- Visualizers can be enabled/disabled independently
- Clear separation of concerns
- Testable in isolation

### Why TypeScript?
- Type safety catches bugs early
- Better IDE support (autocomplete, refactoring)
- Self-documenting code via types
- Easier to maintain as project grows

### Why Vite?
- Fast dev server with HMR
- Simple configuration
- Built-in TypeScript support
- Optimized production builds
- Modern tooling

---

## Resources

### Documentation
- [p5.js Reference](https://p5js.org/reference/)
- [p5.js Shaders Tutorial](https://itp-xstory.github.io/p5js-shaders/)
- [WebMIDI API Spec](https://webaudio.github.io/web-midi-api/)
- [MDN WebMIDI Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
- [Vite Guide](https://vitejs.dev/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev/)

### Learning Resources
- [The Coding Train (p5.js tutorials)](https://thecodingtrain.com/)
- [The Book of Shaders](https://thebookofshaders.com/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [MIDI Association](https://www.midi.org/)

### Inspiration
- [Hydra (live coding visuals)](https://hydra.ojack.xyz/)
- [TouchDesigner](https://derivative.ca/)
- [Processing](https://processing.org/)
- [VVVV](https://vvvv.org/)

---

## Project Milestones

### Milestone 1: MVP ✅ COMPLETE (Original Plan)
- Basic MIDI input
- Simple visualization
- Device selection

### Milestone 2: Architecture ✅ COMPLETE (Phase 2)
- Plugin system
- Multiple visualizers
- UI dialogs

### Milestone 3: Effects 🎯 IN PROGRESS (Phase 4)
- Shader integration
- Post-processing effects
- Performance optimization

### Milestone 4: Library 📅 PLANNED (Phase 5)
- 6+ visualizer types
- Rich visual variety
- Polished implementations

### Milestone 5: Configuration 📅 PLANNED (Phase 6)
- Parameter controls
- MIDI mapping
- Preset system

### Milestone 6: Professional 📅 FUTURE (Phase 7)
- Recording/playback
- Multi-device
- Performance mode

---

## Contributing Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing patterns (see AGENTS.md)
- Keep files focused (< 200 lines ideal)
- Use descriptive variable names
- Add JSDoc for public APIs
- Handle errors gracefully

### Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add waveform visualizer`
  - `fix: shader compilation error handling`
  - `docs: update AGENTS.md with shader info`
  - `test: add tests for MidiProcessor`
  - `refactor: extract shader wrapper class`

### Pull Requests
- Include description of changes
- Reference related issues
- Add screenshots/videos for visual changes
- Ensure tests pass
- Update documentation if needed

---

## License & Credits

### License
MIT License - See LICENSE file for details

### Credits
- Built with [p5.js](https://p5js.org/)
- Powered by [Vite](https://vitejs.dev/)
- Uses [WebMIDI API](https://www.w3.org/TR/webmidi/)

### Acknowledgments
- The Coding Train for p5.js inspiration
- WebMIDI community for examples and support
- All contributors and testers

---

**Last Updated**: 2026-04-25
**Current Version**: 1.0.0 (Production Ready)
**Next Focus**: Shader Integration (Phase 4)
