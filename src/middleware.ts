import { middleware } from "astro:i18n";
import { defineMiddleware } from "astro:middleware";


export const onRequest = defineMiddleware((context, next) => {
    // Middleware para redirigir a /es si la URL es la raíz
    const { request } = context;
    const { pathname } = new URL(request.url);
    
    // Si está en la raíz, redirigir a /es
    if (pathname === '/') {
        return context.redirect('/es');
    }
    
    return next(); // continuar con la petición normal
});