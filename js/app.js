import { PRODUCTOS, CATEGORIAS, ENVIO_GRATIS, COSTE_ENVIO, CUPONES, buscar, euros } from './datos.js';
import { vigilarTarjetas3D } from './tarjetas3d.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const app = $('#app');
let visor = null;

/* ---------- Estado guardado en el navegador ---------- */
const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };
let carrito = leer('zancada-carrito', []);
let favoritos = leer('zancada-favoritos', []);
let colorUno = 'midnight';
let cupon = leer('zancada-cupon', null);
if (!CUPONES[cupon]) cupon = null;

const categoria = (id) => CATEGORIAS.find((c) => c.id === id)?.nombre || '';
const subtotal = () => carrito.reduce((n, l) => n + buscar(l.id).precio * l.cantidad, 0);
const unidades = () => carrito.reduce((n, l) => n + l.cantidad, 0);
const descuento = () => (cupon ? Math.round(subtotal() * CUPONES[cupon] * 100) / 100 : 0);
// Importe que cuenta para el envío gratis: lo que se paga por los productos.
const base = () => subtotal() - descuento();

function tostada(texto) {
  const t = $('#tostada');
  t.textContent = texto;
  t.classList.add('ver');
  clearTimeout(tostada.t);
  tostada.t = setTimeout(() => t.classList.remove('ver'), 2600);
}

function burbuja(id, n) {
  const b = $(id);
  b.hidden = n === 0;
  if (b.textContent !== String(n)) {
    b.textContent = n;
    b.classList.remove('salta');
    void b.offsetWidth;
    b.classList.add('salta');
  }
}

function actualizarContadores() {
  burbuja('#num-carrito', unidades());
  burbuja('#num-fav', favoritos.length);
}

/* ---------- Carrito ---------- */
function añadir(id, talla, color, abrir = true) {
  const p = buscar(id);
  const c = color || p.colores[0].id;
  const linea = carrito.find((l) => l.id === id && l.talla === talla && l.color === c);
  if (linea) linea.cantidad += 1;
  else carrito.push({ id, talla, color: c, cantidad: 1 });
  guardar('zancada-carrito', carrito);
  actualizarContadores();
  pintarCajon();
  if (abrir) abrirCajon();
}

function cambiar(i, delta) {
  carrito[i].cantidad += delta;
  if (carrito[i].cantidad <= 0) carrito.splice(i, 1);
  guardar('zancada-carrito', carrito);
  actualizarContadores();
  pintarCajon();
}

function barraEnvio() {
  const falta = ENVIO_GRATIS - base();
  const pct = Math.min(base() / ENVIO_GRATIS, 1) * 100;
  const texto = carrito.length === 0
    ? `Envío gratis a partir de ${euros(ENVIO_GRATIS)}`
    : falta > 0 ? `Te faltan <b>${euros(falta)}</b> para el envío gratis` : '<b>¡Tienes el envío gratis!</b>';
  return `${texto}<div class="envio__barra"><span style="width:${pct}%"></span></div>`;
}

function lineaHTML(l, i, editable = true) {
  const p = buscar(l.id);
  const color = p.colores.find((c) => c.id === l.color);
  const img = p.tresd ? `img/uno-${l.color}.webp` : p.imagen;
  return `<div class="linea">
    <img src="${img}" alt="" style="--fondo:${p.fondo}" onerror="this.onerror=null;this.src='${p.imagen}'">
    <div>
      <h3>${esc(p.nombre)}</h3>
      <small>${esc(color?.nombre || '')} · Talla ${esc(l.talla)}</small>
      ${editable ? `<div class="cantidad"><button type="button" data-cant="${i}" data-delta="-1" aria-label="Quitar una unidad">−</button><span>${l.cantidad}</span><button type="button" data-cant="${i}" data-delta="1" aria-label="Añadir una unidad">+</button></div>` : `<small>${l.cantidad} ${l.cantidad === 1 ? 'unidad' : 'unidades'}</small>`}
    </div>
    <div><b>${euros(p.precio * l.cantidad)}</b>${editable ? `<br><button class="quitar" type="button" data-quitar="${i}">Quitar</button>` : ''}</div>
  </div>`;
}

