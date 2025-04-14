import { defineMiddleware } from "astro:middleware";


export const onRequest = defineMiddleware(async (context, next) => {
    const {pathname} = new URL(context.request.url);
    
    if (pathname === '/') {
        return Response.redirect(new URL('/es', context.request.url), 307);
    }
    
    return next();
});