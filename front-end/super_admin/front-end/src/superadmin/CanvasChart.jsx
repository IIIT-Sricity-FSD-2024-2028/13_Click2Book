/**
 * Dependency-free Canvas 2D charts (bar, line) for the Super Admin revenue page,
 * ported from the original inline CanvasChart helpers.
 */
import { useEffect, useRef } from 'react';

function setup(canvas, padding) {
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400;
  const H = canvas.offsetHeight || 220;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, W, H);
  return { ctx, W, H, chartW: W - padding.left - padding.right, chartH: H - padding.top - padding.bottom };
}

/** Round the axis maximum up so the 4 grid steps are clean numbers (1, 2, 2.5, 5 × 10ⁿ). */
function niceMax(v) {
  if (!(v > 0)) return 4;
  const raw = v / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  return Math.max(4, step * 4);
}

function gridLines(ctx, pad, chartW, chartH, max, format) {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + chartH - (i / 4) * chartH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(format(Math.round((i / 4) * max)), pad.left - 6, y + 4);
  }
}

function drawBar(canvas, labels, values, color) {
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const { ctx, H, chartW, chartH } = setup(canvas, pad);
  const max = niceMax(Math.max(...values));
  gridLines(ctx, pad, chartW, chartH, max, (v) => v);
  const gap = chartW / labels.length;
  const barW = gap * 0.55;
  labels.forEach((lbl, i) => {
    const x = pad.left + i * gap + gap * 0.225;
    const bH = (values[i] / max) * chartH;
    const y = pad.top + chartH - bH;
    const r = 4;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, y + bH);
    ctx.lineTo(x, y + bH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.font = '10px system-ui,sans-serif';
    ctx.fillText(lbl, x + barW / 2, H - pad.bottom + 14);
  });
}

function drawLine(canvas, labels, values, strokeColor, fillColor) {
  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const { ctx, H, chartW, chartH } = setup(canvas, pad);
  const max = niceMax(Math.max(...values));
  gridLines(ctx, pad, chartW, chartH, max, (v) => (v >= 1000 ? +(v / 1000).toFixed(1) + 'K' : v));
  const pts = labels.map((_, i) => ({
    x: pad.left + (i / (labels.length - 1)) * chartW,
    y: pad.top + chartH - (values[i] / max) * chartH,
  }));
  const curve = () =>
    pts.forEach((p, i) => {
      if (i === 0) ctx.lineTo(p.x, p.y);
      else ctx.bezierCurveTo((pts[i - 1].x + p.x) / 2, pts[i - 1].y, (pts[i - 1].x + p.x) / 2, p.y, p.x, p.y);
    });
  // Fill area
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pad.top + chartH);
  curve();
  ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  // Line
  ctx.beginPath();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.moveTo(pts[0].x, pts[0].y);
  curve();
  ctx.stroke();
  // Dots + x labels
  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.font = '10px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], p.x, H - pad.bottom + 14);
  });
}

/** <CanvasChart type="bar"|"line" labels values color [fill] /> — redraws on resize. */
export default function CanvasChart({ id, type, labels, values, color, fill }) {
  const ref = useRef(null);
  useEffect(() => {
    const draw = () => {
      if (!ref.current) return;
      if (type === 'line') drawLine(ref.current, labels, values, color, fill);
      else drawBar(ref.current, labels, values, color);
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [type, labels, values, color, fill]);
  return <canvas id={id} ref={ref} />;
}
