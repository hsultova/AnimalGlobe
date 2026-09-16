import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllAnimals, togglePublish, deleteAnimal } from '../api/animals';
import { logout } from '../api/auth';
import {
  GROUP_LABEL_KEYS,
  GROUPS,
  type Animal,
  type AnimalGroup,
} from '../types';
import LanguageSwitcher from '../components/LanguageSwitcher';
import SearchBar from '../components/SearchBar';
import { filterAnimals } from '../utils/globe';

export default function AnimalPage() {
  const { t } = useTranslation();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<AnimalGroup | null>(null);
  const groupFilters = GROUPS.map((g) => ({
    value: g,
    label: t(GROUP_LABEL_KEYS[g]),
  }));

  const filteredAnimals = useMemo(
    () => filterAnimals(animals, query, group),
    [animals, query, group],
  );

  const handleGroupChange = (nextGroup: AnimalGroup | null) => {
    setGroup(nextGroup);
    if (nextGroup) {
      setQuery('');
    }
  };

  async function load() {
    setAnimals(await getAllAnimals());
  }
  useEffect(() => {
    load();
  }, []);

  async function onToggle(id: number) {
    await togglePublish(id);
    await load();
  }
  async function onDelete(id: number) {
    if (!confirm(t('animals.confirmDelete'))) return;
    await deleteAnimal(id);
    await load();
  }
  async function onLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="top-bar">
      <header className="top-bar-row">
        <h1>{t('animals.title')}</h1>
        <div>
          <LanguageSwitcher />
          <Link to="/animals/new">
            <button>{t('animals.new')}</button>
          </Link>
          <Link to="/animals/import">
            <button>{t('animals.import')}</button>
          </Link>
          <button onClick={onLogout}>{t('animals.logout')}</button>
        </div>
      </header>
      <div
        className="top-bar-row"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <SearchBar
          onSearch={setQuery}
          filters={groupFilters}
          selectedFilter={group}
          onFilterChange={handleGroupChange}
          clearQueryOnFilter
          filterLabel={t('search.filterByGroup')}
        />
      </div>

      <table width="100%" cellPadding={6}>
        <thead>
          <tr>
            <th align="left">{t('animals.colName')}</th>
            <th>{t('animals.colGroup')}</th>
            <th align="left">{t('animals.colPlace')}</th>
            <th>{t('animals.colPublished')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredAnimals.map((a) => (
            <tr key={a.id}>
              <td>{a.commonName}</td>
              <td align="center">{t(`groups.${a.group}`)}</td>
              <td>{a.placeLabel}</td>
              <td align="center">{a.isPublished ? '✅' : '—'}</td>
              <td align="right">
                <Link to={`/animals/${a.id}/edit`}>
                  <button>{t('animals.edit')}</button>
                </Link>{' '}
                <button onClick={() => onToggle(a.id)}>
                  {a.isPublished
                    ? t('animals.unpublish')
                    : t('animals.publish')}
                </button>{' '}
                <button onClick={() => onDelete(a.id)}>
                  {t('animals.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
