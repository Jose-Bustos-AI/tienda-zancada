// Visor 3D de la zapatilla: carga el modelo, lo centra, permite girarlo y cambia sus variantes de color.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const cargador = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cacheModelos = new Map();

function cargarModelo(url, alProgresar) {
  if (!cacheModelos.has(url)) {
    const promesa = new Promise((ok, mal) => {
      cargador.load(url, (gltf) => { alisar(gltf.scene); ok(gltf); }, (e) => {
        if (alProgresar && e.total) alProgresar(e.loaded / e.total);
      }, mal);
    });
    promesa.catch(() => cacheModelos.delete(url));
    cacheModelos.set(url, promesa);
  }
  return cacheModelos.get(url);
}

// Los modelos escaneados llegan sin normales: se calculan suavizadas por posición,
// para que no se vean las caras ni las costuras de la textura.
function alisar(escena) {
  escena.traverse((o) => {
    if (!o.isMesh || o.geometry.attributes.normal) return;
    const g = o.geometry;
    const pos = g.attributes.position;
    const ind = g.index;
    const caras = ind ? ind.count / 3 : pos.count / 3;
    const suma = new Map();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    const clave = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    const claves = new Array(pos.count);
    for (let i = 0; i < pos.count; i++) claves[i] = clave(i);
    for (let f = 0; f < caras; f++) {
      const i0 = ind ? ind.getX(f * 3) : f * 3;
      const i1 = ind ? ind.getX(f * 3 + 1) : f * 3 + 1;
      const i2 = ind ? ind.getX(f * 3 + 2) : f * 3 + 2;
      a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
      n.subVectors(c, b).cross(a.sub(b));
      for (const i of [i0, i1, i2]) {
        const k = claves[i];
        const v = suma.get(k);
        if (v) v.add(n); else suma.set(k, n.clone());
      }
    }
    const normales = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const v = suma.get(claves[i]);
      if (!v) continue;
      n.copy(v).normalize();
      normales[i * 3] = n.x; normales[i * 3 + 1] = n.y; normales[i * 3 + 2] = n.z;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(normales, 3));
    o.material.flatShading = false;
    o.material.metalness = 0;
    o.material.roughness = 0.88;
    o.material.envMapIntensity = 0.75;
    o.material.needsUpdate = true;
  });
}

let sombraComun = null;

// Devuelve el modelo centrado, a escala y con su sombra, listo para añadir a una escena.
export async function prepararModelo(url, { giro = 0, alProgresar } = {}) {
  const gltf = await cargarModelo(url, alProgresar);
  const modelo = gltf.scene.clone(true);
  modelo.rotation.y = giro;
  modelo.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(modelo);
  const tam = caja.getSize(new THREE.Vector3());
  const centro = caja.getCenter(new THREE.Vector3());
  const escala = 2 / Math.max(tam.x, tam.y, tam.z);
  modelo.scale.setScalar(escala);
  modelo.position.sub(centro.multiplyScalar(escala));
  sombraComun ||= texturaSombra();
  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 1.4),
    new THREE.MeshBasicMaterial({ map: sombraComun, transparent: true, depthWrite: false })
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = -(tam.y * escala) / 2 - 0.02;
  return { gltf, modelo, sombra };
}

export function luces(escena, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const luz = new THREE.DirectionalLight(0xffffff, 1.6);
  luz.position.set(3, 5, 4);
  escena.add(luz);
}

export { THREE };

