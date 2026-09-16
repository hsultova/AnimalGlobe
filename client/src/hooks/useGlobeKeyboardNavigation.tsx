import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Animal } from '../types';
import { findNeighborInDirection, type Direction } from '../utils/globe';

interface UseGlobeKeyboardNavigationOptions {
  animals: Animal[];
  focusedIndex: number;
  setFocusedIndex: Dispatch<SetStateAction<number>>;
  selectedAnimal: Animal | null;
  setSelectedAnimal: Dispatch<SetStateAction<Animal | null>>;
}

const ARROW_DIRECTIONS: Partial<Record<string, Direction>> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

// Keyboard controls for the globe:
// arrows move between animals, Enter/Space opens one, Esc closes or unfocuses
export function useGlobeKeyboardNavigation({
  animals,
  focusedIndex,
  setFocusedIndex,
  selectedAnimal,
  setSelectedAnimal,
}: UseGlobeKeyboardNavigationOptions) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // when a card is open, the only key we care about is Esc to close it
      if (selectedAnimal) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setSelectedAnimal(null);
        }
        return;
      }

      if (animals.length === 0) return;

      const direction = ARROW_DIRECTIONS[e.key];
      if (direction) {
        e.preventDefault();
        setFocusedIndex((i) => findNeighborInDirection(animals, i, direction));
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        const focused = animals[focusedIndex];
        if (focused) {
          e.preventDefault();
          setSelectedAnimal(focused);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setFocusedIndex(-1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    animals,
    focusedIndex,
    selectedAnimal,
    setFocusedIndex,
    setSelectedAnimal,
  ]);
}
