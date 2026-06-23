import { useEffect, useRef, useState } from "react";
import type { GlobeMethods } from "react-globe.gl";
import type { Animal } from "../types";
import { getAnimals } from "../api/animals";
import Globe from "react-globe.gl";
import AnimalCard from "../components/AnimalCard";

export default function GlobePage() {
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

    return (
        <>
            <Globe
                ref={globeRef}
                width={size.width}
                height={size.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                backgroundColor="#0b1026"
                // --- markers (the "points" layer) ---
                pointsData={animalMarkers}
                pointLat="latitude"
                pointLng="longitude"
                pointColor={() => '#ffcc00'}
                pointAltitude={0.03} pointRadius={0.6}
                pointLabel="commonName"          // hover tooltip
                onPointClick={(p) => setSelectedAnimal(p as Animal)}
                // --- spin gently once it's ready ---
                onGlobeReady={() => {
                    const controls = globeRef.current!.controls()
                    controls.autoRotate = true
                    controls.autoRotateSpeed = 0.6
                }}
            />
            {selectedAnimal && (
                <AnimalCard animal={selectedAnimal} onClose={() => setSelectedAnimal(null)} />
            )}
        </>
    );
}