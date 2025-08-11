export const prerender = true
type DishApiType = {
  id: number;
  name: string;
  price: number;
  image: string;
  categories: number[];
  allergens: number[];
};

export const getDishesOfTheDay = async (lang: "es" | "en" | "de"): Promise<DishApiType[]> => { 
  if (!['es', 'en', 'de'].includes(lang)) {
    console.error('Invalid language code:', lang);
    return [];
  }

  const baseUrl = import.meta.env.API_URL;

  try {
    const response = await fetch(`${baseUrl}/api/${lang}/fetchMenuOfTheDay`, {method: 'GET'});
    console.log('Response:', response);

    if(!response.ok) {
      const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData?.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.dishes;
  } catch (error) {
    console.error(`Error fetching dishes: ${error}`);
    return [];
  }
}