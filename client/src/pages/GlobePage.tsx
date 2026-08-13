import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import type { Animal } from "../types";
import { getAnimals } from "../api/animals";
import Globe from "react-globe.gl";
import AnimalCard from "../components/AnimalCard";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AnimalSearchBar from "../components/AnimalSearchBar";

type Direction = 'up' | 'down' | 'left' | 'right';

// wrap a longitude difference into [-180, 180] so the date line isn't a wall
function normalizeLngDelta(delta: number) {
    return ((delta % 360) + 540) % 360 - 180;
}

// find the geographically nearest animal in a given compass direction.
// up/down move along latitude, left/right along longitude. The chosen
// candidate must actually lie in that direction; among those we pick the
// closest, lightly penalizing sideways drift so we stay on a sensible line.
function findNeighborInDirection(
    animals: Animal[],
    fromIndex: number,
    direction: Direction
): number {
    if (animals.length === 0) return fromIndex;
    // nothing focused yet: first key press just lands on the first animal
    if (fromIndex < 0) return 0;

    const from = animals[fromIndex];
    let best = -1;
    let bestScore = Infinity;

    animals.forEach((candidate, index) => {
        if (index === fromIndex) return;

        const dLat = candidate.latitude - from.latitude;                 // + = north
        const dLng = normalizeLngDelta(candidate.longitude - from.longitude); // + = east

        let primary: number;
        let perpendicular: number;
        switch (direction) {
            case 'up': primary = dLat; perpendicular = dLng; break;
            case 'down': primary = -dLat; perpendicular = dLng; break;
            case 'right': primary = dLng; perpendicular = dLat; break;
            case 'left': primary = -dLng; perpendicular = dLat; break;
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

export default function GlobePage() {
    const { t } = useTranslation();
    const globeRef = useRef<GlobeMethods | undefined>(undefined);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // keep a handle on each marker element so we can highlight the focused one
    const markerElsRef = useRef<Map<number, HTMLDivElement>>(new Map());

    //load animals from API
    useEffect(() => {
        getAnimals().then(setAnimals).catch(console.error)
    }, [])

    //keep the globe filling the window
    useEffect(() => {
        const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [])

    // place only animals with coordinates on the globe
    const animalMarkers = useMemo(
        () => animals.filter((a) => a.latitude != null && a.longitude != null),
        [animals]
    )

    const [searchQuery, setSearchQuery] = useState("");
    const filteredAnimalMarkers = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        if (normalizedQuery === "") 
            return animalMarkers;

        return animalMarkers.filter((a) =>
            a.commonName.toLowerCase().includes(normalizedQuery) ||
            a.scientificName.toLowerCase().includes(normalizedQuery)
        );
    }, [animalMarkers, searchQuery]);

    // the marker click handler lives inside a stable htmlElement callback (see below),
    // so it reads the current markers from a ref instead of a stale closure
    const filteredAnimalMarkersRef = useRef(filteredAnimalMarkers);
    useEffect(() => { filteredAnimalMarkersRef.current = filteredAnimalMarkers; }, [filteredAnimalMarkers]);

    const navigate = useNavigate();

    // open an animal's card and keep keyboard focus in sync with it,
    // so the focused (cyan) and selected (gold) marker are always the same animal
    const openAnimal = useCallback((animal: Animal) => {
        const index = filteredAnimalMarkersRef.current.findIndex((a) => a.id === animal.id);
        if (index >= 0) setFocusedIndex(index);
        setSelectedAnimal(animal);
    }, []);

    // keyboard controls for kids: arrows to move, Enter to open, Esc to close
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

            if (filteredAnimalMarkers.length === 0) return;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    setFocusedIndex((i) => findNeighborInDirection(filteredAnimalMarkers, i, 'right'));
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    setFocusedIndex((i) => findNeighborInDirection(filteredAnimalMarkers, i, 'left'));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setFocusedIndex((i) => findNeighborInDirection(filteredAnimalMarkers, i, 'up'));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    setFocusedIndex((i) => findNeighborInDirection(filteredAnimalMarkers, i, 'down'));
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (focusedIndex >= 0) {
                        setSelectedAnimal(filteredAnimalMarkers[focusedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setFocusedIndex(-1);
                    break;
            }
        }

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedAnimal, filteredAnimalMarkers, focusedIndex])

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
                800
            );
        } else {
            controls.autoRotate = true;
        }
    }, [focusedIndex, filteredAnimalMarkers])

    // highlight the focused marker plus the ones each arrow will jump to
    useEffect(() => {
        const focusedId = filteredAnimalMarkers[focusedIndex]?.id;
        const adjacentIds = new Set<number>();
        if (focusedIndex >= 0) {
            for (const direction of ['up', 'down', 'left', 'right'] as const) {
                const index = findNeighborInDirection(filteredAnimalMarkers, focusedIndex, direction);
                if (index !== focusedIndex) adjacentIds.add(filteredAnimalMarkers[index].id);
            }
        }
        markerElsRef.current.forEach((el, id) => {
            el.classList.toggle('globe-photo-marker--focused', id === focusedId);
            el.classList.toggle(
                'globe-photo-marker--adjacent',
                id !== focusedId && adjacentIds.has(id)
            );
        });
    }, [focusedIndex, filteredAnimalMarkers])

    // highlight the marker whose card is currently open
    useEffect(() => {
        const selectedId = selectedAnimal?.id;
        markerElsRef.current.forEach((el, id) => {
            el.classList.toggle('globe-photo-marker--selected', id === selectedId);
        });
    }, [selectedAnimal, filteredAnimalMarkers])

    // build a marker element. Kept stable (useCallback) on purpose: three-globe
    // tears down and rebuilds every marker whenever the htmlElement prop changes
    // identity, which would orphan the refs our highlight effects mutate and make
    // the focus/select rings and name label never show.
    const renderMarker = useCallback((d: object) => {
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
    }, [openAnimal]);

    const handleSearch = useCallback((query: string) => {
        const trimmedQuery = query.trim();
        setSearchQuery(trimmedQuery);
        setSelectedAnimal(null);

        if (trimmedQuery === "") {
            setFocusedIndex(-1);
            return;
        }

        const matches = animalMarkers.filter((a) =>
            a.commonName.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
            a.scientificName.toLowerCase().includes(trimmedQuery.toLowerCase())
        );

        setFocusedIndex(matches.length > 0 ? 0 : -1);
    }, [animalMarkers]);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AnimalSearchBar onSearch={handleSearch} />
            </div>
            <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 1, display: 'flex', gap: 8 }}>
                <button onClick={() => navigate('/animals')}>{t('globe.animals')}</button>
                <LanguageSwitcher />
            </div>
            <Globe
                ref={globeRef}
                width={size.width}
                height={size.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                backgroundColor="#0b1026"
                // --- spin gently once it's ready ---
                onGlobeReady={() => {
                    const controls = globeRef.current!.controls()
                    controls.autoRotate = true
                    controls.autoRotateSpeed = 0.6
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
                <AnimalCard animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
            )}
        </>
    );
}