function pintarCajon() {
  $('#envio').innerHTML = barraEnvio();
  if (!carrito.length) {
    $('#lineas').innerHTML = '<div class="vacio"><b>Tu carrito está vacío</b>Elige unas zapatillas y vuelve por aquí.</div>';
    $('#cajon-pie').innerHTML = '<a class="btn btn--ancho" href="#/catalogo/todo" data-cerrar>Ver la tienda</a>';
    return;
  }
  $('#lineas').innerHTML = carrito.map((l, i) => lineaHTML(l, i)).join('') + sugerenciaHTML();
  $('#cajon-pie').innerHTML = `${cuponHTML()}
    <dl class="cuentas"><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento</dt><dd>−${euros(descuento())}</dd>` : ''}</dl>
    <div class="total"><span>Total sin envío</span><span>${euros(base())}</span></div>
    <a class="btn btn--ancho" href="#/pago" data-cerrar>Finalizar compra</a>`;
}

/* Con unas zapatillas en el carrito y sin kit de limpieza, se propone el kit. */
function sugerenciaHTML() {
  const kit = buscar('kit');
  const hayZapatillas = carrito.some((l) => buscar(l.id).categoria !== 'accesorios');
  if (!kit || !hayZapatillas || carrito.some((l) => l.id === 'kit')) return '';
  return `<div class="sugerencia">
    <img src="${kit.imagen}" alt="" style="--fondo:${kit.fondo}">
    <div><small>Para que te duren más</small><b>${esc(kit.nombre)}</b><span>${euros(kit.precio)}${kit.antes ? ` <s>${euros(kit.antes)}</s>` : ''}</span></div>
    <button class="btn btn--hueco" type="button" data-sugerir="kit">Añadir</button>
  </div>`;
}

function cuponHTML() {
  if (cupon) {
    return `<div class="cupon cupon--puesto"><span>Código <b>${esc(cupon)}</b>: −${Math.round(CUPONES[cupon] * 100)} %</span><button class="quitar" type="button" data-quitar-cupon>Quitar</button></div>`;
  }
  return `<form class="cupon" data-cupon novalidate>
    <label class="visual-oculto" for="campo-cupon">Código de descuento</label>
    <input id="campo-cupon" name="cupon" type="text" placeholder="Código de descuento" autocomplete="off" autocapitalize="characters">
    <button class="btn btn--hueco" type="submit">Aplicar</button>
  </form><p class="cupon__error" id="cupon-error" role="alert"></p>`;
}

let focoPrevio = null;
function abrirCajon() {
  focoPrevio = document.activeElement;
  $('#cajon').classList.add('abierto');
  $('#cajon').setAttribute('aria-hidden', 'false');
  document.body.classList.add('bloqueado');
  setTimeout(() => $('#cajon [data-cerrar].icono')?.focus(), 50);
}
function cerrarCajon() {
  $('#cajon').classList.remove('abierto');
  $('#cajon').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('bloqueado');
  focoPrevio?.focus?.();
}

$('#cajon').addEventListener('click', (e) => {
  const c = e.target.closest('[data-cant]');
  if (c) return cambiar(+c.dataset.cant, +c.dataset.delta);
  const q = e.target.closest('[data-quitar]');
  if (q) return cambiar(+q.dataset.quitar, -999);
  const sug = e.target.closest('[data-sugerir]');
  if (sug) { const p = buscar(sug.dataset.sugerir); añadir(p.id, p.tallas[0].talla, null, false); tostada(`${p.nombre} añadido al carrito`); return; }
  if (e.target.closest('[data-quitar-cupon]')) { cupon = null; guardar('zancada-cupon', cupon); pintarCajon(); return; }
  if (e.target.closest('[data-cerrar]')) cerrarCajon();
});
$('#cajon').addEventListener('submit', (e) => {
  const f = e.target.closest('[data-cupon]');
  if (!f) return;
  e.preventDefault();
  const codigo = f.cupon.value.trim().toUpperCase();
  if (CUPONES[codigo]) {
    cupon = codigo;
    guardar('zancada-cupon', cupon);
    pintarCajon();
    tostada(`Código aplicado: ${Math.round(CUPONES[codigo] * 100)} % de descuento`);
  } else {
    $('#cupon-error').textContent = codigo ? 'Ese código no existe. Prueba con BIENVENIDA10.' : 'Escribe un código.';
    f.cupon.focus();
  }
});
$('#btn-carrito').addEventListener('click', () => { pintarCajon(); abrirCajon(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#cajon').classList.contains('abierto')) cerrarCajon(); });

/* ---------- Favoritos ---------- */
function alternarFavorito(id) {
  const i = favoritos.indexOf(id);
  if (i >= 0) favoritos.splice(i, 1); else favoritos.push(id);
  guardar('zancada-favoritos', favoritos);
  actualizarContadores();
  tostada(i >= 0 ? 'Quitada de favoritos' : 'Guardada en favoritos');
  $$(`[data-fav="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', String(i < 0)));
}

const CORAZON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
const MAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

