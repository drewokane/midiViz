import p5 from "p5";
import { BaseVisualizer } from "./base-visualizer";
import { MidiEvent } from "../midi-events";
import { lerp } from "../utils/lerp";

class Rectangle {
    // Rectangles in p5 are defined by upper left point,
    // width and height
    x: number;
    y: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
    h: number;
    hue: number = 200;
    saturation: number = 100;
    brightness: number = 100;
    alpha: number = 80;
    moving: boolean = false;
    point: number = 2;
    vertical: boolean = Math.random() > 0.5;

    constructor(x1: number, y1:number, x2: number, y2: number, w: number, h: number) {
        this.x = x1;
        this.y = y1;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.w = w;
        this.h = h;
    }

    draw(p: p5) {
        p.noStroke();
        p.fill(this.hue, this.saturation, this.brightness, this.alpha)
        p.rect(this.x, this.y, this.w, this.h, 6)
    }

    update() {
        if (!this.moving) return;
        
        const lerpFactor = .08; // Slower for more visible animation
        let targetX = this.x;
        let targetY = this.y;
        
        // Determine target based on point (1 or 2)
        if (this.point === 1) {
            targetX = this.x1;
            targetY = this.y1;
        } else if (this.point === 2) {
            targetX = this.x2;
            targetY = this.y2;
        }
        
        // Lerp ONLY on the active axis, lock the other axis
        if (this.vertical) {
            this.y = lerp(this.y, targetY, lerpFactor);
            // Lock X to the target X (don't let it drift)
            //this.x = targetX;
        } else {
            this.x = lerp(this.x, targetX, lerpFactor);
            // Lock Y to the target Y (don't let it drift)
            //this.y = targetY;
        }
        
        // Check if close enough to target (within 0.5 pixels)
        const threshold = 0.5;
        const distX = Math.abs(this.x - targetX);
        const distY = Math.abs(this.y - targetY);
        const atTarget = this.vertical ? distY < threshold : distX < threshold;
        
        if (atTarget) {
            // Snap ONLY the axis that was moving
            if (this.vertical) {
                this.y = targetY;
                // Don't snap X - leave it where it is
            } else {
                this.x = targetX;
                // Don't snap Y - leave it where it is
            }
            
            // Toggle between point 1 and 2
            this.point = this.point === 1 ? 2 : 1;
            
            // Stop moving (don't toggle vertical here - let MIDI trigger decide)
            this.moving = false;
        }
    }

    reset() {
    }
}

export class RectSlideVisualizer extends BaseVisualizer {
    private rectangles: Rectangle[] = [];
    private numRectangles: number = 5;

    constructor() {
        super('RectSlideVisualizer')
    }

    init(sketch: p5, width: number, height: number): void {
        this.sketch = sketch;
        this.width = width;
        this.height = height;
        
        for (let i = 0; i < this.numRectangles; i++) {
            let randomX1, randomX2, randomY1, randomY2, randomWidth, randomHeight;
            randomWidth = Math.random() * (90 - 30) + 120;
            randomHeight = Math.random() * (75 - 20) + 80;
            randomX1 = Math.random() * (this.width - randomWidth);
            randomY1 = Math.random() * (this.height - randomHeight);
            randomX2 = Math.random() * (this.width - randomWidth);
            randomY2 = Math.random() * (this.height - randomHeight);
            
            // Create rectangle
            const rect = new Rectangle(randomX1, randomY1, randomX2, randomY2, randomWidth, randomHeight);
            
            // Randomize hue (0-360)
            rect.hue = Math.random() * 360;
            
            // Set transparency
            rect.alpha = 60;
            
            this.rectangles.push(rect);
        }
    }

    handleMidiEvent(event: MidiEvent): void {
        switch (event.type) {
            case 'noteOn':
                this.rectangles.forEach((rect, i) => {
                    // Always toggle direction on every note
                    rect.vertical = !rect.vertical;
                    rect.moving = true;
                });
                break;
                
            case 'controlChange':
                this.handleControlChange(event.controller, event.value);
                break;
        }
    }

    private handleControlChange(controller: number, value: number): void {
        // CC#7 (volume) controls brightness for all rectangles
        if (controller === 7) {
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
            if (!rect.moving) {
                rect.reset();
            }
        });
    }

    destroy(): void {
        this.rectangles = [];
    }
}