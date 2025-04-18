import React from 'react'
import { FOOD_CATEGORIES } from '@/constants/food-categories'

import styles from './FoodCategories.module.css'
import { twMerge } from 'tailwind-merge'

export default function FoodCategories({className = "", selectedCategory, handleSelectCategory}: {className?: string | undefined, selectedCategory: number[], handleSelectCategory: (e: React.ChangeEvent<HTMLInputElement>) => void}) {
  console.log('selectedCategory: ', selectedCategory);

  return (
    <div className={twMerge(`${styles.categoriesWrapper} flex flex-nowrap md:flex-wrap gap-2`, className)}>
        {FOOD_CATEGORIES.map((category, index) => (
            <label key={category.id} data-selected={Boolean(selectedCategory.find(cat => cat === category.id))} className={`${styles.category} bg-gray-200 rounded-2xl py-2 px-4 flex items-center gap-2 select-none`}>
                <span className='text-2xl'>{category.icon}</span>
                <input type='checkbox' name='food-category' checked={Boolean(selectedCategory.find(cat => cat === category.id))} id={`category-${category.id}`} value={category.id} className='hidden' onChange={handleSelectCategory} />
                <h3 className='text-xl font-accent '>
                    {category.name}
                </h3>
            </label>
        ))}
    </div>
  )
}