/* ---------- Tarjetas ---------- */
function tarjeta(p) {
  const fav = favoritos.includes(p.id);
  const img = p.tresd ? `img/uno-${colorUno}.webp` : p.imagen;
  return `<article class="tarjeta revela">
    <a class="tarjeta__foto" href="#/producto/${p.id}" style="--fondo:${p.fondo}" tabindex="-1" aria-hidden="true">
      <img src="${img}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${p.imagen}'">
      ${p.modelo ? `<canvas class="tarjeta__3d" data-modelo="${p.modelo}" data-giro="${p.giro || 0}" data-id="${p.id}"></canvas>` : ''}
    </a>
    <div class="tarjeta__marcas">
      ${p.modelo ? '<span class="marca marca--3d">3D</span>' : ''}
      ${p.nuevo ? '<span class="marca">Nuevo</span>' : ''}
      ${p.antes ? `<span class="marca marca--oferta">−${Math.round((1 - p.precio / p.antes) * 100)} %</span>` : ''}
    </div>
    <button class="corazon" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Guardar ${esc(p.nombre)} en favoritos">${CORAZON}</button>
    <div class="tarjeta__cuerpo">
      <span class="tarjeta__cat">${categoria(p.categoria)}</span>
      <h3 class="tarjeta__nombre"><a href="#/producto/${p.id}">${esc(p.nombre)}</a></h3>
      <span class="tarjeta__cat" style="letter-spacing:0;text-transform:none">${esc(p.lema)}</span>
      <div class="tarjeta__pie">
        <span class="precio-linea">${euros(p.precio)}${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</span>
        <a class="mas" href="#/producto/${p.id}" aria-label="Elegir talla de ${esc(p.nombre)}">${MAS}</a>
      </div>
    </div>
  </article>`;
}

/* ---------- Vistas ---------- */
function vistaInicio() {
  const uno = buscar('uno');
  const c = uno.colores.find((x) => x.id === colorUno);
  app.innerHTML = `
  <section class="portada" id="portada" style="--fondo-color:${c.fondo};--brillo:${c.acento}">
    <div class="portada__gigante" aria-hidden="true">ZANCADA</div>
    <div class="portada__grid">
      <div class="portada__copia">
        <span class="etiqueta">Nueva · Zancada Uno</span>
        <h1 class="portada__titulo">Gírala antes de <em>comprarla.</em></h1>
        <p class="portada__texto">Nuestra zapatilla insignia en 3D real. Arrástrala, cámbiale el color y mírala por todos lados como si la tuvieras en la mano.</p>
        <div class="portada__acciones">
          <a class="btn" href="#/producto/uno">Comprar · ${euros(uno.precio)}</a>
          <a class="btn btn--hueco" href="#/catalogo/todo">Ver la tienda</a>
        </div>
      </div>
      <div class="escenario" id="escenario" aria-label="Zapatilla Zancada Uno en 3D. Arrástrala para girarla." role="img">
        <div class="escenario__pista"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5a2 2 0 0 1 4 0v6m0-1a2 2 0 0 1 4 0v2m0-1a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L5 15a2 2 0 0 1 3-2.4"/></svg>Arrastra para girarla</div>
      </div>
      <div class="ficha3d">
        <h2>${esc(uno.nombre)}</h2>
        <div class="precio">${euros(uno.precio)}</div>
        <div class="ficha3d__label">Color</div>
        <div class="colores" role="group" aria-label="Color de la zapatilla">
          ${uno.colores.map((x) => `<button class="color" type="button" data-color="${x.id}" style="--muestra:${x.muestra}" aria-pressed="${x.id === colorUno}" aria-label="${x.nombre}"></button>`).join('')}
        </div>
        <div class="color-nombre" id="color-nombre">${c.nombre}</div>
        <a class="btn btn--claro btn--ancho" href="#/producto/uno">Elegir talla</a>
      </div>
    </div>
  </section>
  <div class="cinta" aria-hidden="true"><div class="cinta__pista">${Array(2).fill('<span>Envío gratis desde 80 €</span><span>Cambios gratis en 30 días</span><span>Producto en 3D</span><span>10 % con el código BIENVENIDA10</span><span>Diseñadas en Murcia</span>').join('')}</div></div>
  <section class="bloque envoltura">
    <div class="ventajas">
      <div class="ventaja revela"><b data-cuenta="9">0</b><span>modelos en la colección</span></div>
      <div class="ventaja revela"><b data-cuenta="30">0</b><span>días para cambiarlas gratis</span></div>
      <div class="ventaja revela"><b data-cuenta="48">0</b><span>horas de entrega en península</span></div>
      <div class="ventaja revela"><b>3D</b><span>para verlas por todos lados</span></div>
    </div>
  </section>
  <section class="bloque envoltura" style="padding-top:0">
    <div class="bloque__cab">
      <div><span class="etiqueta">Lo más nuevo</span><h2 class="bloque__titulo">Recién <em>salidas</em> de la caja</h2></div>
      <a class="btn btn--hueco" href="#/catalogo/todo">Ver todas</a>
    </div>
    <div class="rejilla">${PRODUCTOS.slice(0, 8).map(tarjeta).join('')}</div>
  </section>
  <section class="editorial revela">
    <img src="img/ciudad.webp" alt="Corredor con zapatillas de colores sobre el asfalto mojado de la ciudad" id="parallax" loading="lazy">
    <div class="editorial__texto">
      <span class="etiqueta">Running urbano</span>
      <h2 class="bloque__titulo">Hechas para el asfalto de <em>verdad.</em></h2>
      <p>Mediasuelas que devuelven energía, mallas que transpiran y suelas que agarran en mojado. Para los kilómetros de antes de trabajar y los de después.</p>
      <a class="btn" href="#/catalogo/running">Ver running</a>
    </div>
  </section>
  <section class="bloque envoltura">
    <div class="bloque__cab">
      <div><span class="etiqueta">Sin dudas con la talla</span><h2 class="bloque__titulo">Mide tu pie, <em>acierta seguro</em></h2></div>
    </div>
    ${calculadoraTallas()}
  </section>
  <section class="bloque envoltura" style="padding-top:0">
    <div class="faq">
      <div><span class="etiqueta">Antes de pedir</span><h2 class="bloque__titulo">Preguntas <em>frecuentes</em></h2></div>
      <div>
        <details class="acordeon" open><summary>¿Y si no acierto con la talla?</summary><p>Tienes 30 días para cambiarlas gratis. Para no fallar, mide tu pie con la calculadora de esta página: te da tu número en EU, US y UK.</p></details>
        <details class="acordeon"><summary>¿Cuánto tarda y cuánto cuesta el envío?</summary><p>El estándar llega en 24-48 h en península y cuesta ${euros(COSTE_ENVIO.estandar)}; es gratis desde ${euros(ENVIO_GRATIS)}. El exprés llega al día siguiente por ${euros(COSTE_ENVIO.expres)}.</p></details>
        <details class="acordeon"><summary>¿Puedo ver bien la zapatilla antes de comprarla?</summary><p>Sí. Las zapatillas están en 3D: las giras con el dedo o el ratón hacia cualquier lado, en la ficha y en el catálogo. A la Zancada Uno, además, le cambias el color en vivo.</p></details>
        <details class="acordeon"><summary>¿Hay algún descuento?</summary><p>Sí: con el código BIENVENIDA10 tienes un 10 % en tu primer pedido. Se escribe en el carrito.</p></details>
        <details class="acordeon"><summary>¿Es una tienda de verdad?</summary><p>No. Es una tienda de demostración hecha por Dania360: la marca y los productos son inventados y el pago es de prueba, no se cobra nada.</p></details>
      </div>
    </div>
  </section>`;
  montarVisor($('#escenario'), true, buscar('uno'));
  activarCalculadora();
}

