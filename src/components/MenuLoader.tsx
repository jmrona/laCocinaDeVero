import React, { useState, useEffect } from 'react';
import { MenuOfTheDayLazy } from './sections/MenuOfTheDay/MenuOfTheDayLazy';
import MenuList from './Menu/MenuList';
import type { MenuData, LangType } from '@/types/menu';

interface Props {
    lang: LangType;
}

const MenuLoader: React.FC<Props> = ({ lang }) => {
    const [menuData, setMenuData] = useState<MenuData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadMenuData = async () => {
            try {
                console.log(`🚀 Loading menu data for ${lang}...`);
                const startTime = performance.now();

                // Fetch data from our API endpoint
                const response = await fetch(`/api/menu/${lang}`);

                if (!response.ok) {
                    throw new Error(`Failed to load menu data: ${response.status}`);
                }

                const data = await response.json();
                const endTime = performance.now();

                console.log(`✅ Menu data loaded in ${(endTime - startTime).toFixed(2)}ms`);

                if (isMounted) {
                    setMenuData(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('❌ Failed to load menu data:', err);
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Failed to load menu');
                    setLoading(false);
                }
            }
        };

        loadMenuData();

        return () => {
            isMounted = false;
        };
    }, [lang]);

    if (loading) {
        return <MenuLoadingSkeleton />;
    }

    if (error) {
        return <MenuErrorFallback error={error} onRetry={() => window.location.reload()} />;
    }

    if (!menuData) {
        return <MenuErrorFallback error="No menu data available" onRetry={() => window.location.reload()} />;
    }

    const categoriesToShow = menuData.categories.slice(7);

    return (
        <>
            <div data-component="menu-of-the-day" className="lazy-component">
                <MenuOfTheDayLazy
                    menuOfTheDay={menuData.menuOfTheDay}
                    weekMenu={menuData.weekMenu}
                    lang={lang}
                />
            </div>

            <div data-component="menu-categories" className="lazy-component">
                <FoodCategories categories={categoriesToShow} />
            </div>

            <div data-component="menu-list" className="lazy-component">
                <MenuList
                    lang={lang}
                    dishes={menuData.dishes}
                    categories={menuData.categories}
                />
            </div>
        </>
    );
};

// Loading skeleton component with shimmer effect
const MenuLoadingSkeleton: React.FC = () => (
    <div className="space-y-8">
        {/* Loading indicator */}
        <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-gray-600">
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2 text-sm font-medium">Cargando menú...</span>
            </div>
        </div>

        {/* Menu of the day skeleton */}
        <div className="mt-7">
            <div className="flex items-center justify-between mb-4">
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-48 animate-shimmer"></div>
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-32 animate-shimmer"></div>
            </div>
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="min-w-[250px] bg-white rounded-lg shadow-md p-4">
                        <div className="w-full h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-md mb-3 animate-shimmer"></div>
                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-2 animate-shimmer"></div>
                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* Categories skeleton */}
        <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full w-24 animate-shimmer"></div>
            ))}
        </div>

        {/* Menu list skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                    <div className="w-full aspect-[1/0.8] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mb-2 animate-shimmer"></div>
                    <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-2 animate-shimmer"></div>
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/2 animate-shimmer"></div>
                </div>
            ))}
        </div>


    </div>
);

// Error fallback component
const MenuErrorFallback: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto my-8">
        <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                    Error loading menu
                </h3>
            </div>
        </div>

        <div className="text-sm text-yellow-700 mb-4">
            <p>We're having trouble loading the menu: {error}</p>
            <p className="mt-1">Please try refreshing the page or contact us directly.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
            <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
            >
                Try Again
            </button>

            <a
                href="tel:+34652640538"
                className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50"
            >
                Call Restaurant
            </a>
        </div>
    </div>
);

// Simple FoodCategories component for client-side rendering with URL query params
const FoodCategories: React.FC<{ categories: any[] }> = ({ categories }) => {
    // Get current category from URL params, default to 8 (Todos)
    const getCurrentCategory = (): number => {
        if (typeof window === 'undefined') return 8;

        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');

        if (categoryParam) {
            const categoryId = parseInt(categoryParam);
            return isNaN(categoryId) ? 8 : categoryId;
        }

        return 8; // Default to "Todo"
    };

    const [selectedCategory, setSelectedCategory] = useState<number>(getCurrentCategory);

    // Update URL and dispatch event when category changes
    const handleCategoryClick = (categoryId: number) => {
        setSelectedCategory(categoryId);

        // Update URL without page reload
        const url = new URL(window.location.href);
        if (categoryId === 8) {
            // Remove category param for "Todos" (default)
            url.searchParams.delete('category');
        } else {
            url.searchParams.set('category', categoryId.toString());
        }

        // Update URL without triggering navigation
        window.history.replaceState({}, '', url.toString());

        // Dispatch custom event for MenuList to listen
        const event = new CustomEvent('category-change', {
            detail: categoryId.toString()
        });
        document.dispatchEvent(event);
    };

    // Listen for browser back/forward navigation and initialize
    useEffect(() => {
        const handlePopState = () => {
            const newCategory = getCurrentCategory();
            setSelectedCategory(newCategory);

            // Dispatch event to update MenuList
            const event = new CustomEvent('category-change', {
                detail: newCategory.toString()
            });
            document.dispatchEvent(event);
        };

        // Set up popstate listener
        window.addEventListener('popstate', handlePopState);

        // Trigger initial category change event on mount
        const initialEvent = new CustomEvent('category-change', {
            detail: selectedCategory.toString()
        });
        document.dispatchEvent(initialEvent);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [selectedCategory]);

    return (
        <div className="flex gap-2 flex-wrap mt-4">
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === category.id
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
};

export default MenuLoader;