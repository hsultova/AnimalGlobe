import { useEffect, useRef, useState } from "react";
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
    const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

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
    const animalMarkers = animals.filter((a) => a.latitude != null && a.longitude != null)

    const navigate = useNavigate();

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
                htmlElement={(d) => {
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
                    el.onclick = () => setSelectedAnimal(animal);
                    return el;
                }}
            />
            {selectedAnimal && (
                <AnimalCard animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
            )}
        </>
    );
}