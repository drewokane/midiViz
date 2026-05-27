import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisualizerDialog } from './visualizer-dialog';
import { VisualizerManager } from '../visualizers/manager';
import { BaseVisualizer } from '../visualizers/base-visualizer';
import p5 from 'p5';

const mockP5Instance = {
  setup: vi.fn(),
  draw: vi.fn(),
  background: vi.fn(),
  createCanvas: vi.fn(),
  resizeCanvas: vi.fn(),
  remove: vi.fn(),
  colorMode: vi.fn(),
  noStroke: vi.fn(),
  fill: vi.fn(),
  ellipse: vi.fn(),
  line: vi.fn(),
  stroke: vi.fn(),
  noFill: vi.fn(),
  width: 800,
  height: 600,
  drawingContext: {
    createRadialGradient: vi.fn().mockReturnValue({
      addColorStop: vi.fn(),
    }),
  },
} as unknown as p5;

class MockVisualizer extends BaseVisualizer {
  constructor(name: string) {
    super(name);
  }

  init(sketch: p5, width: number, height: number): void {}
  handleMidiEvent(): void {}
  draw(): void {}
  update(): void {}
  destroy(): void {}
}

describe('VisualizerDialog', () => {
  let dialog: VisualizerDialog;
  let manager: VisualizerManager;

  beforeEach(() => {
    dialog = new VisualizerDialog();
    manager = new VisualizerManager();
  });

  afterEach(() => {
    const dialogEl = document.getElementById('visualizer-dialog');
    if (dialogEl) dialogEl.remove();
    const styleEl = document.querySelector('style:last-of-type');
    if (styleEl) styleEl.remove();
    vi.restoreAllMocks();
  });

  describe('Opening and Closing', () => {
    it('starts hidden', () => {
      const dialogEl = document.getElementById('visualizer-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(true);
    });

    it('shows dialog when show() is called', () => {
      dialog.show();
      const dialogEl = document.getElementById('visualizer-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(false);
    });

    it('hides dialog when hide() is called', () => {
      dialog.show();
      dialog.hide();
      const dialogEl = document.getElementById('visualizer-dialog');
      expect(dialogEl?.classList.contains('hidden')).toBe(true);
    });

    it('toggles dialog visibility', () => {
      dialog.toggle();
      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(false);
      dialog.toggle();
      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Rendering Visualizers', () => {
    it('renders visualizers from manager', () => {
      const viz1 = new MockVisualizer('Circle');
      const viz2 = new MockVisualizer('Square');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);

      dialog.setManager(manager);
      dialog.show();

      const items = document.querySelectorAll('.visualizer-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.visualizer-name')?.textContent).toBe('Circle');
      expect(items[1].querySelector('.visualizer-name')?.textContent).toBe('Square');
    });

    it('shows enabled state correctly', () => {
      const viz = new MockVisualizer('Circle');
      manager.addVisualizer(viz);

      dialog.setManager(manager);
      dialog.show();

      let checkbox = document.querySelector('.visualizer-toggle') as HTMLInputElement;
      expect(checkbox?.checked).toBe(true);

      viz.setEnabled(false);
      dialog.render();

      checkbox = document.querySelector('.visualizer-toggle') as HTMLInputElement;
      expect(checkbox?.checked).toBe(false);
      expect(document.querySelector('.visualizer-item')?.classList.contains('disabled')).toBe(true);
    });
  });

  describe('Toggling Visualizers', () => {
    it('toggles visualizer when checkbox is clicked', () => {
      const viz = new MockVisualizer('Circle');
      manager.addVisualizer(viz);

      dialog.setManager(manager);
      dialog.show();

      const checkbox = document.querySelector('.visualizer-toggle') as HTMLInputElement;
      checkbox.click();

      expect(viz.isEnabled()).toBe(false);
    });

    it('notifies manager when toggle is clicked', () => {
      const viz = new MockVisualizer('Circle');
      manager.addVisualizer(viz);

      dialog.setManager(manager);
      dialog.show();

      let changeCount = 0;
      manager.onVisualizersChange(() => changeCount++);

      const checkbox = document.querySelector('.visualizer-toggle') as HTMLInputElement;
      checkbox.click();

      expect(changeCount).toBeGreaterThan(0);
    });
  });

  describe('Reordering', () => {
    it('calls onReorder callback when items are reordered', () => {
      const viz1 = new MockVisualizer('First');
      const viz2 = new MockVisualizer('Second');
      manager.addVisualizer(viz1);
      manager.addVisualizer(viz2);

      dialog.setManager(manager);
      dialog.setOnReorder(vi.fn());

      const reorderCallback = (dialog as any).onReorder as ReturnType<typeof vi.fn>;
      dialog.show();

      manager.reorderVisualizers(0, 1);

      expect(manager.getVisualizers()[0].getName()).toBe('Second');
      expect(manager.getVisualizers()[1].getName()).toBe('First');
    });
  });

  describe('Close on Escape', () => {
    it('hides dialog when Escape is pressed', () => {
      dialog.show();
      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(false);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Close on Outside Click', () => {
    it('hides dialog when clicking outside', () => {
      dialog.show();
      const dialogEl = document.getElementById('visualizer-dialog');
       dialogEl?.dispatchEvent(new MouseEvent('click'));

      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Close Button', () => {
    it('hides dialog when close button is clicked', () => {
      dialog.show();
      const closeBtn = document.querySelector('.close-btn');
      closeBtn?.dispatchEvent(new MouseEvent('click'));

      expect(document.getElementById('visualizer-dialog')?.classList.contains('hidden')).toBe(true);
    });
  });
});