import './style.css';
const app = document.querySelector<HTMLElement>('#app')!;

const canvas = document.createElement('canvas');
const exit = document.createElement('button');
const addHit = document.createElement('button');
const addMiss = document.createElement('button');
const status = document.createElement('div');
const root = document.createElement('div');
const ball = {
  x: 0,
  y: 0,
  t: 0,
};


let cannonX = 0;
let cannonY = 0;
let hitCount = 0;
let missCount = 0;


root.id = 'gameRoot';
canvas.id = 'gameCanvas';
exit.textContent = 'Exit';
status.textContent = 'Move the mouse';
addHit.textContent = 'Add Hit';
addMiss.textContent = 'Add Miss';

Object.assign(root.style, { position: 'fixed', inset: '0', overflow: 'hidden', background: '#307bc6' });
Object.assign(canvas.style, {display: 'block', top: '0', left: '0', width: '100%', height: '100%' });
Object.assign(exit.style, { position: 'absolute', right: '12px', top: '12px' });
Object.assign(addHit.style, { position: 'absolute', right: '12px', top: '64px' });
Object.assign(addMiss.style, { position: 'absolute', right: '12px', top: '120px' });
Object.assign(status.style, {color: '#fff',  position: 'absolute', left: '12px', top: '12px' });

root.appendChild(canvas);
root.appendChild(exit);
root.appendChild(addHit);
root.appendChild(addMiss);
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
  drawCannon();
}
window.addEventListener('resize', resize);
resize();

canvas.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.inside = true;
  status.textContent = `Mouse: ${mouse.x}, ${mouse.y}, hitCount: ${hitCount}, missCount: ${missCount}`;
  drawLine(); // redraw on mouse move
});
canvas.addEventListener('mouseenter', (e) => { mouse.inside = true; mouse.x = e.clientX; mouse.y = e.clientY; drawLine(); });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; status.textContent = `mouse outside, hitCount: ${hitCount}, missCount: ${missCount}`; drawLine(); });

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
}

function launch(){
  const arcHeight = 50;
  ball.t += 0.03;
  if (ball.t > 1){
    ball.t = 1;
    ctx.fillStyle ='#fff732';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  

  ball.x = cannonX + (mouse.x - cannonX) * ball.t;
  const yLinear = cannonY + (mouse.y - cannonY) * ball.t;
  ball.y = yLinear - arcHeight * (4 * ball.t * (1 - ball.t));


  ctx.fillStyle ='#000';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 5, 0, Math.PI * 2);
  ctx.fill();

  if (ball.t < 1) requestAnimationFrame(launch);

}

function drawCannon(){
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight/2;
  ctx.fillStyle = '#aaa';
  ctx.fillRect(Math.round(cx - 25), Math.round(cy - 25), 50, 50);

  ctx.fillStyle = "#c12d1c";
  ctx.beginPath();
  ctx.arc(cx,cy, 10, 0, Math.PI * 2);
  ctx.fill();

  if (mouse.inside) {
    const angle = Math.atan2(mouse.y - cy, mouse.x - cx);

    

    const length = 120;
    const x = cx + length * Math.cos(angle);
    const y = cy + length * Math.sin(angle);
    const x2 = cx + length * Math.cos(angle+0.03*Math.PI);
    const y2 = cy + length * Math.sin(angle+0.03*Math.PI);
    const x3 = cx + length * Math.cos(angle-0.03*Math.PI);
    const y3 = cy + length * Math.sin(angle-0.03*Math.PI);


    ctx.strokeStyle = "#c12d1c";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    ctx.fillStyle = "#c12d1c";
    ctx.beginPath();
    ctx.arc(x,y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x,y, 15, 0, Math.PI * 2);
    ctx.fill();

    cannonX = x;
    cannonY = y;
  } 
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

  drawCannon();
}

addHit.addEventListener('click', () => {
    hitCount++;
    status.textContent = `Mouse: ${mouse.x}, ${mouse.y}, hitCount: ${hitCount}, missCount: ${missCount}`;
});

addMiss.addEventListener('click', () => {
    missCount++;
    status.textContent = `Mouse: ${mouse.x}, ${mouse.y}, hitCount: ${hitCount}, missCount: ${missCount}`;
});

canvas.addEventListener('click', () => {
  ball.t = 0;
  launch();
});

exit.addEventListener('click', () => {
  const stats = {
    hits: hitCount,
    misses: missCount,
  }

  sessionStorage.setItem('gameStats', JSON.stringify(stats))
    window.location.href = '/postGame';
});
