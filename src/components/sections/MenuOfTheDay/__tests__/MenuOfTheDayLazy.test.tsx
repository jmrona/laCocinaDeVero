import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuOfTheDayLazy } from '../MenuOfTheDayLazy';
import type { DishesType } from '@/types/menu';

// Mock Swiper components
vi.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }: any) => <div data-testid="swiper" {...props}>{children}</div>,
  SwiperSlide: ({ children, ...props }: any) => <div data-testid="swiper-slide" {...props}>{children}</div>
}));

describe('MenuOfTheDayLazy', () => {
  const mockMenuOfTheDay: DishesType[] = [
    {
      id: 1,
      name: 'Plato del día 1',
      price: 12.50,
      image: '/images/dish1.jpg',
      categories: [1],
      allergens: []
    },
    {
      id: 2,
      name: 'Plato del día 2',
      price: 15.00,
      image: '/images/dish2.jpg',
      categories: [1],
      allergens: [1]
    }
  ];

  const mockWeekMenu = {
    'Lunes': ['Paella', 'Gazpacho'],
    'Martes': ['Tortilla', 'Ensalada'],
    'Miércoles': ['Cocido', 'Flan']
  };

  const defaultProps = {
    menuOfTheDay: mockMenuOfTheDay,
    weekMenu: mockWeekMenu,
    lang: 'es' as const
  };

  it('should render menu of the day items', () => {
    render(<MenuOfTheDayLazy {...defaultProps} />);

    expect(screen.getByText('Menú Especial')).toBeInTheDocument();
    expect(screen.getByText('Plato del día 1')).toBeInTheDocument();
    expect(screen.getByText('Plato del día 2')).toBeInTheDocument();
    expect(screen.getByText('€12.50')).toBeInTheDocument();
    expect(screen.getByText('€15.00')).toBeInTheDocument();
  });

  it('should render in different languages', () => {
    render(<MenuOfTheDayLazy {...defaultProps} lang="en" />);

    expect(screen.getByText('Special Menu')).toBeInTheDocument();
    expect(screen.getByText('See special menu')).toBeInTheDocument();
  });

  it('should open and close dialog', () => {
    render(<MenuOfTheDayLazy {...defaultProps} />);

    const openButton = screen.getByText('Ver menú especial');
    fireEvent.click(openButton);

    // Dialog should be open and show weekly menu
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Paella, Gazpacho')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    fireEvent.click(closeButton);
  });

  it('should limit menu items to 4', () => {
    const manyDishes = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Dish ${i + 1}`,
      price: 10 + i,
      image: `/dish${i + 1}.jpg`,
      categories: [1],
      allergens: []
    }));

    render(<MenuOfTheDayLazy {...defaultProps} menuOfTheDay={manyDishes} />);

    // Should only render 4 slides
    const slides = screen.getAllByTestId('swiper-slide');
    expect(slides).toHaveLength(4);
  });

  it('should handle empty menu gracefully', () => {
    render(<MenuOfTheDayLazy {...defaultProps} menuOfTheDay={[]} />);

    expect(screen.getByText('Menú Especial')).toBeInTheDocument();
    expect(screen.queryByTestId('swiper-slide')).not.toBeInTheDocument();
  });

  it('should render images with lazy loading', () => {
    render(<MenuOfTheDayLazy {...defaultProps} />);

    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  it('should display weekly menu in dialog', () => {
    render(<MenuOfTheDayLazy {...defaultProps} />);

    const openButton = screen.getByText('Ver menú especial');
    fireEvent.click(openButton);

    // Check that all days are displayed
    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('Martes')).toBeInTheDocument();
    expect(screen.getByText('Miércoles')).toBeInTheDocument();

    // Check that dishes are displayed correctly
    expect(screen.getByText('Paella, Gazpacho')).toBeInTheDocument();
    expect(screen.getByText('Tortilla, Ensalada')).toBeInTheDocument();
    expect(screen.getByText('Cocido, Flan')).toBeInTheDocument();
  });
});