import type { APIRoute } from 'astro';
import { getMenuData } from '@/lib/getMenuData';
import type { LangType } from '@/types/menu';

export const GET: APIRoute = async ({ params }) => {
  const lang = params.lang as LangType;

  // Validate language parameter
  if (!lang || !['es', 'en', 'de'].includes(lang)) {
    return new Response(
      JSON.stringify({ 
        error: 'Invalid language parameter. Must be es, en, or de.' 
      }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log(`📡 API: Fetching menu data for ${lang}`);
    const startTime = performance.now();

    // Get menu data using our optimized function
    const menuData = await getMenuData(lang);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ API: Menu data fetched for ${lang} in ${duration.toFixed(2)}ms`);

    // Return the data with appropriate headers
    return new Response(
      JSON.stringify(menuData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=300', // Aggressive caching
          'X-Response-Time': `${duration.toFixed(2)}ms`,
          'X-Cache-Status': 'MISS'
        }
      }
    );

  } catch (error) {
    console.error(`❌ API: Error fetching menu data for ${lang}:`, error);

    // Return error response with fallback data
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch menu data',
        message: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          categories: [],
          dishes: [],
          menuOfTheDay: [],
          weekMenu: {}
        }
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'X-Error': 'menu-data-fetch-failed'
        }
      }
    );
  }
};

// Also support POST for potential future use
export const POST: APIRoute = async ({ params, request }) => {
  const lang = params.lang as LangType;

  try {
    const body = await request.json();
    console.log(`📡 API POST: Received request for ${lang}`, body);

    // For now, just return the same as GET
    const menuData = await getMenuData(lang);

    return new Response(
      JSON.stringify(menuData),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process POST request',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};