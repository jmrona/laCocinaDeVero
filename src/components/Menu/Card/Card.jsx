import React from 'react'
import AllergenIcon from '../AllergenIcon';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from '@/lib/i18n/useTranslations';

export default function Card({food, className = "", lang = "es", useHorizontal = false}) {
  const t = useTranslations(lang);
  const hasImage = food.image && food.image !== "";

  return (
    <div className={twMerge(className, `flex ${useHorizontal ? "flex-row md:flex-col " : "flex-col"} min-w-[200px] md:min-w-[200px] max-w-[250px] bg-white rounded-lg shadow-md ${hasImage ? "mb-3" : ""}`)}>
      {hasImage 
        ? <img src={food.image ? food.image : "/img/placeholder-image.jpg"} 
            alt={food.name} 
            className={`aspect-[1/0.8] object-cover rounded-lg mb-2 ${useHorizontal ? "w-[40%] h-full md:h-auto object-cover md:w-full" : "w-full"}`} /> 
        : null}

      <div className={`flex flex-col gap-2 p-4 ${hasImage ? "mb-3" : ""}`}>
        <h2 className='text-lg font-semibold text-balance leading-5'>{food.name}</h2>
        <div className='flex flex-row gap-2 items-center'>
            <span className='text-md text-primary font-semibold'>{food.price}€</span>  
            {food.calories != 0 && <span className='text-sm text-gray-700'>|</span>} 
            {food.calories != 0 && <span className='text-sm text-gray-700'>{food.calories} cal</span> } 
        </div>
        <p className='leading-5 text-sm text-gray-700 text-pretty'>{food.description}</p>

        {food.allergens.length > 0 && (
          <>
            <span className='text-sm text-gray-700 mt-1 leading-4 font-semibold'>{t("menu.allergens")}</span>
            <div className='flex flex-row gap-2 items-center'>
                {food.allergens.map((allergen, index) => {
                  return <AllergenIcon icon={allergen} key={index} size="20" className="text-gray-700 w-[20px] h-[20px]"/>
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
