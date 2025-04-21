import React from 'react'
import { twMerge } from 'tailwind-merge'
import {Swiper, SwiperSlide} from 'swiper/react';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import styles from './FoodCategories.module.css'

export default function FoodCategories({className = "", selectedCategory, handleSelectCategory, categories = []}: {className?: string | undefined, selectedCategory: number, handleSelectCategory: (e: React.ChangeEvent<HTMLInputElement>) => void, categories?: {id: number, name: string, icon: string | React.JSX.Element}[]}) {

  return (
    <div className={twMerge(`${styles.categoriesWrapper} flex gap-2`, className)}>
       <Swiper
          spaceBetween={5}
          slidesPerView={"auto"}
        >
          {categories.map((category) => (
            <SwiperSlide key={category.id} className="!w-fit">
              <label data-selected={selectedCategory === category.id} className={`${styles.category} h-full bg-neutral/70 rounded-xl py-2 px-4 flex flex-row items-center gap-2 w-fit select-none cursor-pointer`}>
                <span className='text-2xl'>{category.icon}</span>
                <h3 className='text-xl font-semibold'>
                    {category.name}
                </h3>
                <input type='radio' name='food-category' id={`category-${category.id}`} value={category.id} className='hidden' onChange={handleSelectCategory} />
              </label>
            </SwiperSlide>
          ))}
        </Swiper>
    </div>
  )
}
