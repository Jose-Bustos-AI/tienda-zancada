// Catálogo de la tienda de ejemplo ZANCADA. Todos los precios en euros.
export const ENVIO_GRATIS = 80;
export const COSTE_ENVIO = { estandar: 4.95, expres: 8.95 };
// Códigos de descuento: parte del subtotal que se descuenta.
export const CUPONES = { BIENVENIDA10: 0.1 };

export const CATEGORIAS = [
  { id: 'todo', nombre: 'Todo' },
  { id: 'running', nombre: 'Running' },
  { id: 'urbanas', nombre: 'Urbanas' },
  { id: 'accesorios', nombre: 'Accesorios' }
];

const TALLAS = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const tallas = (agotadas = []) => TALLAS.map((t) => ({ talla: t, stock: !agotadas.includes(t) }));

export const PRODUCTOS = [
  {
    id: 'uno',
    nombre: 'Zancada Uno',
    lema: 'La que puedes girar con el dedo',
    categoria: 'urbanas',
    precio: 129,
    antes: null,
    nuevo: true,
    tresd: true,
    modelo: 'modelos/zapatilla.glb',
    imagen: 'img/uno-midnight.webp',
    fondo: '#14273a',
    colores: [
      { id: 'midnight', nombre: 'Océano', muestra: '#1f6fa6', fondo: '#14273a', acento: '#6cc4ff' },
      { id: 'beach', nombre: 'Arena rosa', muestra: '#c99a9e', fondo: '#33242a', acento: '#ffb3bd' },
      { id: 'street', nombre: 'Noche', muestra: '#1c1c1e', fondo: '#2a1416', acento: '#ff4d5e' }
    ],
    tallas: tallas(['36', '46']),
    descripcion: 'Nuestro modelo insignia. Malla tejida que transpira, mediasuela de espuma FOAM y una plantilla que se nota desde el primer paso. Elígela en tres colores y mírala por todos lados antes de comprarla.',
    detalles: ['Corte de malla tejida transpirable', 'Mediasuela de espuma FOAM de alto rebote','Plantilla extraíble de espuma viscoelástica', 'Peso: 380 g por zapatilla (talla 42)']
  },
  {
    id: 'nube',
    nombre: 'Nube Runner',
    lema: 'Amortiguación para tirar kilómetros',
    categoria: 'running',
    precio: 119,
    antes: null,
    nuevo: true,
    imagen: 'img/nube.webp',
    modelo: 'modelos/nube-v2.glb',
    fondo: '#f6c9a8',
    colores: [{ id: 'naranja', nombre: 'Blanco y naranja', muestra: '#f2763a' }],
    tallas: tallas(['45']),
    descripcion: 'Zapatilla de entrenamiento diario con una mediasuela alta que devuelve energía en cada zancada. Pensada para rodajes largos sobre asfalto.',
    detalles: ['Mediasuela de espuma de alto retorno', 'Drop de 8 mm', 'Malla técnica transpirable', 'Peso: 265 g (talla 42)']
  },
  {
    id: 'pulso',
    nombre: 'Pulso Racer',
    lema: 'Para tu mejor marca',
    categoria: 'running',
    precio: 159,
    antes: null,
    nuevo: false,
    imagen: 'img/pulso.webp',
    modelo: 'modelos/pulso.glb',
    fondo: '#23262b',
    colores: [{ id: 'neon', nombre: 'Amarillo neón', muestra: '#d6f22a' }],
    tallas: tallas(['36', '37', '44']),
    descripcion: 'Zapatilla de competición ligera con placa rígida en la mediasuela. Para series, 10K y medias maratones.',
    detalles: ['Placa de propulsión en la mediasuela', 'Drop de 6 mm', 'Corte de malla ultraligera', 'Peso: 198 g (talla 42)']
  },
  {
    id: 'duna',
    nombre: 'Duna Trail',
    lema: 'Agarre en cualquier camino',
    categoria: 'running',
    precio: 134,
    antes: null,
    nuevo: false,
    imagen: 'img/duna.webp',
    modelo: 'modelos/duna.glb',
    fondo: '#cfdcc0',
    colores: [{ id: 'oliva', nombre: 'Verde oliva', muestra: '#5b6b3b' }],
    tallas: tallas(['36']),
    descripcion: 'Zapatilla de montaña con tacos de 5 mm y protección en la puntera. Estable en bajadas y cómoda en las subidas.',
    detalles: ['Suela con tacos de 5 mm', 'Puntera reforzada', 'Corte repelente al agua', 'Peso: 310 g (talla 42)']
  },
  {
    id: 'asfalto',
    nombre: 'Asfalto Hi',
    lema: 'Bota urbana de piel',
    categoria: 'urbanas',
    precio: 109,
    antes: null,
    nuevo: false,
    imagen: 'img/asfalto.webp',
    modelo: 'modelos/asfalto.glb',
    fondo: '#dcdee3',
    colores: [{ id: 'negro', nombre: 'Negro', muestra: '#1d1d1f' }],
    tallas: tallas(['36', '37', '38']),
    descripcion: 'Zapatilla alta de piel con suela de goma color miel. Va igual de bien con vaqueros que con traje.',
    detalles: ['Piel de vacuno curtida en España', 'Suela de goma natural', 'Forro de algodón', 'Peso: 450 g (talla 42)']
  },
  {
    id: 'retro',
    nombre: 'Retro 86',
    lema: 'Un clásico de pista',
    categoria: 'urbanas',
    precio: 99,
    antes: null,
    nuevo: true,
    imagen: 'img/retro.webp',
    modelo: 'modelos/retro.glb',
    fondo: '#9fc3ef',
    colores: [{ id: 'verde', nombre: 'Blanco y verde', muestra: '#1f5a3a' }],
    tallas: tallas([]),
    descripcion: 'Inspirada en las zapatillas de tenis de los 80. Piel blanca, detalles de ante verde y suela color hueso.',
    detalles: ['Piel y ante', 'Suela de goma color hueso', 'Plantilla acolchada', 'Peso: 360 g (talla 42)']
  },
  {
    id: 'brisa',
    nombre: 'Brisa Knit',
    lema: 'Te las pones sin manos',
    categoria: 'urbanas',
    precio: 89,
    antes: 99,
    nuevo: false,
    imagen: 'img/brisa.webp',
    modelo: 'modelos/brisa.glb',
    fondo: '#e3c29b',
    colores: [{ id: 'arena', nombre: 'Arena', muestra: '#cdb08b' }],
    tallas: tallas(['46']),
    descripcion: 'Zapatilla sin cordones de punto elástico. Ligera, transpirable y lavable a máquina.',
    detalles: ['Punto elástico de una sola pieza', 'Lavable a 30 °C', 'Suela de espuma ligera', 'Peso: 220 g (talla 42)']
  },
  {
    id: 'calcetines',
    nombre: 'Pack 3 calcetines',
    lema: 'Algodón técnico',
    categoria: 'accesorios',
    precio: 15,
    antes: null,
    nuevo: false,
    imagen: 'img/calcetines.webp',
    fondo: '#f6c9a8',
    colores: [{ id: 'mix', nombre: 'Blanco, naranja y negro', muestra: '#f2763a' }],
    tallas: [{ talla: '36-39', stock: true }, { talla: '40-43', stock: true }, { talla: '44-46', stock: true }],
    descripcion: 'Tres pares de calcetines deportivos con zona acolchada en talón y puntera.',
    detalles: ['80 % algodón, 18 % poliamida, 2 % elastano', 'Talón y puntera acolchados']
  },
  {
    id: 'kit',
    nombre: 'Kit de limpieza',
    lema: 'Como nuevas, siempre',
    categoria: 'accesorios',
    precio: 19,
    antes: 24,
    nuevo: false,
    imagen: 'img/kit.webp',
    fondo: '#dcdee3',
    colores: [{ id: 'unico', nombre: 'Único', muestra: '#7a8aa0' }],
    tallas: [{ talla: 'Única', stock: true }],
    descripcion: 'Espuma limpiadora, cepillo de madera con cerdas naturales y paño de microfibra.',
    detalles: ['Espuma de 150 ml, biodegradable', 'Cepillo de haya', 'Paño de microfibra']
  }
];

export const buscar = (id) => PRODUCTOS.find((p) => p.id === id);

export const euros = (n) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
