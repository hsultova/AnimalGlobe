import type { Animal, AnimalGroup } from '../types';

export type Direction = 'up' | 'down' | 'left' | 'right';

// wrap a longitude difference into [-180, 180] so the date line isn't a wall
function normalizeLngDelta(delta: number) {
  return (((delta % 360) + 540) % 360) - 180;
}

// find the geographically nearest animal in a given compass direction.
// up/down move along latitude, left/right along longitude. The chosen
// candidate must actually lie in that direction; among those we pick the
// closest, lightly penalizing sideways drift so we stay on a sensible line.
export function findNeighborInDirection(
  animals: Animal[],
  fromIndex: number,
  direction: Direction,
): number {
  if (animals.length === 0) return fromIndex;
  // nothing focused yet: first key press just lands on the first animal
  if (fromIndex < 0) return 0;

  const from = animals[fromIndex];
  let best = -1;
  let bestScore = Infinity;

  animals.forEach((candidate, index) => {
    if (index === fromIndex) return;

    const dLat = candidate.latitude - from.latitude; // + = north
    const dLng = normalizeLngDelta(candidate.longitude - from.longitude); // + = east

    let primary: number;
    let perpendicular: number;
    switch (direction) {
      case 'up':
        primary = dLat;
        perpendicular = dLng;
        break;
      case 'down':
        primary = -dLat;
        perpendicular = dLng;
        break;
      case 'right':
        primary = dLng;
        perpendicular = dLat;
        break;
      case 'left':
        primary = -dLng;
        perpendicular = dLat;
        break;
    }

    if (primary <= 0) return; // candidate isn't in this direction

    // forward distance plus a penalty for how far off-axis it sits
    const score = primary + Math.abs(perpendicular) * 2;
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });

  // if there's no animal that way, stay put
  return best >= 0 ? best : fromIndex;
}

export function filterAnimals(
  animals: Animal[],
  query: string,
  group: AnimalGroup | null,
): Animal[] {
  const trimmedQuery = query.trim().toLowerCase();
  return animals.filter((a) => {
    if (group && a.group !== group) return false;
    if (trimmedQuery === '') return true;
    return (
      a.commonName.toLowerCase().includes(trimmedQuery) ||
      a.scientificName.toLowerCase().includes(trimmedQuery)
    );
  });
}
