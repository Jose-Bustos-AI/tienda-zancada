# ZANCADA · tienda online de demostración

Tienda de zapatillas programada desde cero, sin plantillas ni plataforma. La zapatilla estrella se ve en 3D real: se gira con el dedo o el ratón y cambia de color al momento, y el fondo de la portada se adapta a cada color. Tiene catálogo filtrable, favoritos, buscador, calculadora de tallas y un pago en tres pasos.

**Verla publicada:** https://zancada.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework
- Visor 3D con [three.js](https://threejs.org/): modelo glTF con luces de estudio, sombra y giro con el dedo o el ratón
- Cambio de color sobre el propio modelo 3D (tres variantes de material)
- Tienda de una sola página: rutas con `#/`, sin recargar
- Carrito lateral con barra de envío gratis, favoritos y carrito guardados en el navegador
- Calculadora de tallas: mides tu pie en centímetros y te da tu número en EU, US y UK
- Pago de demostración en tres pasos (datos, entrega y pago) con validación de campos
- Respeta a quien pide menos animación en su dispositivo
- Alojada en Vercel

## Verla en local
```
python -m http.server 8000
```
y abre http://localhost:8000/

## Créditos
Modelo 3D "Materials Variants Shoe" de The Khronos Group y Shopify, licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Sobre esta tienda
Diseño y desarrollo de [Dania360](https://dania360.com). Es una tienda de ejemplo: la marca y los productos son inventados, el pago no cobra nada y la web no se indexa en buscadores (`noindex`). El código se publica para enseñar cómo está hecha; no tiene licencia de uso.

Más tiendas en el portafolio: https://tiendas.dania360.com
