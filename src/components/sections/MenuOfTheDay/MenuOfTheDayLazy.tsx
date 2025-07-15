import React, { useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ArrowRight, X } from 'lucide-react';
import type { DishesType } from '@/types/menu';

// Import Swiper styles
import 'swiper/css';
import AllergenIcon from '@/components/Menu/AllergenIcon';
import { useTranslations } from '@/lib/i18n/useTranslations';

interface Props {
    menuOfTheDay: DishesType[];
    weekMenu: Record<string, string[]>;
    lang: "es" | "en" | "de";
}

// Simple translations for the component
const translations = {
    es: {
        specialMenu: "Menú Especial",
        seeSpecialMenu: "Ver menú especial",
        close: "Cerrar"
    },
    en: {
        specialMenu: "Special Menu",
        seeSpecialMenu: "See special menu",
        close: "Close"
    },
    de: {
        specialMenu: "Spezialmenü",
        seeSpecialMenu: "Spezialmenü ansehen",
        close: "Schließen"
    }
};

// Simple Card component for dishes
const DishCard: React.FC<{ dish: DishesType; lang: string }> = ({ dish, lang }) => {
    const t = useTranslations(lang);
    return (
    <div className="bg-white rounded-lg shadow-md min-w-[250px]">
        {dish.image && (
            <img
                src={dish.image}
                alt={dish.name}
                className="w-full aspect-[1/0.6] object-cover rounded-lg mb-2"
                loading="lazy"
            />
        )}
        <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{dish.name}</h3>
            <p className="text-primary font-bold text-xl">€{dish.price.toFixed(2)}</p>
            {dish.allergens.length > 0 && (
                <>
                    <span className='text-sm text-gray-700 mt-1 leading-4 font-semibold'>{t("menu.allergens")}</span>
                    <div className='flex flex-row gap-2 items-center'>
                        {dish.allergens.map((allergen, index) => {
                            return <AllergenIcon icon={allergen} key={index} size="20" className="text-gray-700 w-[20px] h-[20px]" />
                        })}
                    </div>
                </>
            )}
        </div>
    </div>
)};

export const MenuOfTheDayLazy: React.FC<Props> = ({ menuOfTheDay, weekMenu, lang }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const t = translations[lang];

    const openDialog = () => {
        dialogRef.current?.showModal();
    };

    const closeDialog = () => {
        dialogRef.current?.close();
    };

    const handleDialogClick = (event: React.MouseEvent<HTMLDialogElement>) => {
        const rect = dialogRef.current?.getBoundingClientRect();
        if (!rect) return;

        const isInDialog =
            event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;

        if (!isInDialog) {
            closeDialog();
        }
    };

    return (
        <div className="mt-7">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl mb-2 font-bold font-accent">
                    {t.specialMenu}
                </h1>
                <div>
                    <button
                        onClick={openDialog}
                        className="ml-auto text-primary font-semibold flex items-center gap-2 cursor-pointer hover:underline"
                    >
                        {t.seeSpecialMenu} <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Swiper for menu items */}
            <div className="min-h-[390px] mt-4">
                <Swiper
                    slidesPerView="auto"
                    spaceBetween={16}
                    className="overflow-x-clip"
                >
                    {menuOfTheDay.map((dish, index) => (
                        <SwiperSlide key={dish.id || index} className="w-auto! my-3">
                            <DishCard dish={dish} lang={lang} />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Dialog for weekly menu */}
            <dialog
                ref={dialogRef}
                onClick={handleDialogClick}
                className="max-w-screen md:max-w-[500px] md:my-auto p-5 h-fit w-full mx-auto rounded-lg"
            >
                <div className="flex justify-end">
                    <button
                        onClick={closeDialog}
                        className="text-dark font-semibold flex items-center gap-2 cursor-pointer w-auto"
                    >
                        <span className="sr-only">{t.close}</span>
                        <X className="text-gray-500" size={25} />
                    </button>
                </div>

                <h2 className="text-xl font-semibold text-balance leading-5 border-b-primary border-b-2 pb-2 inline-block mb-4">
                    {t.specialMenu}
                </h2>

                <div className="flex flex-col gap-2">
                    {Object.entries(weekMenu).map(([day, foodArray]) => (
                        <div key={day} className="flex flex-col gap-2 p-4 h-full">
                            <h2 className="text-lg font-semibold text-balance leading-3">{day}</h2>
                            <p className="text-gray-700 text-md">{foodArray.join(', ')}</p>
                        </div>
                    ))}
                </div>
            </dialog>
        </div>
    );
};