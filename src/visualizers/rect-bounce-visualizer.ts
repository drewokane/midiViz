import p5 from "p5";
import { BaseVisualizer } from "./base-visualizer";
import { MidiEvent } from "../midi-events";
import { lerp } from "../utils/lerp";
import { getRandomPaletteColor, mapCCToPaletteIndex } from "../color-palette";

class Rectangle {
    // Rectangles in p5 are defined by upper left point,
    // width and height
    x: number;
    xx: number
    y: number;
    yy: number;
    w: number;
    ww: number;
    h: number;
    hh: number;
    baseX: number;
    baseY: number;
    baseWidth: number;
    baseHeight: number;
    canvasWidth: number = 800;
    canvasHeight: number = 600;
    hue: number = 200;
    saturation: number = 100;
    brightness: number = 100;
    alpha: number = 80;
    bounceSize: number = 5;
    hit: boolean = false;
    expansionFactor: number = 1.5;


    constructor(x: number, y:number, w: number, h: number) {
        this.x = x;
        this.xx = x;
        this.y = y;
        this.yy = y;
        this.w = w;
        this.ww = w;
        this.h = h;
        this.hh = h;
        this.baseX = x;
        this.baseY = y;
        this.baseWidth = w;
        this.baseHeight = h;
    }

    draw(p: p5) {
        p.noStroke();
        p.fill(this.hue, this.saturation, this.brightness, this.alpha)
        p.rect(this.x, this.y, this.w, this.h, 6)
    }

    update() {
        if (!this.hit) return;
        
        const lerpFactor = .8;
        
        // Lerp all dimensions toward targets
        this.x = lerp(this.x, this.xx, lerpFactor);
        this.y = lerp(this.y, this.yy, lerpFactor);
        this.w = lerp(this.w, this.ww, lerpFactor);
        this.h = lerp(this.h, this.hh, lerpFactor);
        
        // Check if close enough to target (within 0.5 pixels)
        const threshold = 0.5;
        if (Math.abs(this.x - this.xx) < threshold &&
            Math.abs(this.y - this.yy) < threshold &&
            Math.abs(this.w - this.ww) < threshold &&
            Math.abs(this.h - this.hh) < threshold) {
            // Snap to base position and dimensions
            this.x = this.baseX;
            this.y = this.baseY;
            this.w = this.baseWidth;
            this.h = this.baseHeight;
            this.xx = this.baseX;
            this.yy = this.baseY;
            this.ww = this.baseWidth;
            this.hh = this.baseHeight;
            this.hit = false;
        }
    }

    triggerBounce() {
        this.hit = true;
        
        // Calculate expanded dimensions
        this.ww = this.baseWidth * this.expansionFactor;
        this.hh = this.baseHeight * this.expansionFactor;
        
        // Expand from BASE position, not current
        this.xx = this.baseX - (this.ww - this.baseWidth) / 2;
        this.yy = this.baseY - (this.hh - this.baseHeight) / 2;
        
        // Clamp to canvas bounds
        this.xx = Math.max(0, Math.min(this.xx, this.canvasWidth - this.ww));
        this.yy = Math.max(0, Math.min(this.yy, this.canvasHeight - this.hh));
    }

    reset() {
        // Return to base dimensions
        this.xx = this.baseX;
        this.yy = this.baseY;
        this.ww = this.baseWidth;
        this.hh = this.baseHeight;
    }
}

export class RectBounceVisualizer extends BaseVisualizer {
    private rectangles: Rectangle[] = [];
    private numRectangles: number = 10;
    private originalDimensions: Array<{x: number, y: number, w: number, h: number}> = [];
    private paletteIndex: number = 0;

    constructor() {
        super('RectBounceVisualizer')
    }

    init(sketch: p5, width: number, height: number): void {
        this.sketch = sketch;
        this.width = width;
        this.height = height;

        const minSpacing = 5;
        
        for (let i = 0; i < this.numRectangles; i++) {
            let randomX, randomY, randomWidth, randomHeight;
            let validPosition = false;
            let attempts = 0;
            
            // Generate random position with minimum spacing constraint
            while (!validPosition && attempts < 50) {
                randomWidth = Math.random() * (90 - 30) + 120;
                randomHeight = Math.random() * (75 - 20) + 80;
                randomX = Math.random() * (this.width - randomWidth);
                randomY = Math.random() * (this.height - randomHeight);
                
                // Check spacing against existing rectangles
                validPosition = this.checkSpacing(
                    randomX, randomY, randomWidth, randomHeight, 
                    minSpacing
                );
                attempts++;
            }
            
            // Create rectangle
            const rect = new Rectangle(randomX, randomY, randomWidth, randomHeight);
            rect.baseX = randomX;
            rect.baseY = randomY;
            rect.baseWidth = randomWidth;
            rect.baseHeight = randomHeight;
            rect.canvasWidth = this.width;
            rect.canvasHeight = this.height;
            
            // Randomize hue from palette
            const palColor = getRandomPaletteColor();
            rect.hue = palColor.hue;
            
            // Set transparency
            rect.alpha = 60;
            
            this.rectangles.push(rect);
            this.originalDimensions.push({
                x: randomX, 
                y: randomY, 
                w: randomWidth, 
                h: randomHeight
            });
        }
    }

    private checkSpacing(
        x: number, y: number, w: number, h: number, 
        minSpacing: number
    ): boolean {
        for (const rect of this.rectangles) {
            // Check if rectangles are too close (AABB collision with spacing)
            if (!(x + w + minSpacing < rect.x ||
                  x - minSpacing > rect.x + rect.w ||
                  y + h + minSpacing < rect.y ||
                  y - minSpacing > rect.y + rect.h)) {
                return false;
            }
        }
        return true;
    }

    handleMidiEvent(event: MidiEvent): void {
        switch (event.type) {
            case 'noteOn':
                // Map note to rectangle index (modulo for wrapping)
                const index = event.noteNumber % this.numRectangles;
                const rect = this.rectangles[index];
                
                // Trigger bounce effect
                rect.triggerBounce();
                break;
                
            case 'controlChange':
                this.handleControlChange(event.controller, event.value);
                break;
        }
    }

    private handleControlChange(controller: number, value: number): void {
        // CC#1 (modulation) selects palette index for new elements
        if (controller === 1) {
            this.paletteIndex = mapCCToPaletteIndex(value);
        }
        // CC#7 (volume) controls brightness for all rectangles
        else if (controller === 7) {
            const brightness = (value / 127) * 100;
            this.rectangles.forEach(rect => {
                rect.brightness = brightness;
            });
        }
        // CC#10 (pan) controls saturation for all rectangles
        else if (controller === 10) {
            const saturation = (value / 127) * 100;
            this.rectangles.forEach(rect => {
                rect.saturation = saturation;
            });
        }
    }

    draw(): void {
        if (!this.sketch) return;
        
        // Draw all rectangles
        this.rectangles.forEach(rect => {
            rect.draw(this.sketch!);
        });
    }

    update(): void {
        // Update all rectangles (handles lerp animation)
        this.rectangles.forEach((rect, index) => {
            rect.update();
            
            // If animation finished, ensure it's reset to original
            if (!rect.hit) {
                rect.reset();
            }
        });
    }

    destroy(): void {
        this.rectangles = [];
        this.originalDimensions = [];
    }
}