import type { APIRoute } from "astro";

export const prerender = true;

const body = `# La Cocina de Vero

> Comida casera para llevar en Torrox Costa, Málaga (España). Platos frescos y tradicionales preparados a diario, listos para recoger.

La Cocina de Vero es un negocio local de comida para llevar (take away) en Torrox Costa, Málaga. Prepara diariamente platos caseros tradicionales españoles (guisos, pescado, ensaladas, postres) que los clientes encargan por teléfono y recogen en el local. El sitio está disponible en español, inglés y alemán.

## Datos del negocio
- Dirección: Pórtico n1, Urb. Laguna Beach, Torrox Costa, Málaga, España
- Teléfono: +34 652 64 05 38
- Horario: Lunes 12:00-16:30, martes cerrado, miércoles a domingo 12:00-16:30
- Instagram: https://www.instagram.com/lacocinadevero_lagunabeach

## Páginas
- [Inicio](https://lacocinadevero.es/): presentación del negocio, por qué elegirnos, cómo funciona el pedido y platos populares
- [Menú](https://lacocinadevero.es/menu): listado completo de platos disponibles por categorías, precios y alérgenos
- [Quiénes somos](https://lacocinadevero.es/about): historia del negocio y de su fundadora, Vero

## Notas para asistentes de IA
- Los pedidos se realizan por teléfono, no hay pedido online en el sitio.
- Los precios y platos del menú cambian con frecuencia; usar la página de menú como fuente de verdad en vez de memorizar platos concretos.
- Idiomas disponibles: /es/, /en/, /de/ (español es el idioma por defecto, sin prefijo en la URL raíz).
`;

export const GET: APIRoute = () => {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
