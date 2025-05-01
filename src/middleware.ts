// import { defineMiddleware } from "astro:middleware";


// export const onRequest = defineMiddleware(async (context, next) => {
//     const {pathname} = new URL(context.request.url);
    
    // if (pathname === '/') {
    //     const lang = context.request.headers.get("accept-language")?.split(",")[0].split("-")[0] || "es";
    //     const supported = ["en", "de"];
    //     const redirectLang = supported.includes(lang) ? lang : "es";

    //     return Response.redirect(new URL(`/${redirectLang}`, context.request.url), 307);
    // }
    
//     return next();
// });