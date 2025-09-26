import React, { Suspense, useState } from 'react'
import styles from './MenuList.module.css'
import Card from './Card/Card'
import { useTranslations } from '@/lib/i18n/useTranslations'
import type { CategoriesType } from '@/lib/getCategories'

import { ArrowRight, X } from 'lucide-react'
import type { Dishes } from '@/lib/getDishesByLang'
const DRINK_CATEGORY_ID = 17

const DAYS_CATEGORIES = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo"
}

const MENU_OF_DAY_IDS = Object.keys(DAYS_CATEGORIES).map(key => parseInt(key));

const todayId = new Date().getDay();


export default function MenuList({lang, categories = [], dishes = []}: {lang: "es" | "en" | "de", categories: CategoriesType[], dishes: Dishes[]}) { 
  const modalRef = React.useRef<HTMLDialogElement>(null);
  const [categorySelected, setCategorySelected] = useState(8);

  const t = useTranslations(lang);

  const handleSelectCategory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = parseInt(event.target.value);
    setCategorySelected(categorySelected);
  }

  const menuOfTheDay = dishes.filter(dish => {
    const categoryIds = dish.categories.map(cat => cat.id);

    return categoryIds.some(id => id === todayId);
  })

  const dishesOfTheWeek = dishes.filter(dish => {
    const dishes = dish.categories.some(cat => {
      return MENU_OF_DAY_IDS.some(id => cat.id == id);
    })
    return dishes;
  })

  const menuOfWeekGroupedByCategoryId = dishesOfTheWeek.reduce((acc, dish) => {
    const categoryIds = dish.categories.map(cat => cat.id);
    
    categoryIds.forEach(catId => {
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(dish);
    })
    
    return acc;
  }, {} as Record<number, Dishes[]>)

  const alldishes = dishes.filter(dish => {
    const categoryIds = dish.categories.map(cat => cat.id);
    
    return !categoryIds.some(id => MENU_OF_DAY_IDS.includes(id));
  })

  const categoriesWithoutDaysOfWeek = categories.filter(cat => !MENU_OF_DAY_IDS.includes(cat.id))

  const handleOpenModal = () => {
    modalRef.current?.showModal();
  }

  const handleCloseModal = () => {
    modalRef.current?.close();
  }

  return (
    <Suspense fallback={<div className='flex justify-center items-center'>Loading...</div>}>
      <div className="flex items-center justify-between mt-7">
          <h1 className='text-2xl md:h4 mb-2 !font-bold font-accent'>{t("menu.specialMenu")}</h1>
          <div>
            <button id="see-special-menu" className='ml-auto text-primary font-semibold flex items-center gap-2 cursor-pointer peer' onClick={handleOpenModal}>
              {t("menu.seeSpecialMenu")} <ArrowRight size={18}/>
            </button>
            <span className="w-0 block peer-hover:w-full bg-primary h-[1px] transition-all duration-300 mx-auto"></span>
          </div>
      </div>

      <div id="menu-of-the-day" className="">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4">
          {menuOfTheDay.map((food) => {
              return (
                <Card food={food} className={"!max-w-none"} lang={lang} useHorizontal={true}/>
              )
          })}
          </div>
      </div>

      <h1 className='text-2xl md:h4 mt-7 mb-2 !font-bold font-accent'>{t("menu.categories")}</h1>
      <div id="food-categories" className={`${styles.categoriesWrapper} flex flex-wrap gap-2 mb-8`}>
          {categoriesWithoutDaysOfWeek.map((category) => (
              <label data-selected={categorySelected === category.id} className={`${styles.category} h-full bg-neutral/70 rounded-xl py-2 px-4 flex flex-row items-center gap-2 w-fit select-none cursor-pointer`}>
                  <span className='text-lg'>{category.icon}</span>
                  <h3 className='text-base font-semibold'>
                      {category.name}
                  </h3>
                  <input onChange={handleSelectCategory} type='radio' name='food-category' id={`category-${category.id}`} value={category.id} className='hidden' />
              </label>
          ))}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-4 mt-4'>
        {alldishes.filter(food => {
          if(categorySelected === 8) return true
          return food.categories.some(cat => cat.id === categorySelected)
        }).map((food, index) => {
          if (food.categories.some(cat => cat.id === DRINK_CATEGORY_ID)){
            food.image = "";
          }

          return (
            <Card key={index} className={"!max-w-none"} food={food} lang={lang} useHorizontal={true}/>
          )
        }).sort((a, b) => a.props.food.name.localeCompare(b.props.food.name))}
      </div>

      <dialog ref={modalRef} id="see-special-menu-dialog" className="max-w-screen md:max-w-[500px] md:my-auto p-5 h-fit w-full mx-auto" aria-labelledby="see-special-menu-title" role="dialog" aria-modal="true">
        <div className="flex justify-end">
            <button id="see-special-menu-close" className="text-dark font-semibold flex items-center gap-2 cursor-pointer w-auto" onClick={handleCloseModal}>
                <span className="sr-only">{t("modal.close")}</span> <X className='text-gray-500' size={25}/>
            </button>
        </div>
        <h2 className="text-xl font-semibold text-balance leading-5 border-b-primary border-b-2 pb-2 inline-block mb-4">{t("menu.specialMenu")}</h2>
        <div className="flex flex-col gap-2">
            {Object.entries(menuOfWeekGroupedByCategoryId).map(([day, foodArray], index) => {
                const category = categories.find(cat => cat.id === parseInt(day));
                const listOfFoods = foodArray.map(food => food.name).join(', ');
                if (!category || !listOfFoods) return;
                return (
                  <div className="flex flex-col gap-2 p-4 h-full">
                    <h2 className="text-lg font-semibold text-balance leading-3">{category.name}</h2>
                    <p className="text-gray-700 text-md">{listOfFoods}</p>
                  </div>
                )
            })}
        </div>
      </dialog>
    </Suspense>
  )
}
