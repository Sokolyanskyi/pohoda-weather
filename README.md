# Pohoda

**Weather, clearly.** A calm weather app with today's conditions, hourly detail, a 7-day outlook and a 30-day view. Animated skies follow the real weather, and you can pick the provider, the colours and the icon style.

Live demo: https://pohoda-weather.vercel.app

![Pohoda — today view](docs/desktop-today.png)

## Why another weather app

- **Readable at a glance.** A large temperature, a short condition line, and the three numbers people actually check: rain chance, wind, humidity.
- **Ranges, not just numbers.** Every day row shows a temperature band placed on the week's scale, so a cold snap or a warm spell is visible without reading a table.
- **Honest about limits.** Free forecasts stop at 10–16 days. The 30-day tab fills the rest with ten-year climate averages and labels those days as `climate` instead of pretending they are a forecast.
- **Weather you can see.** A full-screen scene (sun, moon, drifting clouds, canvas rain, snow, fog and lightning) reacts to the current condition, and eight icon packs are all animated.

## Screenshots

| Today | 7 days |
| --- | --- |
| ![Today](docs/desktop-today.png) | ![7-day forecast](docs/desktop-week.png) |

| 30 days | Settings |
| --- | --- |
| ![30-day outlook](docs/desktop-month.png) | ![Settings](docs/desktop-settings.png) |

| Themes and icon packs | Light theme |
| --- | --- |
| ![Themes and icon packs](docs/desktop-appearance.png) | ![Daylight theme](docs/desktop-light.png) |

| Phone — today | Phone — week |
| --- | --- |
| ![Mobile today](docs/mobile-today.png) | ![Mobile week](docs/mobile-week.png) |

## Features

### Forecast

- Current conditions with feels-like temperature, daily high and low.
- 24-hour hourly strip with precipitation probability.
- 7-day view with a chart of vertical temperature ranges (high and low on every bar), rain chance, wind and weekday, plus a summary strip and expandable rows for every day.
- 30-day view split into a real forecast and a clearly marked climate section.
- Sun card with an arc that tracks the actual position of the sun in real time, a filled trail from sunrise, and sunrise, sunset and daylight length.
- Detail cards for wind and gusts, direction, humidity, pressure, UV index, visibility, cloud cover and dew point.

### Providers

Seven sources, switchable in Settings:

| Provider | Model | Horizon | Key |
| --- | --- | --- | --- |
| Open-Meteo | Best match | 16 days | not needed |
| Open-Meteo | ECMWF IFS | 16 days | not needed |
| Open-Meteo | DWD ICON | 16 days | not needed |
| Open-Meteo | NOAA GFS | 16 days | not needed |
| MET Norway | Locationforecast 2.0 | 10 days | not needed |
| OpenWeatherMap | 5-day / 3-hour | 5 days | optional |
| Visual Crossing | Timeline | 15 days | optional |

Keyless providers work out of the box. Keys for the commercial providers are optional, stay in the browser (`localStorage`) and are forwarded only to this app's own `/api/weather` route — never stored on a server and never sent to a third party by the client.

### Places

- Search by city or town name in any of the six interface languages, including Cyrillic and diacritics.
- “Use my location” uses the browser Geolocation API and reverse-geocodes the coordinates.
- Recent places are remembered; the first launch guesses a city from the browser time zone, with Kyiv as the fallback.

### Appearance

- **Ten colour schemes:** `daylight`, `sand`, `mint`, `blossom` (light) and `midnight`, `graphite`, `aurora`, `nebula`, `ocean`, `ember` (dark).
- **Eight animated icon packs:** outline, duotone, solid, clay, neon, pixel, emoji, glyph.
- **Full-screen scenes** for clear, partly cloudy, overcast, fog, rain, snow and thunderstorms, with drifting colour fields, moving clouds, canvas particles for precipitation and a lightning flash for storms.
- **A wind card with a tree and grass** that bend further and faster as the wind picks up.
- **Motion levels:** full, calm, off. The system's reduced-motion preference is respected too.

### Language and units

- Interface: English, Ukrainian, Russian, Polish, German, Spanish. All 6 catalogues are tested for key and placeholder parity.
- Temperature: °C / °F.
- Wind: km/h, m/s, mph.
- Pressure: hPa, mmHg, inHg.
- Precipitation: mm / in.

### Platform

- Responsive from 360 px phones to wide desktops.
- The header stays pinned while the page scrolls.
- Installable PWA with a manifest and maskable icons.
- Theme is applied before first paint, so there is no flash of the wrong colours.
- Settings persist in `localStorage` under `pohoda.prefs.v1`.
- Automatic refresh every 10 minutes and when the tab becomes visible again.

## Tech stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript in strict mode
- Hand-written CSS with custom properties; no UI framework
- Vitest for unit tests of units, code mappings, time zones, formatting, catalogues and metadata

No runtime UI dependencies beyond React.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm test           # 57 unit tests
```

### Optional API keys

Create `.env.local` if you want the server to fill in keys for everyone:

```bash
OPENWEATHER_API_KEY=
VISUAL_CROSSING_API_KEY=
```

Visitors can also paste their own key in Settings; a key entered there takes precedence and never leaves the browser except in the request to this app's `/api/weather`.

## API

The app talks to three internal routes so provider keys and rate limits stay on the server:

| Route | Purpose |
| --- | --- |
| `GET /api/weather` | Normalised snapshot: current, hourly and daily points, plus climate-filled days |
| `GET /api/places` | Multilingual place search via Open-Meteo geocoding |
| `GET /api/places/reverse` | Coordinates to a place name |

All responses are normalised to one `WeatherSnapshot` shape, so the UI does not know which provider produced the data.

## How the 30-day view works

1. The selected provider returns its maximum horizon (5–16 days).
2. For the remaining days, the app asks the Open-Meteo archive for the same calendar days in 2015–2024 and averages them.
3. Those days carry `source: "climate"`, a hatched range bar, a `Climate` badge and a note explaining that they are a trend, not a forecast.

Archive responses are cached for 24 hours.

## Project structure

```
app/
  api/weather/         provider dispatch and normalisation
  api/places/          search and reverse geocoding
  layout.tsx           metadata, theme boot script, fonts
  page.tsx             app entry
components/
  AppShell.tsx         layout, tabs, dialogs, loading and error states
  WeatherScene.tsx     full-screen animated scene + canvas particles
  WeatherIcon.tsx      eight animated icon packs
  views/               Today, Week, Month
  DayRow, SunCard, RangeBar, Modal, SettingsDialog, PlaceDialog, Toast
lib/
  weather/             providers, normalisation, code maps, climate, sun
  i18n/                six catalogues and typed message keys
  client/              settings store, weather hook
  theme, units, time, format, places, types
tests/                 unit tests (Vitest)
docs/                  screenshots
```

## Deploy

The project is a standard Next.js app and deploys to Vercel without configuration:

```bash
npx vercel --prod
```

Set the two optional environment variables in the Vercel dashboard if you want server-side keys. No database, cron job or external storage is required.

## Credits

Weather data by [Open-Meteo](https://open-meteo.com/), [MET Norway](https://www.met.no/), [OpenWeatherMap](https://openweathermap.org/) and [Visual Crossing](https://www.visualcrossing.com/). Place search by Open-Meteo geocoding, which uses GeoNames data.

## License

MIT — see [LICENSE](LICENSE).
