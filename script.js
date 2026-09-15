(() => {
  'use strict';
  const poster = document.getElementById('poster');
  const fly = document.getElementById('fly');
  const label = document.getElementById('fly-label');
  const status = document.getElementById('flight-status');
  const motion = document.getElementById('motion');
  const sound = document.getElementById('sound');
  const canvas = document.getElementById('celebration');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let audible = false;
  let busy = false;
  let audioContext;
  let particles = [];
  let frame = 0;
  let lastTime = 0;
  let width = 0;
  let height = 0;
  let flights = 0;
  let flightTimer;
  const slot = document.getElementById('slot-machine');
  const slotResult = document.getElementById('slot-result');
  const reelStrips = [...document.querySelectorAll('.reel-strip')];
  let slotTimer;
  let slotBusy = false;
  let luckySpins = 0;

  // Fixed placements make the printed composition stable on every visit.
  const sparkles = document.getElementById('sparkles');
  for (let i = 0; i < 46; i++) {
    const star = document.createElement('span');
    star.className = 'sparkle';
    star.textContent = i % 3 === 0 ? '✧' : '✦';
    star.style.cssText = `left:${(i * 37 + 7) % 96}%;top:${(i * 23 + 13) % 82 + 4}%;font-size:${14 + i % 5 * 7}px;--duration:${3 + i % 4}s;--delay:-${i % 7}s`;
    sparkles.appendChild(star);
  }

  // Attach different highlights to object edges so they move with the collage.
  let glintIndex = 0;
  function glint(host, x, y, size, kind = 'cross') {
    const element = document.createElement('i');
    element.className = `edge-glint glint-${kind}`;
    element.setAttribute('aria-hidden', 'true');
    element.style.cssText = `--gx:${x}%;--gy:${y}%;--gs:${size}px;--gd:${3.2 + glintIndex % 5 * .7}s;--delay:-${glintIndex * .73}s`;
    host.appendChild(element);
    glintIndex++;
  }
  const edgeTargets = [
    ['.ace', [[0,8,68,'needle'],[96,91,48,'cross']]],
    ['.coin', [[12,15,70,'sun'],[87,72,44,'lens']]],
    ['.seal', [[83,12,67,'needle'],[10,79,38,'prism']]],
    ['.banknote', [[7,7,43,'cross']]],
    ['.vertical-banner', [[50,0,57,'lens'],[50,100,45,'needle']]],
    ['.title-block h1', [[5,40,78,'needle'],[40,5,62,'cross'],[78,70,54,'prism'],[98,30,76,'lens']]],
    ['.fly-button', [[0,0,55,'needle'],[100,100,50,'cross']]],
    ['.casino-chip', [[18,14,40,'cross']]],
    ['.ingot', [[65,12,63,'sun']]],
    ['.wealth-badge', [[90,10,60,'lens']]],
    ['.slot-machine', [[6,10,64,'needle'],[96,63,47,'lens']]],
    ['.cash-bundle', [[13,8,47,'cross']]],
    ['.bootleg-disc', [[77,19,61,'prism']]],
    ['.grand-opening', [[0,50,53,'needle'],[100,50,53,'needle']]],
    ['#car-glints', [[17,47,88,'lens'],[84,47,100,'needle'],[50,4,49,'prism'],[9,90,59,'cross'],[90,94,46,'sun']]],
    ['#mansion-glints', [[24,9,73,'needle'],[76,9,66,'sun'],[39,30,46,'prism'],[63,33,60,'cross'],[5,63,67,'lens'],[96,63,53,'needle']]]
  ];
  for (const [selector, points] of edgeTargets) {
    for (const host of document.querySelectorAll(selector)) {
      for (const point of points) glint(host, ...point);
    }
  }
  const lights = document.getElementById('marquee-lights');
  for (let side = 0; side < 4; side++) {
    const count = side < 2 ? 42 : 24;
    for (let i = 0; i < count; i++) {
      const bulb = document.createElement('i');
      const position = 1 + i / (count - 1) * 98;
      bulb.className = 'marquee-bulb';
      bulb.style.cssText = `${side < 2 ? `left:${position}%;${side === 0 ? 'top' : 'bottom'}:3px` : `top:${position}%;${side === 2 ? 'left' : 'right'}:3px`};--delay:-${i % 4 * .45}s`;
      lights.appendChild(bulb);
    }
  }
  const fortune = document.getElementById('flying-fortune');
  for (let i = 0; i < 12; i++) {
    const item = document.createElement('span');
    item.className = i % 3 === 0 ? 'fortune-piece mini-note' : 'fortune-piece red-envelope';
    item.textContent = i % 3 === 0 ? '$888' : ['發', '福', '財'][i % 3];
    item.style.cssText = `--fx:${i % 2 === 0 ? 3 + i * 2.5 : 97 - i * 2.5}%;--fy:${7 + i * 7}%;--tilt:${i % 2 ? 27 : -24}deg;--delay:-${i * 1.1}s`;
    fortune.appendChild(item);
  }
  const moneyStorm = document.getElementById('money-storm');
  const notePlacements = [[8,4,15,-21],[75,5,17,18],[-3,31,17,-33],[87,33,18,28],[24,39,12,-23],[65,38,13,21],[5,69,15,16],[81,70,16,-17],[26,85,14,-10],[62,84,13,15]];
  for (const [index, placement] of notePlacements.entries()) {
    const [x,y,w,angle] = placement;
    const banknote = document.createElement('div');
    banknote.className = 'loose-banknote';
    banknote.style.cssText = `--nx:${x}%;--ny:${y}%;--nw:${w}%;--nr:${angle}deg;--delay:-${index * .9}s`;
    banknote.innerHTML = `<div class="engraved-note ${index % 3 === 0 ? 'rose-note' : ''}"><small>CPCF INTERNATIONAL RESERVE</small><b>1000000</b><i>${index % 2 ? '財' : '發'}</i><span>壹佰萬圓 · 飛行通寶</span></div>`;
    moneyStorm.appendChild(banknote);
  }

  function resize() {
    width = poster.clientWidth;
    height = poster.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function render(time) {
    const delta = Math.min((time - lastTime) / 16.67 || 1, 2);
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.vy += .025 * delta;
      p.life -= delta;
      p.angle += p.spin * delta;
      ctx.save();
      ctx.globalAlpha = Math.min(p.life / 22, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      if (p.symbol) {
        ctx.font = `bold ${p.size}px Georgia`;
        ctx.fillText(p.symbol, 0, 0);
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
    frame = particles.length ? requestAnimationFrame(render) : 0;
  }

  function burst(x, y, count = 100) {
    if (paused || document.hidden) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * (count > 20 ? 7 : 2);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5,
        life: 45 + Math.random() * 75, size: 4 + Math.random() * 18, angle, spin: (Math.random() - .5) * .08,
        color: ['#ffe69a', '#ffd127', '#fff6cf', '#d12813'][i % 4], symbol: i % 7 === 0 ? '✦' : i % 13 === 0 ? '¥' : '' });
    }
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(render); }
  }

  function chime() {
    if (!audible) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      audioContext.resume();
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const start = audioContext.currentTime + i * .095;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(.07, start + .015);
        gain.gain.exponentialRampToValueAtTime(.001, start + .6);
        oscillator.connect(gain); gain.connect(audioContext.destination);
        oscillator.start(start); oscillator.stop(start + .65);
      });
    } catch { audible = false; updateSound(); }
  }

  function finishFlight() {
    clearTimeout(flightTimer);
    busy = false;
    poster.classList.remove('flying');
    fly.disabled = false;
    label.textContent = '再次起飛';
  }

  fly.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    flights += 1;
    fly.disabled = true;
    label.textContent = '正在起飛';
    status.textContent = `飛行狀態：一飛沖天 ◆ 高度：∞ ◆ 累計起飛：${String(flights).padStart(3, '0')} 次`;
    poster.classList.add('flying');
    chime();
    burst(width * .5, height * .52, 150);
    flightTimer = setTimeout(finishFlight, paused ? 1600 : 3700);
  });

  function finishSpin() {
    clearTimeout(slotTimer);
    slotBusy = false;
    slot.disabled = false;
    slot.classList.remove('spinning');
    slot.classList.add('winner');
    const outcomes = [ ['發', '財源廣進'], ['8', '八方來財'], ['7', '鴻運當頭'], ['★', '一飛沖天'] ];
    const [symbol, blessing] = outcomes[(luckySpins - 1) % outcomes.length];
    for (const strip of reelStrips) strip.textContent = symbol;
    slotResult.textContent = blessing;
    slot.setAttribute('aria-label', '再拉一次好運老虎機');
    if (!paused && !document.hidden) {
      const rect = slot.getBoundingClientRect();
      const bounds = poster.getBoundingClientRect();
      burst(rect.x - bounds.x + rect.width / 2, rect.y - bounds.y + rect.height / 3, 72);
      chime();
    }
  }
  slot.addEventListener('click', () => {
    if (slotBusy) return;
    slotBusy = true;
    luckySpins++;
    slot.disabled = true;
    slot.classList.remove('winner');
    slot.classList.add('spinning');
    slotResult.textContent = '好運轉動中';
    for (const strip of reelStrips) strip.innerHTML = '8<br>發<br>7<br>★<br>8';
    chime();
    slotTimer = setTimeout(finishSpin, paused ? 250 : 1800);
  });

  function updateMotion() {
    poster.classList.toggle('paused', paused);
    motion.setAttribute('aria-pressed', String(paused));
    motion.innerHTML = paused ? '▶ <span>繼續動效</span>' : 'Ⅱ <span>暫停動效</span>';
    motion.title = paused ? '繼續動效' : '暫停動效';
    if (paused) {
      cancelAnimationFrame(frame); frame = 0; particles = [];
      ctx.clearRect(0, 0, width, height);
      document.getElementById('cursor').style.display = 'none';
      if (busy) finishFlight();
      if (slotBusy) finishSpin();
    }
  }
  motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
  reducedMotion.addEventListener('change', event => { paused = event.matches; updateMotion(); });
  updateMotion();

  function updateSound() {
    sound.setAttribute('aria-pressed', String(audible));
    sound.innerHTML = `♪ <span>音效 ${audible ? 'ON' : 'OFF'}</span>`;
    sound.title = audible ? '關閉合成音效' : '開啟合成音效';
  }
  sound.addEventListener('click', () => { audible = !audible; updateSound(); if (audible) chime(); });

  const cursor = document.getElementById('cursor');
  const layers = [...document.querySelectorAll('[data-depth]')];
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lastSparkle = 0;
  poster.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || paused) return;
    pointerX = event.clientX; pointerY = event.clientY;
    cursor.style.display = 'block';
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      cursor.style.left = `${pointerX}px`; cursor.style.top = `${pointerY}px`;
      const x = (pointerX / innerWidth - .5) * 9;
      const y = (pointerY / innerHeight - .5) * 7;
      for (const layer of layers) {
        const depth = Number(layer.dataset.depth);
        layer.style.translate = `${x * depth}px ${y * depth}px`;
      }
      pointerFrame = 0;
    });
    if (event.target.closest('.title-block') && performance.now() - lastSparkle > 140) {
      const rect = poster.getBoundingClientRect();
      burst(event.clientX - rect.left, event.clientY - rect.top, 3);
      lastSparkle = performance.now();
    }
  });
  poster.addEventListener('pointerleave', () => {
    cursor.style.display = 'none';
    for (const layer of layers) layer.style.translate = '';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame); frame = 0; particles = [];
      ctx.clearRect(0, 0, width, height);
      cursor.style.display = 'none';
    }
  });
})();
