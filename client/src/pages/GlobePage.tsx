import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { GlobeMethods } from 'react-globe.gl';
import {
  GROUP_LABEL_KEYS,
  GROUPS,
  type Animal,
  type AnimalGroup,
} from '../types';
import Globe from 'react-globe.gl';
import AnimalCard from '../components/AnimalCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SearchBar from '../components/SearchBar';
import { getAnimals } from '../api/animals';
import { filterAnimals, findNeighborInDirection } from '../utils/globe';
import { useGlobeKeyboardNavigation } from '../hooks/useGlobeKeyboardNavigation';

export default function GlobePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<AnimalGroup | null>(null);
  const groupFilters = GROUPS.map((g) => ({
    value: g,
    label: t(GROUP_LABEL_KEYS[g]),
  }));

  // keep a handle on each marker element so we can highlight the focused one
  const markerElsRef = useRef<Map<number, HTMLDivElement>>(new Map());

  //load animals from API
  useEffect(() => {
    getAnimals().then(setAnimals).catch(console.error);
  }, []);

  //keep the globe filling the window
  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // place only animals with coordinates on the globe
  const animalMarkers = useMemo(
    () => animals.filter((a) => a.latitude != null && a.longitude != null),
    [animals],
  );

  const filteredAnimalMarkers = useMemo(
    () => filterAnimals(animalMarkers, query, group),
    [animalMarkers, query, group],
  );

  // One place that updates the filters and resets focus and the card.
  // It uses the NEW values it receives, so it's never one click behind.
  const applyFilters = (nextQuery: string, nextGroup: AnimalGroup | null) => {
    setQuery(nextQuery);
    setGroup(nextGroup);
    setSelectedAnimal(null);

    const isFiltering = nextQuery.trim() !== '' || nextGroup !== null;
    const matches = filterAnimals(animalMarkers, nextQuery, nextGroup);
    setFocusedIndex(isFiltering && matches.length > 0 ? 0 : -1);
  };

  const handleSearch = (nextQuery: string) => applyFilters(nextQuery, group);

  // Selecting a chip clears the text (same as clearQueryOnFilter in the SearchBar)
  const handleGroupChange = (nextGroup: AnimalGroup | null) =>
    applyFilters(nextGroup ? '' : query, nextGroup);

  // the marker click handler lives inside a stable htmlElement callback (see below),
  // so it reads the current markers from a ref instead of a stale closure
  const filteredAnimalMarkersRef = useRef(filteredAnimalMarkers);
  useEffect(() => {
    filteredAnimalMarkersRef.current = filteredAnimalMarkers;
  }, [filteredAnimalMarkers]);

  // open an animal's card and keep keyboard focus in sync with it,
  // so the focused (cyan) and selected (gold) marker are always the same animal
  const openAnimal = useCallback((animal: Animal) => {
    const index = filteredAnimalMarkersRef.current.findIndex(
      (a) => a.id === animal.id,
    );
    if (index >= 0) setFocusedIndex(index);
    setSelectedAnimal(animal);
  }, []);

  useGlobeKeyboardNavigation({
    animals: filteredAnimalMarkers,
    focusedIndex,
    setFocusedIndex,
    selectedAnimal,
    setSelectedAnimal,
  });

  // spin the globe towards the focused animal and pause auto-rotation
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    const target = filteredAnimalMarkers[focusedIndex];
    if (target) {
      controls.autoRotate = false;
      globe.pointOfView(
        { lat: target.latitude, lng: target.longitude, altitude: 1.6 },
        800,
      );
    } else {
      controls.autoRotate = true;
    }
  }, [focusedIndex, filteredAnimalMarkers]);

  // highlight the focused marker plus the ones each arrow will jump to
  useEffect(() => {
    const focusedId = filteredAnimalMarkers[focusedIndex]?.id;
    const adjacentIds = new Set<number>();
    if (focusedIndex >= 0) {
      for (const direction of ['up', 'down', 'left', 'right'] as const) {
        const index = findNeighborInDirection(
          filteredAnimalMarkers,
          focusedIndex,
          direction,
        );
        if (index !== focusedIndex)
          adjacentIds.add(filteredAnimalMarkers[index].id);
      }
    }
    markerElsRef.current.forEach((el, id) => {
      el.classList.toggle('globe-photo-marker--focused', id === focusedId);
      el.classList.toggle(
        'globe-photo-marker--adjacent',
        id !== focusedId && adjacentIds.has(id),
      );
    });
  }, [focusedIndex, filteredAnimalMarkers]);

  // highlight the marker whose card is currently open
  useEffect(() => {
    const selectedId = selectedAnimal?.id;
    markerElsRef.current.forEach((el, id) => {
      el.classList.toggle('globe-photo-marker--selected', id === selectedId);
    });
  }, [selectedAnimal, filteredAnimalMarkers]);

  // build a marker element. Kept stable (useCallback) on purpose: three-globe
  // tears down and rebuilds every marker whenever the htmlElement prop changes
  // identity, which would orphan the refs our highlight effects mutate and make
  // the focus/select rings and name label never show.
  const renderMarker = useCallback(
    (d: object) => {
      const animal = d as Animal;
      const el = document.createElement('div');
      el.className = 'globe-photo-marker';
      el.title = animal.commonName;
      if (animal.photoUrl) {
        const img = document.createElement('img');
        img.src = animal.photoUrl;
        img.alt = animal.commonName;
        el.appendChild(img);
      } else {
        // fallback for animals without a photo
        el.classList.add('globe-photo-marker--empty');
      }
      // name label that shows up when this marker is focused
      const label = document.createElement('span');
      label.className = 'globe-photo-marker__label';
      label.textContent = animal.commonName;
      el.appendChild(label);
      el.onclick = () => openAnimal(animal);
      markerElsRef.current.set(animal.id, el);
      return el;
    },
    [openAnimal],
  );
  return (
    <>
      <div className="top-bar">
        <div
          className="top-bar-row"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <SearchBar
            onSearch={handleSearch}
            filters={groupFilters}
            selectedFilter={group}
            onFilterChange={handleGroupChange}
            clearQueryOnFilter={true}
            filterLabel={t('search.filterByGroup')}
          />
        </div>
        <div
          className="top-bar-row"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            display: 'flex',
            gap: 8,
          }}
        >
          <button onClick={() => navigate('/animals')}>
            {t('globe.animals')}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="#0b1026"
        // --- spin gently once it's ready ---
        onGlobeReady={() => {
          const controls = globeRef.current!.controls();
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
        }}
        // --- markers (small animal photos) ---
        htmlElementsData={filteredAnimalMarkers}
        htmlLat="latitude"
        htmlLng="longitude"
        htmlAltitude={0.02}
        htmlElement={renderMarker}
      />
      <p className="globe-hint">{t('globe.hint')}</p>
      {selectedAnimal && (
        <AnimalCard
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
        />
      )}
    </>
  );
}
