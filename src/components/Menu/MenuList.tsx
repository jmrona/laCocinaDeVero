import React, { useCallback, useEffect, useMemo } from 'react'

import {ArrowRight} from 'lucide-react'
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
      window.history.pushState({}, '', url.toString())
    }
  }, [])

  const handleSelectCategory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = categories.find(category => category.id === parseInt(e.target.value))

    if (!categorySelected) return
    setSelectedCategory(categorySelected.id)
    const url = new URL(window.location.href)
    url.searchParams.set('category', categorySelected.id.toString())
    window.history.pushState({}, '', url.toString())
  }, [])

  const menuOfTheDay = useMemo(() => {
    const DAY_CATEGORY = {
      0: ["Domingo", "Sunday", "Sonntag"],
      1: ["Lunes", "Monday", "Montag"],
      2: ["Martes", "Tuesday", "Dienstag"],
      3: ["Miércoles", "Wednesday", "Mittwoch"],
      4: ["Jueves", "Thursday", "Donnerstag"],
      5: ["Viernes", "Friday", "Freitag"],
      6: ["Sábado", "Saturday", "Samstag"],
    } as const;

    const WEEK_DAYS = {
      "es": ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"], 
      "en": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",], 
      "de": ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
    } as const;

    const today = new Date()
    const dayOfWeek = today.getDay()
    const day = WEEK_DAYS[lang][dayOfWeek]

    const categoryId = Object.values(DAY_CATEGORY).findIndex(category => category.some(cat => cat === day))

    if( categoryId === -1) return []
    const category = categories.find(category => category.id === categoryId + 1)

    return dishes.filter(dish => dish.category.some(cat => cat === category?.id))
  }, [dishes])

  const categoriesToShow = useMemo(() => {
    // const WEEK_DAYS = {
    //   "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], 
    //   "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], 
    //   "de": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    // } as const;

    // const today = new Date()
    // const dayOfWeek = today.getDay() - 1
    // const day = WEEK_DAYS[lang][dayOfWeek]

    // const weekDaysCategories = [...categories].slice(0, 7)
    // const todayCategory = weekDaysCategories.find(category => category.name === day)

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
      "vegano": "🥗",
      "vegan": "🥗",
      "vegetariano": "🥗",
      "vegetarian": "🥗",
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
    return dishes.filter(food => food.category.some(cat => cat === selectedCategory))
  }, [selectedCategory])

  return (
    <>
      {menuOfTheDay.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-7">
            <h1 className='text-2xl md:h4 mb-2 !font-bold font-accent'>{t("menu.specialMenu")}</h1>
            <div>
              <button className='ml-auto text-primary font-semibold flex items-center gap-2 cursor-pointer peer'>
                {t("menu.seeSpecialMenu")} <ArrowRight size={18}/>
              </button>
              <span className="w-0 block peer-hover:w-full bg-primary h-[1px] transition-all duration-300 mx-auto"></span>
            </div>
          </div>
          <div className='flex flex-row gap-4 flex-nowrap overflow-x-auto'>
            {menuOfTheDay.slice(0, 4).map((food, index) => {
              return (
                <Card key={index} food={food} lang={lang}/>
              )
            })}
          </div>
        </>
      )}

      <h1 className='text-2xl md:h4 mt-7 mb-2 !font-bold font-accent'>{t("menu.categories")}</h1>

      <FoodCategories 
        selectedCategory={selectedCategory} 
        categories={categoriesToShow} 
        handleSelectCategory={handleSelectCategory} />

      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4'>
        {dishesByCategory.map((food, index) => {
          return (
            <Card key={index} className={"!max-w-none"} food={food} lang={lang}/>
          )
        })}
      </div>
    </>
  )
}
