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

const ALLERGEN_ID = {
    1: Wheat,
    2: Shrimp,
    3: Egg,
    4: Fish,
    5: Nut,
    6: Bean,
    7: Milk,
    8: Nut,
    9: Celery,
    10: Mustard,
    11: Sesame,
    12: Sulphur,
    13: Lupin,
    14: Shell,
} as const;

export default function AllergenIcon({icon, ...rest}: {icon: keyof typeof ALLERGEN_ID} & React.SVGProps<SVGSVGElement>) {
    const Icon = ALLERGEN_ID[icon];
    
    if (!Icon) {
        return null
    }

    return (
        <>
            <Icon {...rest}/>
        </>
    )
}