async function montarVisor(contenedor, enPortada, p) {
  if (visor) { visor.destruir(); visor = null; }
  try {
    const { Visor3D } = await import('./visor3d.js');
    if (!contenedor.isConnected) return;
    visor = new Visor3D(contenedor, { giroAuto: true, inclinacion: enPortada });
    const mio = visor;
    await mio.cargar(p.modelo, (x) => progresoCarga(x), p.giro || 0);
    if (p.tresd) await mio.variante(colorUno);
    contenedor.addEventListener('pointerdown', () => contenedor.classList.add('tocado'), { once: true });
  } catch (err) {
    contenedor.innerHTML = `<img src="${p.tresd ? `img/uno-${colorUno}.webp` : p.imagen}" alt="${esc(p.nombre)}" style="width:100%;height:100%;object-fit:${p.tresd ? 'contain' : 'cover'}" onerror="this.remove()">`;
    console.warn('No se pudo cargar el 3D', err);
  }
  ocultarCarga();
}

function elegirColor(id) {
  colorUno = id;
  const c = buscar('uno').colores.find((x) => x.id === id);
  const portada = $('#portada');
  if (portada) { portada.style.setProperty('--fondo-color', c.fondo); portada.style.setProperty('--brillo', c.acento); }
  const media = $('.producto__media');
  if (media) media.style.setProperty('--fondo', c.fondo);
  $$('[data-color]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === id)));
  $$('#color-nombre').forEach((n) => { n.textContent = c.nombre; });
  visor?.variante(id);
}

function vistaCatalogo(cat) {
  let orden = 'destacados';
  const pintar = () => {
    let lista = PRODUCTOS.filter((p) => cat === 'todo' || p.categoria === cat);
    if (orden === 'precio-asc') lista = [...lista].sort((a, b) => a.precio - b.precio);
    if (orden === 'precio-desc') lista = [...lista].sort((a, b) => b.precio - a.precio);
    if (orden === 'novedades') lista = [...lista].sort((a, b) => Number(b.nuevo) - Number(a.nuevo));
    $('#rejilla').innerHTML = lista.map(tarjeta).join('');
    $('#total').textContent = `${lista.length} ${lista.length === 1 ? 'producto' : 'productos'}`;
    revelar();
  };
  app.innerHTML = `<section class="bloque envoltura">
    <div class="bloque__cab"><div><span class="etiqueta" id="total"></span><h1 class="bloque__titulo">${cat === 'todo' ? 'Toda la <em>tienda</em>' : esc(categoria(cat))}</h1></div></div>
    <div class="filtros">
      <nav class="chips" aria-label="Filtrar por categoría">${CATEGORIAS.map((c) => `<a class="chip" href="#/catalogo/${c.id}" ${c.id === cat ? 'aria-current="page"' : ''}>${c.nombre}</a>`).join('')}</nav>
      <label><span class="visual-oculto">Ordenar</span><select class="orden" id="orden">
        <option value="destacados">Destacados</option><option value="novedades">Novedades primero</option>
        <option value="precio-asc">Precio: de menor a mayor</option><option value="precio-desc">Precio: de mayor a menor</option>
      </select></label>
    </div>
    <div class="rejilla" id="rejilla"></div>
  </section>`;
  $('#orden').addEventListener('change', (e) => { orden = e.target.value; pintar(); });
  pintar();
  ocultarCarga();
}

function vistaProducto(id) {
  const p = buscar(id);
  if (!p) return vistaNoEncontrada();
  let talla = null;
  let color = p.tresd ? colorUno : p.colores[0].id;
  const fondo = p.tresd ? p.colores.find((c) => c.id === colorUno).fondo : p.fondo;
  const relacionados = PRODUCTOS.filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 3);
  app.innerHTML = `<div class="envoltura">
    <section class="producto">
      <div class="producto__media" style="--fondo:${fondo}">
        ${p.modelo ? `<div class="escenario" id="escenario-ficha" role="img" aria-label="${esc(p.nombre)} en 3D. Arrástrala para girarla."><div class="escenario__pista escenario__pista--pastilla">Arrastra para girarla</div></div>` : `<img src="${p.imagen}" alt="${esc(p.nombre)}">`}
      </div>
      <div>
        <nav class="migas" aria-label="Estás en"><a href="#/">Inicio</a> / <a href="#/catalogo/${p.categoria}">${categoria(p.categoria)}</a> / ${esc(p.nombre)}</nav>
        <span class="etiqueta">${p.nuevo ? 'Nuevo' : categoria(p.categoria)}</span>
        <h1>${esc(p.nombre)}</h1>
        <p class="producto__lema">${esc(p.lema)}</p>
        <div class="producto__precio">${euros(p.precio)}${p.antes ? `<s>${euros(p.antes)}</s>` : ''}</div>
        <div class="ficha3d__label">Color</div>
        <div class="colores" role="group" aria-label="Color">${p.colores.map((c) => `<button class="color" type="button" data-color-ficha="${c.id}" style="--muestra:${c.muestra}" aria-pressed="${c.id === color}" aria-label="${c.nombre}"></button>`).join('')}</div>
        <div class="color-nombre" id="color-nombre">${p.colores.find((c) => c.id === color).nombre}</div>
        <div class="ficha3d__label">Talla <a href="#/tallas" style="float:right;text-transform:none;letter-spacing:0">¿Cuál es la mía?</a></div>
        <div class="tallas" role="group" aria-label="Talla">${p.tallas.map((t) => `<button class="talla" type="button" data-talla="${t.talla}" aria-pressed="false" ${t.stock ? '' : 'disabled aria-label="Talla ' + t.talla + ' agotada"'}>${t.talla}</button>`).join('')}</div>
        <div class="error-talla" id="error-talla" role="alert"></div>
        <div class="fila-compra">
          <button class="btn" type="button" id="btn-añadir">Añadir al carrito</button>
          <button class="corazon" type="button" data-fav="${p.id}" aria-pressed="${favoritos.includes(p.id)}" aria-label="Guardar en favoritos">${CORAZON}</button>
        </div>
        <div class="ventajas-mini"><span>Envío gratis desde ${euros(ENVIO_GRATIS)}</span><span>Cambios y devoluciones gratis en 30 días</span><span>Entrega en 24-48 h en península</span></div>
        <details class="acordeon" open><summary>Descripción</summary><p style="color:var(--suave);margin-top:0">${esc(p.descripcion)}</p></details>
        <details class="acordeon"><summary>Detalles</summary><ul>${p.detalles.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></details>
        <details class="acordeon"><summary>Envíos y cambios</summary><ul><li>Estándar: ${euros(COSTE_ENVIO.estandar)}, gratis desde ${euros(ENVIO_GRATIS)}.</li><li>Exprés en 24 h: ${euros(COSTE_ENVIO.expres)}.</li><li>Tienes 30 días para cambiarlas o devolverlas.</li></ul></details>
      </div>
    </section>
    ${relacionados.length ? `<section class="bloque" style="padding-top:0"><div class="bloque__cab"><h2 class="bloque__titulo">También te pueden <em>gustar</em></h2></div><div class="rejilla">${relacionados.map(tarjeta).join('')}</div></section>` : ''}
  </div>
  <div class="barra-compra" id="barra-compra"><div><b>${esc(p.nombre)}</b><span>${euros(p.precio)}</span></div><button class="btn" type="button" id="btn-añadir-2">Añadir</button></div>`;
  $$('.talla').forEach((b) => b.addEventListener('click', () => {
    talla = b.dataset.talla;
    $$('.talla').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#error-talla').textContent = '';
  }));
  $$('[data-color-ficha]').forEach((b) => b.addEventListener('click', () => {
    color = b.dataset.colorFicha;
    if (p.tresd) elegirColor(color);
    $$('[data-color-ficha]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#color-nombre').textContent = p.colores.find((c) => c.id === color).nombre;
  }));
  const comprar = () => {
    if (!talla) {
      $('#error-talla').textContent = 'Elige tu talla para continuar.';
      $('.tallas').scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    añadir(p.id, talla, color);
  };
  $('#btn-añadir').addEventListener('click', comprar);
  $('#btn-añadir-2').addEventListener('click', comprar);
  if (p.modelo) montarVisor($('#escenario-ficha'), false, p); else ocultarCarga();
  revelar();
}

function calculadoraTallas() {
  return `<div class="tallas-calc revela">
    <div>
      <label for="pie">Mide tu pie del talón a la punta del dedo más largo</label>
      <input class="rango" id="pie" type="range" min="22" max="31" step="0.1" value="26.5">
      <div class="medida" id="medida">26,5 <small>cm</small></div>
      <p class="consejo">Mide por la tarde y con calcetín: el pie se hincha un poco a lo largo del día.</p>
    </div>
    <div>
      <div class="equivalencias">
        <div><b id="eu">41</b><span>EU</span></div>
        <div><b id="us">8</b><span>US</span></div>
        <div><b id="uk">7</b><span>UK</span></div>
      </div>
      <p class="consejo" id="recomendacion"></p>
    </div>
  </div>`;
}

function activarCalculadora() {
  const r = $('#pie');
  if (!r) return;
  const calc = () => {
    const cm = +r.value;
    const eu = Math.round((cm + 1.5) * 1.5);
    $('#medida').innerHTML = `${cm.toLocaleString('es-ES', { minimumFractionDigits: 1 })} <small>cm</small>`;
    $('#eu').textContent = eu;
    $('#us').textContent = Math.max(eu - 33, 3);
    $('#uk').textContent = Math.max(eu - 34, 2);
    $('#recomendacion').textContent = eu < 36 || eu > 46
      ? 'Ahora mismo no tenemos tu talla en la colección.'
      : `Tu talla en ZANCADA es la ${eu}. Si estás entre dos tallas, elige la mayor para running.`;
  };
  r.addEventListener('input', calc);
  calc();
}

function vistaTallas() {
  app.innerHTML = `<section class="bloque envoltura"><div class="bloque__cab"><div><span class="etiqueta">Guía de tallas</span><h1 class="bloque__titulo">Encuentra tu <em>talla</em></h1></div></div>${calculadoraTallas()}</section>`;
  activarCalculadora();
  revelar();
  ocultarCarga();
}

function vistaFavoritos() {
  const lista = PRODUCTOS.filter((p) => favoritos.includes(p.id));
  app.innerHTML = `<section class="bloque envoltura"><div class="bloque__cab"><div><span class="etiqueta">${lista.length} guardadas</span><h1 class="bloque__titulo">Tus <em>favoritas</em></h1></div></div>
    ${lista.length ? `<div class="rejilla">${lista.map(tarjeta).join('')}</div>` : '<div class="vacio"><b>Todavía no has guardado nada</b>Pulsa el corazón de cualquier zapatilla para tenerla aquí.<br><br><a class="btn" href="#/catalogo/todo">Ver la tienda</a></div>'}</section>`;
  revelar();
  ocultarCarga();
}

/* ---------- Pago en tres pasos (de demostración) ---------- */
function vistaPago() {
  if (!carrito.length) { location.hash = '#/catalogo/todo'; return; }
  let paso = 1;
  const datos = leer('zancada-envio', { nombre: '', email: '', direccion: '', cp: '', ciudad: '', telefono: '' });
  let metodo = 'estandar';
  const gastos = () => (metodo === 'expres' ? COSTE_ENVIO.expres : base() >= ENVIO_GRATIS ? 0 : COSTE_ENVIO.estandar);

  const resumen = () => `<aside class="caja resumen"><h2>Resumen</h2>${carrito.map((l, i) => lineaHTML(l, i, false)).join('')}
    <dl><dt>Subtotal</dt><dd>${euros(subtotal())}</dd>${descuento() ? `<dt>Descuento (${esc(cupon)})</dt><dd>−${euros(descuento())}</dd>` : ''}<dt>Envío</dt><dd>${gastos() === 0 ? 'Gratis' : euros(gastos())}</dd></dl>
    <div class="total"><span>Total</span><span>${euros(base() + gastos())}</span></div></aside>`;

  const campo = (id, etiqueta, tipo = 'text', ancho = false, extra = '') => `<label class="campo ${ancho ? 'campo--ancho' : ''}">${etiqueta}<input id="${id}" name="${id}" type="${tipo}" value="${esc(datos[id] || '')}" ${extra} required></label>`;

  const pintar = () => {
    const etapas = ['Envío', 'Entrega', 'Pago'];
    let cuerpo = '';
    if (paso === 1) {
      cuerpo = `<form class="caja" id="form-paso" novalidate><h2>¿Dónde te lo enviamos?</h2>
        <div class="nota-prueba">Es una tienda de prueba: puedes inventarte los datos, no se guardan en ningún servidor.</div>
        <div class="campos">${campo('nombre', 'Nombre y apellidos', 'text', true, 'autocomplete="name"')}${campo('email', 'Correo electrónico', 'email', false, 'autocomplete="email"')}${campo('telefono', 'Teléfono', 'tel', false, 'autocomplete="tel"')}${campo('direccion', 'Dirección', 'text', true, 'autocomplete="street-address"')}${campo('cp', 'Código postal', 'text', false, 'inputmode="numeric" pattern="[0-9]{5}" autocomplete="postal-code"')}${campo('ciudad', 'Ciudad', 'text', false, 'autocomplete="address-level2"')}</div>
        <div class="botones-pago"><a class="btn btn--hueco" href="#/catalogo/todo">Seguir comprando</a><button class="btn" type="submit">Continuar</button></div></form>`;
    } else if (paso === 2) {
      cuerpo = `<form class="caja" id="form-paso"><h2>¿Cuándo lo quieres?</h2>
        <label class="opcion"><input type="radio" name="metodo" value="estandar" ${metodo === 'estandar' ? 'checked' : ''}><span>Estándar<small>Entrega en 24-48 h</small></span><b>${base() >= ENVIO_GRATIS ? 'Gratis' : euros(COSTE_ENVIO.estandar)}</b></label>
        <label class="opcion"><input type="radio" name="metodo" value="expres" ${metodo === 'expres' ? 'checked' : ''}><span>Exprés<small>Mañana antes de las 14:00</small></span><b>${euros(COSTE_ENVIO.expres)}</b></label>
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Continuar</button></div></form>`;
    } else {
      cuerpo = `<form class="caja" id="form-paso"><h2>Pago</h2>
        <div class="nota-prueba">Pago de demostración: no se pide tarjeta y no se cobra nada. Al confirmar verás cómo termina un pedido real.</div>
        <label class="opcion"><input type="radio" name="pago" value="demo" checked><span>Pago de prueba<small>Simula un pago con tarjeta aceptado</small></span></label>
        <p style="color:var(--suave);font-size:14px">Enviamos a <b style="color:var(--blanco)">${esc(datos.nombre)}</b>, ${esc(datos.direccion)}, ${esc(datos.cp)} ${esc(datos.ciudad)}.</p>
        <div class="botones-pago"><button class="btn btn--hueco" type="button" data-atras>Atrás</button><button class="btn" type="submit">Pagar ${euros(base() + gastos())}</button></div></form>`;
    }
    app.innerHTML = `<div class="envoltura"><section class="pago"><div>
      <ol class="pasos">${etapas.map((e, i) => `<li class="${i + 1 === paso ? 'activo' : i + 1 < paso ? 'hecho' : ''}">${i + 1}. ${e}</li>`).join('')}</ol>
      ${cuerpo}</div>${resumen()}</section></div>`;
    const f = $('#form-paso');
    f.querySelector('[data-atras]')?.addEventListener('click', () => { paso -= 1; pintar(); });
    f.addEventListener('change', (e) => { if (e.target.name === 'metodo') { metodo = e.target.value; pintar(); } });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (paso === 1) {
        let ok = true;
        $$('input', f).forEach((i) => {
          datos[i.name] = i.value.trim();
          const valido = i.checkValidity() && i.value.trim() !== '';
          i.setAttribute('aria-invalid', String(!valido));
          if (!valido) ok = false;
        });
        if (!ok) { tostada('Revisa los campos marcados en rojo'); f.querySelector('[aria-invalid=true]')?.focus(); return; }
        guardar('zancada-envio', datos);
      }
      if (paso === 3) return confirmar(base() + gastos());
      paso += 1;
      pintar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.scrollTo({ top: 0 });
  };
  pintar();
  ocultarCarga();
}

function confirmar(total) {
  const numero = 'ZC-' + Math.floor(100000 + Math.random() * 900000);
  carrito = [];
  guardar('zancada-carrito', carrito);
  cupon = null;
  guardar('zancada-cupon', cupon);
  actualizarContadores();
  sessionStorage.setItem('zancada-pedido', JSON.stringify({ numero, total }));
  location.hash = '#/gracias';
}

function vistaGracias() {
  let pedido = null;
  try { pedido = JSON.parse(sessionStorage.getItem('zancada-pedido')); } catch { /* nada */ }
  app.innerHTML = `<section class="gracias envoltura">
    <div class="gracias__check"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
    <h1>¡Pedido confirmado!</h1>
    <p>${pedido ? `Tu pedido <b>${pedido.numero}</b> por ${euros(pedido.total)} ya está en marcha. ` : ''}Como es una tienda de prueba no se ha cobrado nada ni se enviará nada, pero así termina una compra de verdad.</p>
    <a class="btn" href="#/">Volver a la tienda</a>
  </section>`;
  confeti();
  ocultarCarga();
}

function vistaNoEncontrada() {
  app.innerHTML = '<section class="gracias envoltura"><h1>Esta página se ha ido a correr</h1><p>No encontramos lo que buscabas.</p><a class="btn" href="#/">Volver al inicio</a></section>';
  ocultarCarga();
}

/* ---------- Efectos ---------- */
function confeti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confeti';
  document.body.appendChild(c);
  const g = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colores = ['#ff5a1f', '#ffd23f', '#f4f2ee', '#8fa8ff'];
  const piezas = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, t: 6 + Math.random() * 6, c: colores[Math.floor(Math.random() * 4)] }));
  const inicio = performance.now();
  (function frame(t) {
    g.clearRect(0, 0, c.width, c.height);
    piezas.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += 0.05;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.t / 2, -p.t / 4, p.t, p.t / 2); g.restore();
    });
    if (t - inicio < 4200) requestAnimationFrame(frame); else c.remove();
  })(inicio);
}

