# ✈️ Aerospace Flight Simulation App

A full-stack flight simulation platform that provides real-time GO/NO-GO decisions for flight planning using live weather, turbulence, wind, and fuel data.

## What It Does

Enter a flight plan and the app will:
- Fetch live **METAR weather** and **SIGMET alerts** for each waypoint
- Check **turbulence reports (PIREPs)** along the route
- Pull **upper wind layers** at multiple altitudes
- Calculate **fuel burn estimates** via FlightAware AeroAPI
- Return a **GO / NO-GO decision** based on all conditions

## Tech Stack

- **Backend:** Java 21, Spring Boot 3.5, Maven
- **Mobile:** React Native, Expo 54
- **Weather Data:** Aviation Weather (NOAA) — free, no key needed
- **Wind Data:** Open-Meteo — free, no key needed
- **Fuel Data:** FlightAware AeroAPI — requires API key

## How to Run the Backend

1. Clone the repo and navigate to the backend folder:
```bash
   cd aerospace-app/backend
```

2. Add your FlightAware API key in `src/main/resources/application.properties`:
```
   aerospace.api.flightaware.key=YOUR_KEY_HERE
```

3. Run the backend:
```bash
   mvn spring-boot:run
```

4. The API will be available at `http://localhost:8080`

## How to Run the Mobile App

1. Navigate to the mobile folder:
```bash
   cd aerospace-app/mobile
```

2. Install dependencies:
```bash
   npm install
```

3. Start the app:
```bash
   npx expo start
```

4. Scan the QR code with the **Expo Go** app on your phone

> Make sure your phone and PC are on the same WiFi network, and update `mobile/config.js` with your PC's local IP address.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/simulate` | Run a full flight simulation |
| GET | `/health` | Check backend status |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `aerospace.api.flightaware.key` | Yes (for real fuel data) | FlightAware AeroAPI key |
| `aerospace.api.nasa.key` | Optional | NASA EarthData key |

## Project Structure
```
aerospace-app/
├── backend/          # Spring Boot API
│   └── src/main/java/com/aerospace/
│       ├── client/   # External API clients
│       ├── model/    # Data models
│       ├── service/  # Flight simulation logic
│       └── store/    # API key management
└── mobile/           # React Native app
    ├── api/          # Backend API calls
    ├── screens/      # App screens
    └── config.js     # Backend URL config
```