import { middleware } from "astro:i18n";
import { defineMiddleware } from "astro:middleware";


export const onRequest = defineMiddleware((context, next) => {
    const { request } = context;
    const { pathname } = new URL(request.url);
    
    if (pathname === '/') {
        return context.redirect('/es');
    }
    
    return next();
});