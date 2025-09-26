import React from 'react'
import AllergenIcon from '../AllergenIcon';
import { twMerge } from 'tailwind-merge';
import { useTranslations } from '@/lib/i18n/useTranslations';

export default function Card({food, className = "", lang = "es", useHorizontal = false}) {
  const t = useTranslations(lang);
  const hasImage = food.image && food.image !== "";

  return (
    <div className={twMerge(`flex ${useHorizontal ? "flex-row md:flex-col " : "flex-col"} min-w-[200px] md:min-w-[200px] max-w-[250px] bg-white rounded-lg shadow-md ${hasImage ? "mb-3" : ""}`, className)}>
      {hasImage 
        ? <img src={food.image ? food.image : "/img/placeholder-image.webp"} 
            alt={food.name} 
            loading='lazy'
            className={`aspect-[1/0.8] object-cover rounded-lg mb-2 ${useHorizontal ? "w-[40%] h-full md:h-auto object-cover md:w-full" : "w-full"}`} /> 
        : null}

      <div className={`flex flex-col gap-2 p-4 w-full h-full justify-center ${hasImage ? "mb-3 md:justify-start" : ""}`}>
        <div className='flex flex-col md:flex-row gap-4 justify-between'>
          <div className='w-full'>
            <h2 className='text-lg font-semibold leading-5'>{food.name}</h2>
          </div>
          <div className='w-fit'>
            <span className='text-2xl text-primary font-semibold'>{food.price.toFixed(2).replaceAll(".00","")}€</span>  
          </div>
        </div>
        {/*<div className='flex flex-row gap-2 items-center'>
            <span className='text-md text-primary font-semibold'>{food.price}€</span>  
             {food.calories != 0 && <span className='text-sm text-gray-700'>|</span>} 
            {food.calories != 0 && <span className='text-sm text-gray-700'>{food.calories} cal</span> }  
        </div>*/}
        {/* <p className='grow leading-5 text-sm text-gray-600 text-pretty'>{food.ingredients.join(", ")}</p> */}

        {food.allergens.length > 0 && (
          <>
            <span className='text-sm text-gray-700 mt-1 leading-4 font-semibold'>{t("menu.allergens")}</span>
            <div className='flex flex-row gap-2 items-center'>
                {food.allergens.map((allergen, index) => {
                  return <AllergenIcon icon={allergen.id} key={index} size="20" className="text-gray-700 w-[20px] h-[20px]"/>
                })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