let observador;
function revelar() {
  observador?.disconnect();
  observador = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('dentro');
    const n = e.target.querySelector('[data-cuenta]');
    if (n && !n.dataset.hecho) {
      n.dataset.hecho = '1';
      const fin = +n.dataset.cuenta;
      const t0 = performance.now();
      (function paso(t) {
        const k = Math.min((t - t0) / 1200, 1);
        n.textContent = Math.round(fin * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(paso);
      })(t0);
    }
    observador.unobserve(e.target);
  }), { threshold: 0.12 });
  $$('.revela:not(.dentro)').forEach((el) => observador.observe(el));
}

window.addEventListener('scroll', () => {
  $('#cab').classList.toggle('on', scrollY > 10);
  // En el móvil, cuando el botón de compra de la ficha queda arriba, fuera de la pantalla, aparece una barra fija abajo.
  const barra = $('#barra-compra');
  if (barra) barra.classList.toggle('ver', $('#btn-añadir').getBoundingClientRect().bottom < 0);
  const img = $('#parallax');
  if (img) {
    const r = img.parentElement.getBoundingClientRect();
    img.style.transform = `translateY(${(r.top / innerHeight) * -60}px)`;
  }
}, { passive: true });

/* ---------- Carga inicial ---------- */
let cargaOculta = false;
function progresoCarga(p) {
  if (cargaOculta) return;
  $('#carga-barra').style.width = `${Math.round(p * 100)}%`;
  $('#carga-num').textContent = `${Math.round(p * 100)} %`;
}
function ocultarCarga() {
  if (cargaOculta) return;
  cargaOculta = true;
  $('#carga-barra').style.width = '100%';
  $('#carga-num').textContent = '100 %';
  setTimeout(() => $('#carga').classList.add('fuera'), 250);
}
setTimeout(ocultarCarga, 6000);

