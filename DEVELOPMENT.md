# Developer Guide

Everything you need to build, run, test, and deploy AnimalGlobe. For a product
overview and end-user instructions, see the [README](README.md).

## Contents

- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [How the pieces fit together](#how-the-pieces-fit-together)
- [Database & migrations](#database--migrations)
- [API reference](#api-reference)
- [Testing](#testing)
- [Building for production](#building-for-production)
- [Deployment](#deployment)

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 10.0+ | Backend + EF Core |
| [Node.js](https://nodejs.org/) | 20+ | Frontend build (Vite) |
| PostgreSQL | 14+ | Local database (or a hosted one, e.g. [Neon](https://neon.tech)) |
| Docker | optional | For running Postgres locally and building the deploy image |

Optional but handy: the EF Core CLI tools —

```bash
dotnet tool install --global dotnet-ef
```

## Local development

The frontend and backend run as two processes in development. The Vite dev server
proxies `/api/*` to the backend, so the SPA and API behave as if same-origin.

### 1. Database

Any reachable Postgres works. A throwaway local one:

```bash
docker run --name animalglobe-db -e POSTGRES_USER=devuser \
  -e POSTGRES_PASSWORD=devpas -e POSTGRES_DB=animalglobe \
  -p 5432:5432 -d postgres
```

The matching connection string is already in `server/appsettings.json`. To use a
different database without editing tracked files, override it with a user secret:

```bash
cd server
dotnet user-secrets set "ConnectionStrings:Postgres" "Host=...;Database=...;Username=...;Password=..."
```

### 2. Backend

```bash
cd server
dotnet run
```

On startup the app **applies any pending EF Core migrations** and **creates the
default admin user** if it doesn't exist (see [Security notes](#security-notes)).
It binds `http://localhost:8080` by default (override with the `PORT` env var).

- Swagger UI: <http://localhost:8080/swagger>
- OpenAPI doc: <http://localhost:8080/openapi/v1.json>

> Swagger and the OpenAPI endpoint are only mapped in the Development environment.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Vite serves the SPA (default <http://localhost:5173>) and proxies `/api` requests
to `http://127.0.0.1:8080` (configured in `client/vite.config.ts`). Edit React
code and it hot-reloads.

Useful client scripts:

| Command | Does |
|---------|------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and build into `../server/wwwroot` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## How the pieces fit together

- **Single origin in production.** `vite.config.ts` builds the SPA straight into
  `server/wwwroot`. `Program.cs` serves those static files and uses
  `MapFallbackToFile("index.html")` so client-side routes (React Router) resolve.
  There is no CORS setup because nothing is cross-origin.
- **Auth is cookie-based.** `UserController` signs the user in with ASP.NET Core
  Identity and issues an `AnimalGlobe.AuthCookie` (HttpOnly, 8h sliding). The SPA
  sends it with `credentials: 'include'`. Protected API calls return `401`/`403`
  (not a redirect) so the SPA can react. `ProtectedRoute` on the client checks
  `GET /api/user/me` to gate admin pages.
- **External enrichment.** `INaturalistClient` and `XenoCantoClient` are typed
  `HttpClient`s with resilience (retry/timeout/circuit-breaker) and automatic
  gzip/brotli decompression. Import previews are cached in-memory for 10 minutes
  so repeated searches don't re-hit the upstream APIs.

## Database & migrations

The schema is managed by EF Core migrations in `server/Migrations/`. Migrations
are applied automatically at startup (`db.Database.MigrateAsync()` in
`Program.cs`), so on a fresh database you don't need to run anything by hand.

To apply them manually:

```bash
cd server
dotnet ef database update
```

After changing an entity model, add a migration:

```bash
cd server
dotnet ef migrations add <DescriptiveName>
```

### Seed data

`server/Data/DbSeeder.cs` contains a small set of sample animals (Lion, Emperor
Penguin, Red Kangaroo, Galápagos Giant Tortoise, and an unpublished Giant Panda).
Call `DbSeeder.Seed(db)` from a startup scope if you want the sample content in an
empty database; it's a no-op once any animals exist.

## API reference

All endpoints are under `/api`. Endpoints without `[AllowAnonymous]` require the
auth cookie. Explore them interactively via Swagger (see above).

### Auth — `/api/user`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | public | Body `{ email, password }`; sets the auth cookie |
| POST | `/logout` | required | Clears the cookie |
| GET  | `/me` | required | Returns `{ email }`; used by the SPA to check login state |

### Animals — `/api/animals`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | public | **Published** animals only (powers the globe) |
| GET | `/all` | required | All animals, including drafts (admin table) |
| GET | `/{id}` | required | Single animal |
| POST | `/` | required | Create as an unpublished draft |
| PUT | `/{id}` | required | Update name, group, fact, location, and media |
| POST | `/{id}/publish` | required | Toggle published status |
| DELETE | `/{id}` | required | Delete an animal |

### Import — `/api/import`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?name=&perPage=&qualityGrade=&sort=&group=` | required | Photo candidates from iNaturalist |
| GET | `/sound?scientificName=` | required | Top recording from Xeno-canto (optional) |
| POST | `/` | required | Persist a chosen preview as an unpublished draft |

## Testing

> **Status:** the repository does not yet contain an automated test suite. The
> checks below are the current verification path

### What to run before committing

```bash
# Frontend: type-check, build, and lint
cd client
npm run build
npm run lint

# Backend: compile
cd ../server
dotnet build
```

### Manual verification

- **API:** use Swagger (`/swagger` in Development) or the `server/Api.http` file
  to exercise endpoints. Confirm public `GET /api/animals` returns only published
  animals and that admin endpoints reject unauthenticated requests with `401`.
- **App flow:** log in, create/import an animal, verify it's hidden until
  published, then confirm it appears on the globe with photo, fact, and sound.
- **Globe navigation:** check arrow-key movement, `Enter`/`Esc`, and the `P`
  play/stop shortcut on the card.

### Adding a test suite

Suggested starting points if you introduce tests:

- **Backend:** an xUnit project using `WebApplicationFactory` for integration
  tests against the controllers, with EF Core pointed at a test database.
- **Frontend:** Vitest + React Testing Library for components, and Playwright for
  end-to-end globe/admin flows.

## Building for production

The whole app builds into a single container via the multi-stage
[`dockerfile`](dockerfile):

1. Build the React SPA (`node:20`) → outputs into `server/wwwroot`.
2. `dotnet publish` the API (`dotnet/sdk:10.0`) with the SPA already in `wwwroot`.
3. Copy the published output into a slim `dotnet/aspnet:10.0` runtime image.

```bash
docker build -t animalglobe .
docker run -p 8080:8080 \
  -e ConnectionStrings__Postgres="Host=...;Database=...;Username=...;Password=..." \
  animalglobe
```

The container serves both the SPA and the API on the port given by `PORT`
(default `8080`).

## Deployment

The app is designed to run as one container on [Render](https://render.com) with a
[Neon](https://neon.tech) serverless Postgres database.

1. **Database:** create a Neon Postgres database and copy its connection string.
2. **Service:** create a Render Web Service from this repo using the `dockerfile`.
3. **Environment variables** on the service:
   - `ConnectionStrings__Postgres` → the Neon connection string
   - `PORT` → provided by Render; the app already reads it
4. Render terminates TLS at its proxy and forwards plain HTTP to the container.
   The app binds a single HTTP port and honours `X-Forwarded-*` headers
   (`UseForwardedHeaders` in `Program.cs`), so there's intentionally no in-app
   HTTPS redirect.
5. On deploy, startup **auto-applies migrations**, so a fresh Neon database gets
   its schema created on the first boot.
