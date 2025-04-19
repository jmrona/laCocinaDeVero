/// <reference types="vite-plugin-svgr/client" />

import React from 'react'
import { Wheat, Egg, Fish, Milk, Shell, Nut, Bean, Shrimp } from 'lucide-react'
import Celery from '@/assets/icons/celery.svg?react'
import Lupin from '@/assets/icons/lupin.svg?react'
import Mustard from '@/assets/icons/mustard.svg?react'
import Sesame from '@/assets/icons/sesame.svg?react'
import Sulphur from '@/assets/icons/sulphur.svg?react'

const ALLERGEN_ICONS = {
    "gluten": Wheat,
    "egg": Egg,
    "fish": Fish,
    "milk": Milk,
    "nuts": Nut,
    "soy": Bean,
    "crustacean": Shrimp,
    "celery": Celery,
    "mustard": Mustard,
    "sesame": Sesame,
    "sulphur": Sulphur,
    "mollusk": Shell,
    "lupine": Lupin,
} as const;

export default function AllergenIcon({icon, ...rest}: {icon: keyof typeof ALLERGEN_ICONS} & React.SVGProps<SVGSVGElement>) {
    const Icon = ALLERGEN_ICONS[icon];
    if (!Icon) {
        return null
    }

    return (
        <>
            <Icon {...rest}/>
        </>
    )
}
