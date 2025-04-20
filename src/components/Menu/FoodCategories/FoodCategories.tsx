import React from 'react'
import { twMerge } from 'tailwind-merge'

import styles from './FoodCategories.module.css'

export default function FoodCategories({className = "", selectedCategory, handleSelectCategory, categories = []}: {className?: string | undefined, selectedCategory: number, handleSelectCategory: (e: React.ChangeEvent<HTMLInputElement>) => void, categories?: {id: number, name: string, icon: string | React.JSX.Element}[]}) {

  return (
    <div className={twMerge(`${styles.categoriesWrapper} flex flex-nowrap md:flex-wrap gap-2`, className)}>
      {categories.map((category, index) => (
        <label key={category.id} data-selected={selectedCategory === category.id} className={`${styles.category} bg-neutral/70 rounded-xl py-2 px-4 flex flex-row items-center gap-2 select-none cursor-pointer`}>
          <span className='text-2xl'>{category.icon}</span>
          <h3 className='text-xl font-accent'>
              {category.name}
          </h3>
          <input type='radio' name='food-category' id={`category-${category.id}`} value={category.id} className='hidden' onChange={handleSelectCategory} />
        </label>
      ))}
    </div>
  )
}
