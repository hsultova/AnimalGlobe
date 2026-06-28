import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Animal } from "../types";

type Props = { animal: Animal; onClose: () => void }

export default function AnimalCard({ animal, onClose }: Props) {
    const { t } = useTranslation();
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    function toggleSound() {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false);
        } else {
            audio.currentTime = 0;
            audio.play();
            setIsPlaying(true);
        }
    }

    // press "p" to play/stop the sound without reaching for the mouse
    useEffect(() => {
        if (!animal.soundUrl) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                toggleSound();
            }
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [animal.soundUrl, isPlaying]);

    return (
        <div className="overlay" onClick={onClose}>
            <div className="card" onClick={(e) => e.stopPropagation()}>
                <button className="close" onClick={onClose}>X</button>

                {animal.photoUrl && <img src={animal.photoUrl} alt={animal.commonName} />}
                <h2>{animal.commonName}</h2>
                <p className="fact">{animal.shortFact}</p>
                {animal.placeLabel && <p className="placelabel">{animal.placeLabel}</p>}

                {animal.soundUrl ? (<>
                    <button
                        className={isPlaying ? 'play-button play-button--playing' : 'play-button'}
                        onClick={toggleSound}
                    >
                        {isPlaying ? t('card.stopSound') : t('card.playSound')}
                    </button>
                    <p className="play-hint">{t('card.playHint')}</p>
                    <audio
                        ref={audioRef}
                        src={animal.soundUrl}
                        preload="none"
                        onEnded={() => setIsPlaying(false)}
                    />
                </>) : (<p className="no-sound">{t('card.noSound')}</p>)}

                {animal.photoAttribution && <p className="credit">{t('card.photoCredit', { attribution: animal.photoAttribution })}</p>}
            </div>
        </div>
    );
}
