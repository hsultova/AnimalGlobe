import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import type { Animal } from "../types";
import { getAnimals } from "../api/animals";
import Globe from "react-globe.gl";
import AnimalCard from "../components/AnimalCard";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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

    //place only animals on with coordinates
    const animalMarkers = useMemo(
        () => animals.filter((a) => a.latitude != null && a.longitude != null),
        [animals]
    )

    // the marker click handler lives inside a stable htmlElement callback (see below),
    // so it reads the current markers from a ref instead of a stale closure
    const animalMarkersRef = useRef(animalMarkers);
    useEffect(() => { animalMarkersRef.current = animalMarkers; }, [animalMarkers]);

    const navigate = useNavigate();

    // open an animal's card and keep keyboard focus in sync with it,
    // so the focused (cyan) and selected (gold) marker are always the same animal
    const openAnimal = useCallback((animal: Animal) => {
        const index = animalMarkersRef.current.findIndex((a) => a.id === animal.id);
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

            if (animalMarkers.length === 0) return;

            switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    setFocusedIndex((i) => (i + 1) % animalMarkers.length);
                    break;
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    setFocusedIndex((i) => (i <= 0 ? animalMarkers.length - 1 : i - 1));
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (focusedIndex >= 0) {
                        setSelectedAnimal(animalMarkers[focusedIndex]);
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
    }, [selectedAnimal, animalMarkers, focusedIndex])

    // spin the globe towards the focused animal and pause auto-rotation
    useEffect(() => {
        const globe = globeRef.current;
        if (!globe) return;

        const controls = globe.controls();
        const target = animalMarkers[focusedIndex];
        if (target) {
            controls.autoRotate = false;
            globe.pointOfView(
                { lat: target.latitude, lng: target.longitude, altitude: 1.6 },
                800
            );
        } else {
            controls.autoRotate = true;
        }
    }, [focusedIndex, animalMarkers])

    // highlight the focused marker plus the ones the arrows will jump to next/prev
    useEffect(() => {
        const count = animalMarkers.length;
        const focusedId = animalMarkers[focusedIndex]?.id;
        const nextId = focusedIndex >= 0 && count > 1
            ? animalMarkers[(focusedIndex + 1) % count]?.id
            : undefined;
        const prevId = focusedIndex >= 0 && count > 1
            ? animalMarkers[(focusedIndex - 1 + count) % count]?.id
            : undefined;
        markerElsRef.current.forEach((el, id) => {
            el.classList.toggle('globe-photo-marker--focused', id === focusedId);
            el.classList.toggle(
                'globe-photo-marker--adjacent',
                id !== focusedId && (id === nextId || id === prevId)
            );
        });
    }, [focusedIndex, animalMarkers])

    // highlight the marker whose card is currently open
    useEffect(() => {
        const selectedId = selectedAnimal?.id;
        markerElsRef.current.forEach((el, id) => {
            el.classList.toggle('globe-photo-marker--selected', id === selectedId);
        });
    }, [selectedAnimal, animalMarkers])

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

    return (
        <>
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
                htmlElementsData={animalMarkers}
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
