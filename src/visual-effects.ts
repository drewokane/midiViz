import p5 from 'p5';

export function drawScanlines(p: p5, counter: number): void {
  const w = p.width;
  const h = p.height;
  let r = 0.5;

  p.noFill();
  for (let y = 0; y < h; y += 3) {
    p.strokeWeight(1 + 0.5 * Math.sin(counter * 0.05 * (1 + r) + y * 0.05));
    p.stroke('rgba(142, 35, 192, 0.05)');
    p.line(0, y, w, y);
  }
}

export function drawVignette(p: p5): void {
  const w = p.width;
  const h = p.height;

  p.noStroke();
  const ctx = p.drawingContext as CanvasRenderingContext2D;
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
  grad.addColorStop(0, 'rgba(53, 192, 35, 0.76)');
  grad.addColorStop(0.7, 'rgba(26, 61, 158, 0.96)');
  grad.addColorStop(1, 'rgba(79, 7, 107, 0.8)');
  ctx.fillStyle = grad;
  p.rect(0, 0, w, h);
}

export function drawDotMatrix(p: p5, counter: number): void {
  const w = p.width;
  const h = p.height;
  const dotSize = 1;
  const spacing = 15;
  const funcs = [Math.sin, Math.cos, (x: number) => Math.sin(x) * Math.cos(x)];
  const func = funcs[Math.floor(counter / 100) % funcs.length];

  for (let x = 0; x < w; x += spacing) {
    for (let y = 0; y < h; y += spacing) {
      const brightness = (func(counter * 0.1 + (x + y) * 0.05) + 1) / 2;
      p.fill(255, brightness * 255);
      p.circle(x, y, dotSize * Math.random());
    }
  }
}

export function drawRandomRectGlitch(p: p5, counter: number): void {
  const w = p.width;
  const h = p.height;

  if (counter % 20 === 0) {
    const rectWidth = Math.random() * 100 + 20;
    const rectHeight = Math.random() * 100 + 20;
    const x = Math.random() * (w - rectWidth);
    const y = Math.random() * (h - rectHeight);
    p.fill(Math.random() *255, Math.random() * 255, Math.random() * 255, 150);
    p.noStroke();
    p.rect(x, y, rectWidth, rectHeight);
  }
}

export function drawVisualEffects(p: p5, counter: number): void {
//  drawScanlines(p, counter);
//  drawVignette(p);
//  drawDotMatrix(p, counter);
//  drawRandomRectGlitch(p, counter);
}