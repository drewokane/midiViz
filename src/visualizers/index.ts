import { BaseVisualizer } from './base-visualizer';
import { CircleVisualizer } from './circle-visualizer';
import { RectBounceVisualizer } from './rect-bounce-visualizer';
import { VisualizerManager } from './manager';
export type { VisualizerChangeCallback } from './manager';

export const visualizerRegistry = [
  CircleVisualizer,
  RectBounceVisualizer,
];

export function createVisualizer(name: string): BaseVisualizer | null {
  switch (name) {
    case 'Circle':
      return new CircleVisualizer();
    case 'RectBounceVisualizer':
      return new RectBounceVisualizer();
    default:
      return null;
  }
}