import p5 from 'p5';
import { BaseVisualizer } from './base-visualizer';
import { MidiEvent } from '../midi-events';

interface ArcRing {
    radiusScale: number;
    innerCutoutScale: number;
    rotationSpeed: number;
    rotation: number;
}

export class ArcRotateVisualizer extends BaseVisualizer {
    private baseRadius: number = 0;
    private centerX: number = 0;
    private centerY: number = 0;
    private rings: ArcRing[] = [];

    constructor() {
        super('ArcRotateVisualizer');
    }

    init(sketch: p5 | p5.Graphics, width: number, height: number): void {
        this.sketch = sketch;
        this.width = width;
        this.height = height;
        this.baseRadius = Math.min(width, height) * 0.9;
        this.centerX = width / 2;
        this.centerY = height / 2;

        // Define arc rings (outer to inner)
        this.rings = [
            { radiusScale: 1.0, innerCutoutScale: 0.9, rotationSpeed: 0.01, rotation: 0 },
            { radiusScale: 0.6, innerCutoutScale: 0.85, rotationSpeed: -0.008, rotation: 0 },
            { radiusScale: 0.3, innerCutoutScale: 0.7, rotationSpeed: 0.004, rotation: 0 }
        ];
    }

    handleMidiEvent(event: MidiEvent): void {
        if (event.type === 'noteOn' && this.sketch) {
            // Jump outer ring by 90 degrees
            this.rings[0].rotation += this.sketch.HALF_PI;
            
            // Reverse middle ring direction
            this.rings[1].rotationSpeed *= -1;
            
            // Random jump for inner ring
            if (this.sketch.PI) {
                this.rings[2].rotation -= Math.random() * this.sketch.PI;
            }
        }
    }
    
    update(): void {
        // Update all ring rotations
        for (const ring of this.rings) {
            ring.rotation += ring.rotationSpeed;
        }
    }
    
    draw(): void {
        if (!this.sketch) return;
        
        // Draw each ring
        for (const ring of this.rings) {
            this.drawArcRing(ring);
        }
    }

    private drawArcRing(ring: ArcRing): void {
        if (!this.sketch) return;

        const outerRadius = this.baseRadius * ring.radiusScale;
        const innerRadius = outerRadius * ring.innerCutoutScale;
        const strokeWidth = outerRadius - innerRadius;

        this.sketch.push();
        this.sketch.translate(this.centerX, this.centerY);
        this.sketch.rotate(ring.rotation);
        
        // Draw arc as a thick stroke instead of filled shape
        this.sketch.noFill();
        this.sketch.stroke(255);
        this.sketch.strokeWeight(strokeWidth);
        this.sketch.strokeCap(this.sketch.SQUARE);
        
        // Draw arc at the midpoint radius between inner and outer
        const midRadius = (outerRadius + innerRadius) / 2;
        this.sketch.arc(0, 0, midRadius, midRadius, 0, this.sketch.HALF_PI);
        
        this.sketch.pop();
    }
    
    destroy(): void {
        this.rings = [];
    }
}
