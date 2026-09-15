import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { searchImport, fetchSound, importAnimal } from '../api/import';
import type {
  AnimalGroup,
  PhotoPreview,
  SearchOptions,
  SoundPreview,
} from '../types';

const GROUPS: AnimalGroup[] = [
  'Mammal',
  'Bird',
  'Reptile',
  'Amphibian',
  'Fish',
  'Insect',
];

const PER_PAGE_CHOICES = [10, 20, 30, 50];

export default function ImportPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    perPage: 20,
    qualityGrade: 'research',
    sort: 'popular',
  });
  const [photos, setPhotos] = useState<PhotoPreview[] | null>(null);
  const [sound, setSound] = useState<SoundPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [soundLoading, setSoundLoading] = useState(false);
  const [importingRef, setImportingRef] = useState<string | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSearch(e: React.InputEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    setLoading(true);
    setPhotos(null);
    setSound(null);
    try {
      const found = await searchImport(name.trim(), options);
      setPhotos(found);

      // Load the optional sound in the background so the photo grid never waits on it.
      const scientificName =
        found.find((p) => p.scientificName)?.scientificName ?? name.trim();
      setSoundLoading(true);
      fetchSound(scientificName)
        .then(setSound)
        .catch(() => setSound(null))
        .finally(() => setSoundLoading(false));
    } catch {
      setError(t('import.searchFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function onPick(photo: PhotoPreview, sound: SoundPreview | null) {
    setError('');
    setImportingRef(photo.sourceRef);
    try {
      const { id } = await importAnimal({
        commonName: photo.commonName,
        scientificName: photo.scientificName,
        group: photo.group,
        latitude: photo.latitude,
        longitude: photo.longitude,
        placeLabel: photo.placeLabel,
        photoUrl: photo.largeUrl,
        photoThumbnailUrl: photo.thumbnailUrl,
        photoAttribution: photo.attribution,
        photoLicenseCode: photo.licenseCode,
        photoSourceRef: photo.sourceRef,
        soundUrl: sound?.url,
        soundAttribution: sound?.attribution,
        soundLicenseCode: sound?.licenseCode,
        soundSourceRef: sound?.sourceRef,
      });
      navigate(`/animals/${id}/edit`);
    } catch {
      setError(t('import.importFailed'));
      setImportingRef(null);
    }
  }

  return (
    <div className="import-scroll">
      <div className="import-page">
        <header className="import-header">
          <h1>{t('import.title')}</h1>
          <button type="button" onClick={() => navigate('/animals')}>
            {t('import.back')}
          </button>
        </header>

        <form className="import-search" onInput={onSearch}>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('import.placeholder')}
            aria-label={t('import.placeholder')}
          />
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? t('import.searching') : t('import.search')}
          </button>
        </form>

        <div className="import-options">
          <label className="import-option">
            {t('import.optResults')}
            <select
              value={options.perPage}
              onChange={(e) =>
                setOptions((o) => ({ ...o, perPage: Number(e.target.value) }))
              }
            >
              {PER_PAGE_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="import-option">
            {t('import.optQuality')}
            <select
              value={options.qualityGrade}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  qualityGrade: e.target.value as SearchOptions['qualityGrade'],
                }))
              }
            >
              <option value="research">{t('import.qualityResearch')}</option>
              <option value="needs_id">{t('import.qualityNeedsId')}</option>
              <option value="casual">{t('import.qualityCasual')}</option>
              <option value="any">{t('import.qualityAny')}</option>
            </select>
          </label>

          <label className="import-option">
            {t('import.optSort')}
            <select
              value={options.sort}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  sort: e.target.value as SearchOptions['sort'],
                }))
              }
            >
              <option value="popular">{t('import.sortPopular')}</option>
              <option value="recent">{t('import.sortRecent')}</option>
            </select>
          </label>

          <label className="import-option">
            {t('import.optGroup')}
            <select
              value={options.group ?? ''}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  group: (e.target.value || undefined) as
                    | AnimalGroup
                    | undefined,
                }))
              }
            >
              <option value="">{t('import.groupAny')}</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {t(`groups.${g}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <p className="import-error" role="alert">
            {error}
          </p>
        )}

        {photos && (
          <>
            {soundLoading ? (
              <p className="import-muted">{t('import.loadingSound')}</p>
            ) : sound ? (
              <div className="import-sound">
                <strong>{t('import.soundLabel')}</strong> — {sound.attribution}
                <audio controls src={sound.url} />
              </div>
            ) : (
              <p className="import-muted">{t('import.noSound')}</p>
            )}

            {photos.length === 0 ? (
              <p className="import-muted">{t('import.noPhotos')}</p>
            ) : (
              <div className="import-grid">
                {photos.map((photo) => (
                  <div className="import-result" key={photo.sourceRef}>
                    <img
                      src={photo.mediumUrl}
                      alt={photo.commonName || photo.scientificName}
                      loading="lazy"
                    />
                    <div className="import-result__body">
                      <div className="import-result__name">
                        {photo.commonName || t('import.noCommonName')}
                      </div>
                      <div className="import-result__latin">
                        {photo.scientificName}
                      </div>
                      <div className="import-result__place">
                        {photo.placeLabel}
                      </div>
                      <div className="import-result__credit">
                        {photo.attribution}
                      </div>
                      <div className="import-result__pick">
                        <button
                          type="button"
                          onClick={() => onPick(photo, sound)}
                          disabled={importingRef !== null}
                        >
                          {importingRef === photo.sourceRef
                            ? t('import.importing')
                            : t('import.importDraft')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
