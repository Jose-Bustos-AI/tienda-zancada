// Zapatilla flotante en 3D: la foto recortada se gira con el ratón o el dedo, con grosor, brillo y sombra.
// En las tarjetas se balancea sola y se inclina al pasar el cursor; en la ficha se arrastra hacia cualquier lado.

const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const tactil = window.matchMedia('(hover: none)').matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const recorte = (p) => p.imagen.replace(/\.webp$/, '-recorte.webp');

export function htmlFlotante(p, { ficha = false, alt = '' } = {}) {
  const src = recorte(p);
  const capas = ficha ? 9 : 5;
  return `<div class="flot ${ficha ? 'flot--ficha' : ''}" data-flot="${ficha ? 'ficha' : 'tarjeta'}" style="--fondo:${p.fondo}">
    <div class="flot__escena">
      <div class="flot__pieza">
        ${Array.from({ length: capas }, (_, i) => `<img class="flot__capa" src="${src}" alt="" aria-hidden="true" style="--z:${capas - i}" draggable="false">`).join('')}
        <img class="flot__img" src="${src}" alt="${esc(alt)}" draggable="false">
        <span class="flot__brillo" style="-webkit-mask-image:url(${src});mask-image:url(${src})" aria-hidden="true"></span>
      </div>
    </div>
    <span class="flot__sombra" aria-hidden="true"></span>
    ${ficha ? '<span class="flot__pista" aria-hidden="true">Arrástrala hacia cualquier lado</span>' : ''}
  </div>`;
}

const LIMITES = { ficha: { y: 65, x: 42 }, tarjeta: { y: 20, x: 14 } };
const estados = new WeakMap();
let enMarcha = false;
const visibles = new Set();
const observador = 'IntersectionObserver' in window
  ? new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target))), { rootMargin: '80px' })
  : null;

function preparar(el) {
  const tipo = el.dataset.flot;
  const s = { tipo, rx: 0, ry: 0, ox: 0, oy: 0, mx: 0, my: 0, hover: false, drag: null, fase: Math.random() * 6.28, tocado: false };
  estados.set(el, s);
  el.dataset.listo = '1';
  observador ? observador.observe(el) : visibles.add(el);
  const lim = LIMITES[tipo];

  if (tipo === 'tarjeta') {
    if (tactil) return;
    el.addEventListener('pointerenter', () => { s.hover = true; });
    el.addEventListener('pointerleave', () => { s.hover = false; });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      s.mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      s.my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    return;
  }

  // Ficha: se arrastra con el ratón o el dedo y vuelve a su sitio con un muelle.
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    s.drag = { x: e.clientX, y: e.clientY, ry: s.oy, rx: s.ox };
    el.classList.add('arrastrando');
    if (!s.tocado) { s.tocado = true; el.classList.add('tocado'); }
  });
  el.addEventListener('pointermove', (e) => {
    if (!s.drag) return;
    const dx = e.clientX - s.drag.x;
    const dy = e.clientY - s.drag.y;
    s.oy = Math.max(-lim.y, Math.min(lim.y, s.drag.ry + dx * 0.45));
    s.ox = Math.max(-lim.x, Math.min(lim.x, s.drag.rx - dy * 0.4));
  });
  const soltar = () => { s.drag = null; el.classList.remove('arrastrando'); };
  el.addEventListener('pointerup', soltar);
  el.addEventListener('pointercancel', soltar);
  // Con el teclado también se mueve (flechas).
  el.tabIndex = 0;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', 'Zapatilla en 3D. Arrástrala o usa las flechas para girarla.');
  el.addEventListener('keydown', (e) => {
    const paso = { ArrowLeft: [0, -12], ArrowRight: [0, 12], ArrowUp: [8, 0], ArrowDown: [-8, 0] }[e.key];
    if (!paso) return;
    e.preventDefault();
    s.ox = Math.max(-lim.x, Math.min(lim.x, s.ox + paso[0]));
    s.oy = Math.max(-lim.y, Math.min(lim.y, s.oy + paso[1]));
    s.teclaHasta = performance.now() + 1500;
  });
}

function pintar(el, s) {
  const p = el.querySelector('.flot__pieza');
  p.style.transform = `rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg)`;
  el.style.setProperty('--gx', `${50 + s.ry * 0.9}%`);
  el.style.setProperty('--gy', `${40 - s.rx * 1.1}%`);
  el.style.setProperty('--sx', `${(-s.ry * 0.35).toFixed(1)}px`);
  el.style.setProperty('--ss', (1 - Math.abs(s.rx) / 140).toFixed(3));
}

function bucle(t) {
  const seg = t / 1000;
  for (const el of document.querySelectorAll('[data-flot]:not([data-listo])')) preparar(el);
  for (const el of visibles) {
    if (!el.isConnected) { visibles.delete(el); continue; }
    const s = estados.get(el);
    if (!s) continue;
    const lim = LIMITES[s.tipo];
    let tx = 0;
    let ty = 0;
    if (s.tipo === 'tarjeta') {
      if (s.hover) { ty = s.mx * lim.y; tx = -s.my * lim.x; } else if (!reducir) { ty = Math.sin(seg * 0.7 + s.fase) * 9; tx = Math.sin(seg * 0.5 + s.fase) * 3; }
    } else if (s.drag || (s.teclaHasta && t < s.teclaHasta)) {
      ty = s.oy; tx = s.ox;
    } else {
      // Al soltarla vuelve poco a poco al centro y se queda balanceándose.
      s.oy *= 0.94; s.ox *= 0.94;
      ty = s.oy + (reducir ? 0 : Math.sin(seg * 0.6 + s.fase) * 14);
      tx = s.ox + (reducir ? 0 : Math.sin(seg * 0.45 + s.fase) * 5);
    }
    const k = s.drag ? 0.35 : 0.1;
    s.rx += (tx - s.rx) * k;
    s.ry += (ty - s.ry) * k;
    pintar(el, s);
  }
  requestAnimationFrame(bucle);
}

export function animarFlotantes() {
  if (enMarcha) return;
  enMarcha = true;
  requestAnimationFrame(bucle);
}
