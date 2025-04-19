import React, { Fragment, useCallback, useMemo } from 'react'
import { ALLERGENS } from '@/constants/allergens'

import {Pizza, ArrowBigRight, ArrowRight} from 'lucide-react'
import { FOOD_CATEGORIES } from '@/constants/food-categories'
import { FOOD_LIST } from '@/constants/food-list'
import FoodCategories from './FoodCategories/FoodCategories'
import { useTranslations } from '@/lib/i18n/useTranslations'
import AllergenIcon from './AllergenIcon'
import Card from './Card/Card'

export default function MenuList({lang}: {lang: "es" | "en" | "de"}) {  
  const [selectedCategory, setSelectedCategory] = React.useState<number[]>([])
  const t = useTranslations(lang);

  const handleSelectCategory = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = FOOD_CATEGORIES.find(category => category.id === parseInt(e.target.value))

    setSelectedCategory(prev => {
      if(!categorySelected) return prev

      if (prev?.find(cat => cat === categorySelected?.id)) {
        return prev.filter(cat => cat !== categorySelected.id)
      } else {
        return [...prev ?? [], categorySelected?.id]
      }
    })
  }, [])


  const foodList = useMemo(() => {
    let foods = [...FOOD_LIST]


    if (selectedCategory.length > 0) {
      foods = foods.filter(food => food.category.some(cat => selectedCategory.some(selectedCat => selectedCat === cat)))
    }

    return foods
  }, [FOOD_LIST, selectedCategory])

  const specialMenu = useMemo(() => {
    return FOOD_LIST.filter(food => food.category.some(cat => cat === 1))
  }, [FOOD_LIST])


  return (
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
        {specialMenu.slice(0, 4).map((food, index) => {
          return (
            <Card key={index} food={food} lang={lang}/>
          )
        })}
      </div>

      <h1 className='text-2xl md:h4 mt-7 mb-2 !font-bold font-accent'>{t("menu.categories")}</h1>

      <FoodCategories selectedCategory={selectedCategory} handleSelectCategory={handleSelectCategory} />
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
