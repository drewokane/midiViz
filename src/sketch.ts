import p5 from 'p5';
import { VisualizerManager } from './visualizers/manager';
import { CircleVisualizer } from './visualizers/circle-visualizer';
import { RectBounceVisualizer } from './visualizers/rect-bounce-visualizer';
import { PerlinContourVisualizer } from './visualizers/perlin-contour-visualizer';
import { ArcRotateVisualizer } from './visualizers/arc-rotate-visualizer';
import { RectSlideVisualizer } from './visualizers/rect-slide-visualizer';
import { DataWaveVisualizer } from './visualizers/data-wave-visualizer';
import { drawVisualEffects } from './visual-effects';
import filterWorkingFragSrc from './shaders/filter-working.frag?raw';

export class Sketch {
  private p5Instance: p5 | null = null;
  private canvasContainer: HTMLElement | null = null;
  private manager: VisualizerManager;
  private filterShader: any = null;
  private mainBuffer: any = null;
  private counter: number = 0;
  private accumulatedTime: number = 0;

  constructor() {
    this.manager = new VisualizerManager();
  }

  public getManager(): VisualizerManager {
    return this.manager;
  }

  public init(container: HTMLElement): void {
    this.canvasContainer = container;

    this.createVisualizers();

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        const canvas = sketch.createCanvas(
          container.clientWidth,
          container.clientHeight
        );
        canvas.parent(container);
        sketch.colorMode(sketch.HSB, 360, 100, 100, 100);
        sketch.noStroke();

        // Create offscreen buffer for rendering
        this.mainBuffer = sketch.createGraphics(
          container.clientWidth,
          container.clientHeight
        );
        this.mainBuffer.colorMode(sketch.HSB, 360, 100, 100, 100);
        this.mainBuffer.noStroke();

        // Use working filter shader
        try {
          this.filterShader = (sketch as any).createFilterShader(filterWorkingFragSrc);
          
          if (this.filterShader) {
            console.log('[Filter] shader compiled successfully');
          } else {
            console.error('[Filter] shader compilation failed');
            this.filterShader = null;
          }
        } catch (e) {
          console.error('[Filter] shader init exception:', e);
          this.filterShader = null;
        }

        this.manager.setDimensions(container.clientWidth, container.clientHeight);
        this.manager.setSketch(this.mainBuffer);
      };

      sketch.draw = () => {
        // Draw to offscreen buffer
        this.mainBuffer.background(0);
        this.manager.update();
        this.manager.draw();
        drawVisualEffects(this.mainBuffer, this.accumulatedTime);

        // Draw buffer to main canvas
        sketch.background(0);
        sketch.image(this.mainBuffer, 0, 0);

        // Apply shader filter
        if (this.filterShader) {
          try {
            this.filterShader.setUniform('u_time', this.accumulatedTime);
            this.filterShader.setUniform('u_noise_intensity', 0.12);
            this.filterShader.setUniform('u_dither_intensity', 0.6);
            sketch.filter(this.filterShader);
          } catch (e) {
            console.error('[Filter] shader apply failed:', e);
            this.filterShader = null;
          }
        }

        this.counter++;
        if (this.counter % 10 === 0) {
          this.accumulatedTime += 1;
          this.accumulatedTime = this.accumulatedTime % 50;
        }

        sketch.filter(sketch.BLUR, 1);
      };

      sketch.windowResized = () => {
        if (this.p5Instance) {
          const w = this.canvasContainer?.clientWidth || 0;
          const h = this.canvasContainer?.clientHeight || 0;
          this.p5Instance.resizeCanvas(w, h);
          
          // Resize offscreen buffer
          if (this.mainBuffer) {
            this.mainBuffer.resizeCanvas(w, h);
          }
          
          this.manager.reinit(this.mainBuffer, w, h);
          this.createVisualizers();
        }
      };
    }, container);
  }

  private createVisualizers(): void {
    // All visualizers start listening to all channels by default
    // Users can configure specific channels via the UI
    this.manager.addVisualizer(new ArcRotateVisualizer());
    this.manager.addVisualizer(new CircleVisualizer());
    this.manager.addVisualizer(new RectBounceVisualizer());
    this.manager.addVisualizer(new PerlinContourVisualizer());
    this.manager.addVisualizer(new RectSlideVisualizer());
    this.manager.addVisualizer(new DataWaveVisualizer());
  }

  public handleMidiMessage(message: Uint8Array): void {
    this.manager.handleMidiEvent({
      type: 'noteOn',
      noteNumber: 0,
      velocity: 0,
      x: 0,
      y: 0,
      size: 0,
    } as any);
  }

  public destroy(): void {
    this.manager.destroy();
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
  }
}
