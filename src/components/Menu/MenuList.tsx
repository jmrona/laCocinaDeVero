import React, { useCallback, useMemo } from 'react'
import { ALLERGENS } from '@/constants/allergens'
import {Search} from './Search'
import {Pizza} from 'lucide-react'
import { FOOD_CATEGORIES } from '@/constants/food-categories'
import { FOOD_LIST } from '@/constants/food-list'
import FoodCategories from './FoodCategories/FoodCategories'

export default function MenuList() {
  const ref = React.useRef<HTMLInputElement>(null)
  const [search, setSearch] = React.useState<string>("")
  const [selectedCategory, setSelectedCategory] = React.useState<number[]>([])

  const handleClearSearch = useCallback(() => {
    setSearch("")
    ref.current?.focus()
  }, [])

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleSelectCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const categorySelected = FOOD_CATEGORIES.find(category => category.id === parseInt(e.target.value))

    setSelectedCategory(prev => {
      if(!categorySelected) return prev

      if (prev?.find(cat => cat === categorySelected?.id)) {
        return prev.filter(cat => cat !== categorySelected.id)
      } else {
        return [...prev ?? [], categorySelected?.id]
      }
    })
  }


  const foodList = useMemo(() => {
    let foods = [...FOOD_LIST]

    if (search.length > 0) {
      foods = foods.filter(food => food.name.toLowerCase().includes(search.toLowerCase()))
    }

    console.log('selectedCategory: ', selectedCategory);
    if (selectedCategory.length > 0) {
      foods = foods.filter(food => food.category.some(cat => selectedCategory.some(selectedCat => selectedCat === cat)))
    }

    return foods
  }, [search, selectedCategory])


  return (
    <>
      <Search ref={ref} value={search} placeholder={"What do you want to eat?"} className='rounded-tl rounded-tr' onChange={handleSearch} onClear={handleClearSearch} autoComplete="off"/>

      <div className='flex flex-col md:flex-row gap-2 mt-4'>
        <div className="flex-1/2">
          <label className='bg-secondary rounded-2xl py-5 px-8 mt-4 flex'>
            <input type="radio" name="food-category" id="food-category-special" className="hidden" value={1} onChange={handleSelectCategory}/>
            <div className='flex-1/2 flex items-center'>
              <h2 className='h2 font-accent text-balance'>
                See the menu of the day
              </h2>
            </div>
            <div className='flex-1/2 flex items-center justify-end'>
              <Pizza size="100" className='rotate-z-90 text-primary'/>
            </div>
        </label>
        </div>
        <div className="flex-1/2">
          <div className='bg-secondary rounded-2xl py-5 px-8 mt-4 flex'>
            <div className='flex-1/2 flex items-center'>
              <h2 className='h2 font-accent text-balance'>
                See the menu of the week
              </h2>
            </div>
            <div className='flex-1/2 flex items-center justify-end'>
              <Pizza size="100" className='rotate-z-90 text-primary'/>
            </div>
          </div>
        </div>
      </div>

      <h1 className='h2 md:h4 mt-7 mb-2 !font-bold font-accent'>Food Categories</h1>

      <FoodCategories selectedCategory={selectedCategory} handleSelectCategory={handleSelectCategory} />
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4'>

        {foodList.map((food, index) => {

          return (
            <div>{food.name}</div>
          )
        })}
      </div>
    </>
  )
}
