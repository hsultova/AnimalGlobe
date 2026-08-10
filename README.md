# 🌍 AnimalGlobe
![Server CI](https://github.com/{owner}/{repo}/actions/workflows/backend.yml/badge.svg)
![Client CI](https://github.com/{owner}/{repo}/actions/workflows/frontend.yml/badge.svg)

<img align="right" width="220" height="200" alt="image" src="https://github.com/user-attachments/assets/a44d66fc-90db-4bcb-aa7d-1b0f681fc9b7" />
A playful web app for children: a rotatable 3D Earth with animals placed at their
real living locations. Kids explore the globe, jump between animals with the arrow
keys, and open a card to see a photo, a fun fact, and hear the animal's sound.

An admin builds the collection behind a login — either by hand or by importing
photos from [iNaturalist](https://www.inaturalist.org/) and sounds from
[Xeno-canto](https://xeno-canto.org/) with a couple of clicks.

<br clear="left"/>

---

## Features

- **Interactive 3D globe** — a gently auto-rotating Earth (`react-globe.gl` /
  three.js) with a photo marker for every published animal.
- **Kid-friendly navigation** — arrow keys hop to the nearest animal in that
  compass direction; `Enter`/`Space` opens its card; `Esc` closes it. Everything
  works with the mouse too.
- **Animal cards** — photo, fun fact, place label, and a playable sound clip
  (press `P` to play/stop) with proper source attribution.
- **Bilingual UI** — English and Bulgarian, switchable at runtime (`i18next`).
  Your choice is remembered.
- **Admin console** — a login-protected area to create, edit, publish/unpublish,
  and delete animals.
- **One-click import** — search a species, pick a photo from iNaturalist, optionally
  attach a sound from Xeno-canto, and save it as a draft.
- **Publish gate** — the public globe only ever shows animals marked *Published*,
  so drafts stay hidden until they're ready.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, TypeScript, Vite, React Router, react-globe.gl (three.js), i18next |
| Backend   | ASP.NET Core (.NET 10) Web API, controllers, OpenAPI/Swagger |
| Data      | Entity Framework Core with PostgreSQL (Npgsql) |
| Auth      | ASP.NET Core Identity with cookie authentication |
| External  | iNaturalist API (photos), Xeno-canto API (sounds) |
| Deployment| Single Docker image (SPA served from the API's `wwwroot`), hosted on Render with a Neon serverless Postgres database |

The React SPA is built into the API's `wwwroot` folder and served from the same
origin as the API, so there is no CORS configuration and no separate frontend host.

## Architecture at a glance

```
Browser ──► ASP.NET Core API (same origin)
              ├─ /            → React SPA (static files from wwwroot)
              ├─ /api/animals → public + admin animal CRUD
              ├─ /api/user    → login / logout / me (cookie auth)
              └─ /api/import   → iNaturalist + Xeno-canto search & import
                                     │
                                     ▼
                              PostgreSQL (EF Core)
```

Data model: an **Animal** has one or more **AnimalLocation**s (lat/long + place
label) and **MediaAsset**s (a photo and/or a sound, each with attribution and
license). Animals are grouped as Mammal, Bird, Reptile, Amphibian, Fish, Insect,
or Other.

## Project structure

```
AnimalGlobe/
├─ client/               React + TypeScript SPA (Vite)
│  ├─ src/
│  │  ├─ api/            fetch wrappers for the backend
│  │  ├─ components/     AnimalCard, LanguageSwitcher, ProtectedRoute
│  │  ├─ pages/          Globe, Login, Animal list, Animal form, Import
│  │  └─ i18n/           i18next setup + en/bg locale files
│  └─ vite.config.ts     builds into ../server/wwwroot; proxies /api in dev
├─ server/               ASP.NET Core Web API
│  ├─ Controllers/       Animals, Import, User
│  ├─ Models/            Animal, AnimalLocation, MediaAsset, enums
│  ├─ Data/              AppDbContext, DbSeeder
│  ├─ Services/          INaturalist + XenoCanto API clients
│  ├─ Migrations/        EF Core migrations
│  └─ Program.cs         app startup, DI, auth, pipeline
├─ dockerfile            multi-stage build (SPA → API → runtime image)
└─ DEVELOPMENT.md        build, test, and deployment guide
```

## Configuration

Backend settings live in `server/appsettings.json` (and are overridable by
environment variables / user secrets):

| Setting | Purpose |
|---------|---------|
| `ConnectionStrings:Postgres` | PostgreSQL connection string |
| `INaturalist:BaseUrl` | iNaturalist API base URL |
| `XenoCanto:BaseUrl` | Xeno-canto API base URL |
| `PORT` (env var) | HTTP port the API binds to (default `8080`) |

## Documentation

- **[Developer Guide](DEVELOPMENT.md)** — local setup, building, testing, database
  migrations, and deployment.

## Deployed application

[AnimalGlobe link](https://animalglobe.onrender.com/)

<img width="1700" height="909" alt="image" src="https://github.com/user-attachments/assets/2bc0e9f7-9f64-498f-8cdf-a178eb2313a4" />

<img width="730" height="745" alt="image" src="https://github.com/user-attachments/assets/1c971611-8050-41f6-8d4d-b5f28abba527" />


## License

See [LICENSE](LICENSE).
