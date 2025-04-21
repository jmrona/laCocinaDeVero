import React, { useCallback, useEffect, useMemo } from 'react'
import {Vegan} from 'lucide-react'

import FoodCategories from './FoodCategories/FoodCategories'
import { useTranslations } from '@/lib/i18n/useTranslations'

import Card from './Card/Card'
import type { CategoriesType } from '@/lib/getCategories'
import type { DishesType } from '@/lib/getDishes'
import type { AllergensType } from '@/lib/getAllergens'

export default function MenuList({lang, categories = [], dishes = [], allergens = []}: {lang: "es" | "en" | "de", categories: CategoriesType[], dishes: DishesType[], allergens: AllergensType[]}) { 
  const firstCategory = [...categories].slice(7)?.at(0)
  const queryParams = new URLSearchParams(window.location.search)
  const categoryId = queryParams.get('category')
  const categoryIdNumber = parseInt(categoryId || "0")
  const [selectedCategory, setSelectedCategory] = React.useState<number>(queryParams.has("category") ? categoryIdNumber : firstCategory?.id || 0)

  const t = useTranslations(lang);

  useEffect(() => {
    const url = new URL(window.location.href)
    const category = url.searchParams.get('category')

    if(!category) {
      url.searchParams.set('category', selectedCategory.toString())
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  const handleSelectCategory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = categories.find(category => category.id === parseInt(e.target.value))

    if (!categorySelected) return
    setSelectedCategory(categorySelected.id)
    const url = new URL(window.location.href)
    url.searchParams.set('category', categorySelected.id.toString())
    window.history.replaceState({}, '', url.toString())
  }, [])

  const categoriesToShow = useMemo(() => {
    const categories_icons = {
      "carnes": "🍖",
      "meats": "🍖",
      "fleisch": "🍖",
      "pescados": "🐟",
      "fish": "🐟",
      "fisch": "🐟",
      "tortillas": "🍳",
      "omelets": "🍳",
      "omeletts": "🍳",
      "pastas": "🍝",
      "pasta": "🍝",
      "teigwaren": "🍝",
      "postres": "🍰",
      "desserts": "🍰",
      "nachspeisen": "🍰",
      "extra": "🍽️",
      "extras": "🍽️",
      "bebidas": "🍹",
      "drinks": "🍹",
      "getränke": "🍹",
      "ensaladas": "🥗",
      "salads": "🥗",
      "salate": "🥗",
      "vegano": <Vegan/>,
      "vegan": <Vegan/>,
      "vegetariano": <Vegan/>,
      "vegetarian": <Vegan />,
      "vegetarisch": "🥗",
      "platos fríos": "🥗",
      "cold dishes": "🥗",
      "kalte gerichte": "🥗"
    } as const;

    return [...categories].slice(7).map(category => {
      const categoryName = category.name.toLowerCase() as keyof typeof categories_icons
      const icon = categories_icons[categoryName] || "🍽"

      return {
        ...category,
        icon: icon
      }
    })
  }, [])

  const dishesByCategory = useMemo(() => {
    const drinkCategory = categories.find(category => category.name.toLowerCase() === "bebidas" || category.name.toLowerCase() === "drinks" || category.name.toLowerCase() === "getränke")

    return dishes.filter(food => selectedCategory === 8 ? food.category.some(cat => cat !== drinkCategory?.id) : food.category.some(cat => cat === selectedCategory))
  }, [selectedCategory])
  
  return (
    <>
      <h1 className='text-2xl md:h4 mt-7 mb-2 !font-bold font-accent'>{t("menu.categories")}</h1>

      <FoodCategories 
        selectedCategory={selectedCategory} 
        categories={categoriesToShow} 
        handleSelectCategory={handleSelectCategory} />

      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 mt-4'>
        {dishesByCategory.map((food, index) => {
          return (
            <Card key={index} className={"!max-w-none"} food={food} lang={lang} useHorizontal={true}/>
          )
        })}
      </div>
    </>
  )
}
