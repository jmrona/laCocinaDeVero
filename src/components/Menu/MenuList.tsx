import React, { useCallback, useMemo } from 'react'

import {ArrowRight} from 'lucide-react'
import { FOOD_LIST } from '@/constants/food-list'
import FoodCategories from './FoodCategories/FoodCategories'
import { useTranslations } from '@/lib/i18n/useTranslations'

import Card from './Card/Card'
import type { CategoriesType } from '@/lib/getCategories'
import type { DishesType } from '@/lib/getDishes'

export default function MenuList({lang, categories = [], dishes = []}: {lang: "es" | "en" | "de", categories: CategoriesType[], dishes: DishesType[]}) { 
  const firstCategory = [...categories].slice(7)?.at(0)
  const [selectedCategory, setSelectedCategory] = React.useState<number>(firstCategory?.id || 0)
  const t = useTranslations(lang);

  const handleSelectCategory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = categories.find(category => category.id === parseInt(e.target.value))

    if (!categorySelected) return
    setSelectedCategory(categorySelected.id)
  }, [])

  const menuOfTheDay = useMemo(() => {
    const DAY_CATEGORY = {
      1: ["Lunes", "Monday", "Montag"],
      2: ["Martes", "Tuesday", "Dienstag"],
      3: ["Miércoles", "Wednesday", "Mittwoch"],
      4: ["Jueves", "Thursday", "Donnerstag"],
      5: ["Viernes", "Friday", "Freitag"],
      6: ["Sábado", "Saturday", "Samstag"],
      7: ["Domingo", "Sunday", "Sonntag"]
    } as const;

    const WEEK_DAYS = {
      "es": ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], 
      "en": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], 
      "de": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
    } as const;

    const today = new Date()
    const dayOfWeek = today.getDay() - 1
    const day = WEEK_DAYS[lang][dayOfWeek]

    const categoryId = Object.values(DAY_CATEGORY).findIndex(category => category.some(cat => cat === day))

    if( categoryId === -1) return []
    const category = categories.find(category => category.id === categoryId + 1)

    return dishes.filter(dish => dish.category.some(cat => cat === category?.id))
  }, [dishes])

  const foodList = useMemo(() => {
    let foods = [...FOOD_LIST]

    if (selectedCategory.length > 0) {
      foods = foods.filter(food => food.category.some(cat => selectedCategory.some(selectedCat => selectedCat === cat)))
    }

    return foods
  }, [FOOD_LIST, selectedCategory])

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

  return (
    <>
      {menuOfTheDay.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-7">
            <h1 className='text-2xl md:h4 mb-2 !font-bold font-accent'>{t("menu.specialMenu")}</h1>
            <div>
              <button className='ml-auto text-primary font-semibold flex items-center gap-2 cursor-pointer peer'>
                Ver menu especial <ArrowRight size={18}/>
              </button>
              <span className="w-0 block peer-hover:w-full bg-primary h-[1px] transition-all duration-300 mx-auto"></span>
            </div>
          </div>
          <div className='flex flex-row gap-2 flex-nowrap overflow-x-auto'>
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

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4'>
        {foodList.map((food, index) => {
          return (
            <Card key={index} food={food} lang={lang}/>
          )
        })}
      </div>
    </>
  )
}
