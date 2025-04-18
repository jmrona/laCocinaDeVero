import React, { forwardRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export const Search = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { onClear: () => void}>(
  ({ className = "", onClear, ...rest }, ref) => {
    return (
      <label htmlFor="search-food" className="relative">
        <span className="sr-only">Search what do you want to eat</span>
        <input
          type="text"
          name="search-food"
          ref={ref}
          {...rest}
          className={twMerge(className, "px-8 group outline-0 peer w-full py-2")}
        />
        <SearchIcon
          size="18"
          className="absolute top-0 left-2 -translateY-1/2 text-gray-500/80 peer-focus:text-black peer-not-placeholder-shown:text-black transition-colors"
        />
        <X
          size="20"
          className="absolute hidden peer-not-placeholder-shown:block top-0 right-2 -translateY-1/2 text-gray-500/80 peer-focus:text-black peer-not-placeholder-shown:text-black transition-colors cursor-pointer"
          onClick={onClear}
        />
        <span className="w-0 block peer-focus:w-full bg-gray-500/80 h-[1px] transition-all duration-300 mx-auto"></span>
      </label>
    );
  }
);
