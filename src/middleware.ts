import { defineMiddleware } from "astro:middleware";


export const onRequest = defineMiddleware(async (context, next) => {
    const {pathname} = new URL(context.url);
    
    if (pathname === '/') {
        return context.redirect('/es');
    }
    
    return next();
});