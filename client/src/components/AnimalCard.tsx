import { useRef } from "react";
import type { Animal } from "../types";

type Props = { animal: Animal; onClose: () => void }

export default function AnimalCard({ animal, onClose }: Props) {
    const audioRef = useRef<HTMLAudioElement>(null);

    function playSound() {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        audio.currentTime = 0;
        audio.play();
    }

    return (
        <div className="overlay" onClick={onClose}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>X</button>

                {animal.photoUrl && <img src={animal.photoUrl} alt={animal.commonName} />}
                <h2>{animal.commonName}</h2>
                <p className="fact">{animal.shortFact}</p>
                {animal.placeLabel && <p className="placelabel">{animal.placeLabel}</p>}

                {animal.soundUrl ? (<>
                    <button className="play-button" onClick={playSound}>
                        ▶ Play Sound
                    </button>
                    <audio ref={audioRef} src={animal.soundUrl} preload="none" />
                </>) : (<p className="no-sound">No sound available</p>)}

                {animal.photoAttribution && <p className="credit">Photo: {animal.photoAttribution}</p>}
            </div>
        </div>
    );
}