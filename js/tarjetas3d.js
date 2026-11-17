// Zapatillas en 3D dentro de las tarjetas del catálogo.
// Un solo renderizador WebGL compartido dibuja cada modelo y copia la imagen al lienzo de su tarjeta,
// así no se abre un contexto 3D por tarjeta (los móviles admiten muy pocos a la vez).

const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const LADO = Math.min(960, Math.round(480 * Math.min(window.devicePixelRatio || 1, 2)));
const estados = new Map(); // lienzo -> estado
let motor = null;
let cargandoMotor = null;
let enMarcha = false;
let ultimo = 0;

const visibilidad = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    const estado = estados.get(e.target);
    if (!estado) continue;
    estado.visible = e.isIntersecting;
    if (estado.visible) activar(estado);
  }
  arrancar();
}, { rootMargin: '120px' });

async function crearMotor() {
  const { THREE, luces, prepararModelo } = await import('./visor3d.js');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(LADO, LADO, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const escena = new THREE.Scene();
  luces(escena, renderer);
  const camara = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  camara.position.set(2.6, 1.1, 3.4).setLength(4.3);
  camara.lookAt(0, 0, 0);
  return { THREE, renderer, escena, camara, prepararModelo };
}

async function activar(estado) {
  if (estado.pedido) return;
  estado.pedido = true;
  try {
    cargandoMotor ||= crearMotor();
    motor = await cargandoMotor;
    const { modelo, sombra } = await motor.prepararModelo(estado.url, { giro: estado.giro });
    const grupo = new motor.THREE.Group();
    grupo.add(modelo, sombra);
    grupo.visible = false;
    motor.escena.add(grupo);
    estado.grupo = grupo;
    estado.modelo = modelo;
    arrancar();
  } catch (err) {
    console.warn('No se pudo cargar el 3D de la tarjeta', err);
  }
}

function dibujar(estado, t) {
  const { grupo, lienzo } = estado;
  estado.angulo += (estado.encima ? 0.03 : 0.008);
  grupo.rotation.y = reducir ? -0.5 : estado.angulo;
  estado.modelo.position.y += (reducir ? 0 : Math.sin(t / 900 + estado.fase) * 0.04) - (estado.flota || 0);
  estado.flota = reducir ? 0 : Math.sin(t / 900 + estado.fase) * 0.04;
  grupo.visible = true;
  motor.renderer.render(motor.escena, motor.camara);
  grupo.visible = false;
  const g = estado.ctx;
  g.clearRect(0, 0, lienzo.width, lienzo.height);
  g.drawImage(motor.renderer.domElement, 0, 0, lienzo.width, lienzo.height);
  if (!estado.listo) {
    estado.listo = true;
    lienzo.classList.add('listo');
  }
}

function bucle(t) {
  let quedan = false;
  if (t - ultimo > 30) {
    ultimo = t;
    for (const [lienzo, estado] of estados) {
      if (!lienzo.isConnected) { soltar(lienzo, estado); continue; }
      if (!estado.visible || !estado.grupo) continue;
      if (reducir && estado.listo) continue;
      dibujar(estado, t);
    }
  }
  for (const estado of estados.values()) {
    if (estado.visible && estado.grupo && !(reducir && estado.listo)) { quedan = true; break; }
  }
  if (quedan) requestAnimationFrame(bucle); else enMarcha = false;
}

function arrancar() {
  if (enMarcha) return;
  enMarcha = true;
  requestAnimationFrame(bucle);
}

function soltar(lienzo, estado) {
  visibilidad.unobserve(lienzo);
  if (estado.grupo) motor.escena.remove(estado.grupo);
  estados.delete(lienzo);
}

function registrar(lienzo) {
  if (estados.has(lienzo)) return;
  lienzo.width = lienzo.height = LADO;
  const estado = {
    lienzo,
    ctx: lienzo.getContext('2d'),
    url: lienzo.dataset.modelo,
    giro: Number(lienzo.dataset.giro || 0),
    angulo: -0.5,
    fase: estados.size * 1.3,
    visible: false,
    encima: false
  };
  estados.set(lienzo, estado);
  const tarjeta = lienzo.closest('.tarjeta');
  if (tarjeta) {
    tarjeta.addEventListener('pointerenter', () => { estado.encima = true; });
    tarjeta.addEventListener('pointerleave', () => { estado.encima = false; });
  }
  visibilidad.observe(lienzo);
}

export function activarTarjetas3D(raiz = document) {
  raiz.querySelectorAll('canvas[data-modelo]').forEach(registrar);
}

// Las tarjetas se pintan y repintan desde varias vistas: se recogen solas al aparecer en la página.
export function vigilarTarjetas3D() {
  activarTarjetas3D();
  new MutationObserver(() => activarTarjetas3D()).observe(document.body, { childList: true, subtree: true });
}