function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(0,0,0,0.55)');
  r.addColorStop(0.5, 'rgba(0,0,0,0.22)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export class Visor3D {
  constructor(contenedor, { giroAuto = true, inclinacion = true } = {}) {
    this.contenedor = contenedor;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    contenedor.appendChild(this.renderer.domElement);

    this.escena = new THREE.Scene();
    luces(this.escena, this.renderer);

    this.camara = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    this.camara.position.set(2.6, 1.1, 3.4);

    this.controles = new OrbitControls(this.camara, this.renderer.domElement);
    this.controles.enableDamping = true;
    this.controles.dampingFactor = 0.08;
    this.controles.enableZoom = false;
    this.controles.enablePan = false;
    this.controles.autoRotate = giroAuto && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.controles.autoRotateSpeed = 1.4;
    this.controles.minPolarAngle = Math.PI * 0.18;
    this.controles.maxPolarAngle = Math.PI * 0.55;
    this.controles.addEventListener('start', () => {
      this.controles.autoRotate = false;
      clearTimeout(this.reanudar);
    });
    this.controles.addEventListener('end', () => {
      clearTimeout(this.reanudar);
      this.reanudar = setTimeout(() => {
        this.controles.autoRotate = giroAuto && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }, 3500);
    });

    this.grupo = new THREE.Group();
    this.escena.add(this.grupo);
    this.inclinacion = inclinacion;
    this.raton = { x: 0, y: 0 };
    this.alMover = (e) => {
      const r = contenedor.getBoundingClientRect();
      this.raton.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      this.raton.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    window.addEventListener('pointermove', this.alMover, { passive: true });

    this.alRedimensionar = () => this.ajustar();
    this.ro = new ResizeObserver(this.alRedimensionar);
    this.ro.observe(contenedor);
    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(contenedor);
    this.ajustar();
    this.bucle = this.bucle.bind(this);
    this.frame = requestAnimationFrame(this.bucle);
  }

  async cargar(url, alProgresar, giro = 0) {
    const { gltf, modelo, sombra } = await prepararModelo(url, { giro, alProgresar });
    if (this.destruido) return;
    this.gltf = gltf;
    this.modelo = modelo;
    this.grupo.add(modelo);
    this.grupo.add(sombra);
    this.controles.target.set(0, 0, 0);
    this.entrada = performance.now();
  }

  async variante(nombre) {
    if (!this.gltf || !this.modelo) return;
    const parser = this.gltf.parser;
    const json = parser.json;
    const lista = json.extensions?.KHR_materials_variants?.variants || [];
    const indice = lista.findIndex((v) => v.name === nombre);
    if (indice < 0) return;
    const originales = [];
    this.gltf.scene.traverse((o) => { if (o.isMesh) originales.push(o); });
    const copias = [];
    this.modelo.traverse((o) => { if (o.isMesh) copias.push(o); });
    await Promise.all(originales.map(async (original, i) => {
      const asoc = parser.associations.get(original);
      if (!asoc || asoc.meshes === undefined) return;
      const primitiva = json.meshes[asoc.meshes].primitives[asoc.primitives ?? 0];
      const mapeo = primitiva.extensions?.KHR_materials_variants?.mappings?.find((m) => m.variants.includes(indice));
      if (!mapeo) return;
      const material = await parser.getDependency('material', mapeo.material);
      if (copias[i]) copias[i].material = material;
    }));
    this.salto = performance.now();
  }

  ajustar() {
    const w = this.contenedor.clientWidth || 1;
    const h = this.contenedor.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camara.aspect = w / h;
    this.camara.position.setLength(w < 560 ? 4.6 : 4.1);
    this.camara.updateProjectionMatrix();
  }

  bucle(t) {
    this.frame = requestAnimationFrame(this.bucle);
    if (!this.visible) return;
    this.controles.update();
    if (this.modelo) {
      const flota = Math.sin(t / 900) * 0.04;
      this.modelo.position.y += (flota - (this.modelo.userData.flota || 0));
      this.modelo.userData.flota = flota;
      if (this.inclinacion) {
        this.grupo.rotation.x += ((this.raton.y * 0.08) - this.grupo.rotation.x) * 0.05;
        this.grupo.rotation.z += ((-this.raton.x * 0.06) - this.grupo.rotation.z) * 0.05;
      }
      const e = this.entrada ? Math.min((t - this.entrada) / 1100, 1) : 1;
      const s = this.salto ? Math.min((t - this.salto) / 500, 1) : 1;
      const pulso = 1 + Math.sin(s * Math.PI) * 0.06;
      const aparecer = 0.6 + 0.4 * (1 - Math.pow(1 - e, 3));
      this.grupo.scale.setScalar(aparecer * pulso);
    }
    this.renderer.render(this.escena, this.camara);
  }

  captura() {
    this.renderer.render(this.escena, this.camara);
    return this.renderer.domElement.toDataURL('image/png');
  }

  destruir() {
    this.destruido = true;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('pointermove', this.alMover);
    this.ro.disconnect();
    this.io.disconnect();
    this.controles.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
