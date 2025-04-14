import { middleware } from "astro:i18n";
import { defineMiddleware } from "astro:middleware";


export const onRequest = defineMiddleware((context, next) => {
    const {pathname} = new URL(context.url);
    
    if (pathname === '/') {
        return context.redirect('/es');
    }
    
    return next();
});