/* ---------- Buscador ---------- */
$('#btn-buscar').addEventListener('click', () => {
  const b = $('#buscador');
  b.hidden = !b.hidden;
  if (!b.hidden) $('#campo-buscar').focus();
});
$('#campo-buscar').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const lista = q.length < 2 ? [] : PRODUCTOS.filter((p) => `${p.nombre} ${p.lema} ${categoria(p.categoria)}`.toLowerCase().includes(q));
  $('#resultados').innerHTML = q.length < 2 ? '' : lista.length
    ? lista.map((p) => `<a href="#/producto/${p.id}"><img src="${p.tresd ? 'img/uno-' + colorUno + '.webp' : p.imagen}" alt="" onerror="this.onerror=null;this.src='${p.imagen}'"><span>${esc(p.nombre)}<small>${euros(p.precio)}</small></span></a>`).join('')
    : '<p style="color:var(--suave)">No hay resultados. Prueba con "running" o "urbanas".</p>';
});

/* ---------- Eventos globales ---------- */
document.addEventListener('click', (e) => {
  const fav = e.target.closest('[data-fav]');
  if (fav) { e.preventDefault(); alternarFavorito(fav.dataset.fav); return; }
  const col = e.target.closest('[data-color]');
  if (col) elegirColor(col.dataset.color);
});

/* ---------- Rutas ---------- */
function ruta() {
  const partes = location.hash.replace(/^#\/?/, '').split('/');
  $('#buscador').hidden = true;
  if ($('#cajon').classList.contains('abierto')) cerrarCajon();
  if (visor && !['', 'producto'].includes(partes[0])) { visor.destruir(); visor = null; }
  $$('.cab__nav a').forEach((a) => (a.getAttribute('href') === location.hash ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  switch (partes[0]) {
    case '': vistaInicio(); break;
    case 'catalogo': vistaCatalogo(CATEGORIAS.some((c) => c.id === partes[1]) ? partes[1] : 'todo'); break;
    case 'producto': vistaProducto(partes[1]); break;
    case 'tallas': vistaTallas(); break;
    case 'favoritos': vistaFavoritos(); break;
    case 'pago': vistaPago(); break;
    case 'gracias': vistaGracias(); break;
    default: vistaNoEncontrada();
  }
  revelar();
  if (partes[0] !== 'pago') window.scrollTo({ top: 0 });
  app.focus({ preventScroll: true });
}
window.addEventListener('hashchange', ruta);
actualizarContadores();
pintarCajon();
ruta();
vigilarTarjetas3D();
