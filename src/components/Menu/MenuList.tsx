import React, { Suspense, useEffect } from 'react'

import Card from './Card/Card'

export default function MenuList({lang, categories = [], dishes = []}: {lang: "es" | "en" | "de", categories: CategoriesType[], dishes: DishesType[]}) { 
  const [dishesByCategory, setDishesByCategory] = React.useState<DishesType[]>(dishes)
  
  useEffect(() => {
    const drinkCategory = categories.find(category => ["bebidas", "drinks", "getränke"].some(cat => cat === category.name.toLowerCase()))

    if(window.location.search) {
      const url = new URL(window.location.href)
      const hasCategory = url.searchParams.has('category')
      const categorySelected = hasCategory ? parseInt(url.searchParams.get('category') || "0") : 0;

      setDishesByCategory(dishes.filter(food => categorySelected === 8 ? food.category.some(cat => cat !== drinkCategory?.id) : food.category.some(cat => cat === categorySelected)))
    }

    document.addEventListener("category-change", (event: CustomEvent<string>) => {
      const categorySelected = parseInt(event.detail);
      setDishesByCategory(dishes.filter(food => categorySelected === 8 ? food.category.some(cat => cat !== drinkCategory?.id) : food.category.some(cat => cat === categorySelected)))
    })
  }, [])

  
  return (
    <Suspense fallback={<div className='flex justify-center items-center'>Loading...</div>}>
      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 mt-4'>
        {dishesByCategory.map((food, index) => {
          return (
            <Card key={index} className={"!max-w-none"} food={food} lang={lang} useHorizontal={true}/>
          )
        })}
      </div>
    </Suspense>
  )
}
