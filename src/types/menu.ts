export type LangType = 'es' | 'en' | 'de';

export interface CategoriesType {
    id: number;
    name: string;
    icon: string | React.JSX.Element;
}

export interface DishesType {
  id: number;
  name: string;
  description?: string;
  ingredients?: string;
  allergens: number[];
  price: number;
  categories: number[];
  calories?: number;
  image: string;
}

export interface MenuData {
  categories: CategoriesType[];
  dishes: DishesType[];
  menuOfTheDay: DishesType[];
  weekMenu: Record<string, string[]>;
}