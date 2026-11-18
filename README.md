# ZANCADA · tienda online de demostración

Tienda de zapatillas programada desde cero, sin plantillas ni plataforma. Las zapatillas se ven en 3D real: se giran con el dedo o el ratón hacia cualquier lado, en la ficha y en las tarjetas del catálogo. La zapatilla estrella, además, cambia de color al momento y el fondo de la portada se adapta a cada color. Tiene catálogo filtrable, favoritos, buscador, calculadora de tallas y un pago en tres pasos.

**Verla publicada:** https://zancada.dania360.com/

## Cómo está hecha
- HTML, CSS y JavaScript propios, sin framework
- Visor 3D con [three.js](https://threejs.org/): modelo glTF con luces de estudio, sombra y giro con el dedo o el ratón
- Seis zapatillas con modelo 3D propio, entre 200 y 550 KB cada uno (comprimidos con meshopt y texturas WebP)
- En el catálogo, un único renderizador WebGL compartido dibuja todas las tarjetas, y cada modelo se carga solo cuando su tarjeta entra en pantalla
- Cambio de color sobre el propio modelo 3D (tres variantes de material)
- Tienda de una sola página: rutas con `#/`, sin recargar
- Carrito lateral con barra de envío gratis, favoritos y carrito guardados en el navegador
- Código de descuento BIENVENIDA10 en el carrito y sugerencia del kit de limpieza
- En el móvil, categorías deslizables en la cabecera y barra fija de compra en la ficha
- Preguntas frecuentes desplegables en la portada
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
- Zancada Uno: modelo 3D "Materials Variants Shoe" de The Khronos Group y Shopify, licencia [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Nube Runner, Brisa Knit, Pulso Racer, Duna Trail, Asfalto Hi y Retro 86: modelos generados a partir de las fotos propias de la tienda con [TRELLIS](https://github.com/microsoft/TRELLIS), de Microsoft (licencia MIT; Nube Runner y Brisa Knit con TRELLIS.2), y optimizados con [glTF Transform](https://gltf-transform.dev/).
- Brisa Knit, calcetines y kit de limpieza se muestran con foto.

## Sobre esta tienda
Diseño y desarrollo de [Dania360](https://dania360.com). Es una tienda de ejemplo: la marca y los productos son inventados, el pago no cobra nada y la web no se indexa en buscadores (`noindex`). El código se publica para enseñar cómo está hecha; no tiene licencia de uso.

Más tiendas en el portafolio: https://tiendas.dania360.com
