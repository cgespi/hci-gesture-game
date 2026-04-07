import './style.css';
const app = document.querySelector<HTMLElement>('#app')!;

const canvas = document.createElement('canvas');
const exit = document.createElement('button');
const status = document.createElement('div');
const root = document.createElement('div');

root.id = 'gameRoot';
canvas.id = 'gameCanvas';
exit.textContent = 'Exit';
status.textContent = 'Move the mouse';

Object.assign(root.style, { position: 'fixed', inset: '0', overflow: 'hidden', background: '#0f1113' });
Object.assign(canvas.style, { display: 'block', width: '100%', height: '100%' });
Object.assign(exit.style, { position: 'absolute', right: '12px', top: '12px' });
Object.assign(status.style, { position: 'absolute', left: '12px', top: '12px' });

root.appendChild(canvas);
root.appendChild(exit);
root.appendChild(status);
app.appendChild(root);

const ctx = canvas.getContext('2d')!;
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, inside: false };

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  drawLine(); // redraw after resize
}
window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.inside = true;
  status.textContent = `Mouse: ${mouse.x}, ${mouse.y}`;
  drawLine(); // redraw on mouse move
});
canvas.addEventListener('mouseenter', (e) => { mouse.inside = true; mouse.x = e.clientX; mouse.y = e.clientY; drawLine(); });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; status.textContent = 'mouse outside'; drawLine(); });

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
}

function drawLine() {
  clear();
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight;

  ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(cx - 5), Math.round(cy - 5), 10, 10);


  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(mouse.x, mouse.y);
  ctx.stroke();

  if (mouse.inside) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(mouse.x - 5), Math.round(mouse.y - 5), 10, 10);
  }
}

exit.addEventListener('click', () => {
    window.location.href = '/';
});
