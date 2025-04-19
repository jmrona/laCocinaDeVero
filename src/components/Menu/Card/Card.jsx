import React from 'react'
import AllergenIcon from '../AllergenIcon';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from '@/lib/i18n/useTranslations';

export default function Card({food, className = "", lang = "es"}) {
  const t = useTranslations(lang);

  return (
    <div className={twMerge('flex flex-col min-w-[200px] md:min-w-[250px] bg-white rounded-lg shadow-md mb-3', className)}>
        <img src={"/img/placeholder-image.jpg"} alt={food.name} className='w-full aspect-[1/0.8] object-cover rounded-lg mb-2' />
        <div className='flex flex-col gap-2 p-4 mb-3'>
        <h2 className='text-lg font-semibold'>{food.name}</h2>
        <div className='flex flex-row gap-2 items-center'>
            <span className='text-md text-primary font-semibold'>{food.price}€</span>  
            <span className='text-sm text-gray-700'>|</span>  
            <span className='text-sm text-gray-700'>{food.cal} cal</span>  
        </div>
        <p className='leading-5 text-md text-gray-700'>{food.description}</p>

        <span className='text-sm text-gray-700 mt-1'>{t("menu.allergens")}</span>
        <div className='flex flex-row gap-2 items-center'>
            {food.allergens.map((allergen, index) => {
            return <AllergenIcon icon={allergen} key={index} size="20" className="text-gray-700 w-[20px] h-[20px]"/>
            })}
        </div>
        </div>
    </div>
  )
}
