# 👑 Cat Kingdom (Vương Quốc Mèo)

A casual, cozy 3D Kingdom / City Builder web game where players build, manage, and expand a thriving feline society. Built completely with **Vite**, **TypeScript**, and **Three.js** with zero heavyweight frameworks.

---

## 🎮 Game Features

- **Stylized Low-Poly 3D Visuals**:
  - Cute anthropomorphic cats with role-specific accessories (Farmer straw hats, Worker hardhats, Admin crowns, Soldier paw spears).
  - Dynamic day/night cycle with warm golden sunsets and glowing starry nights.
  - Soft shadows, lush pastures, trees, rocks, and water ponds.
- **Isometric Orbit Camera**:
  - Pan around your kingdom with `W / A / S / D`, arrow keys, or middle/right mouse drag.
  - Smooth zoom in and out with mouse scroll wheel.
  - Orbit rotation with `Q / E` or right-click drag.
- **Resource Economy**:
  - **Fish & Catnip (Cá & Cỏ)**: Sustains your cat population.
  - **Wood (Gỗ)**: Basic building material harvested from sawmills.
  - **Stone (Đá)**: Structural block extracted from quarries.
  - **Metal (Kim loại)**: Advanced alloys smelted in workshops.
  - **Population & Happiness (Hạnh Phúc)**: High happiness attracts new cat immigrants.
- **Cat Specialist System**:
  - **Civilian Cat (Mèo Dân)**: Versatile citizen.
  - **Farmer Cat (Mèo Nông)**: +100% Food production at Fish & Catnip farms.
  - **Worker Cat (Mèo Thợ)**: +75% Wood, Stone, and Metal extraction.
  - **Admin Cat (Mèo Quan)**: Accelerates building construction speed and boosts happiness.
  - **Soldier Cat (Mèo Binh)**: Defends the kingdom borders.
  - **State Machine AI**: Cats walk between home and workplace, work, take breaks, and curl up to sleep when exhausted or during nighttime.
  - Re-train and promote cat roles directly from the inspector panel!
- **Interactive Building System**:
  - Ghost preview with valid/invalid tile checks.
  - 7 unique buildings: Town Hall, Cat House, Farm, Sawmill, Quarry, Workshop, Barracks.
  - Demolish structures to reclaim 40% of spent resources.
- **Persistence & Time Controls**:
  - 1x, 2x, 3x simulation speed and pause button.
  - LocalStorage Save and Load support.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (version 18+ recommended)
- npm

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```

Open your browser at `http://localhost:3000` to play!

---

## 🌐 Deploying to GitHub Pages (Static Hosting)

This game runs entirely client-side without any server requirements, making it 100% compatible with GitHub Pages.

### Step 1: Build the static bundle
```bash
npm run build
```
This produces an optimized production bundle inside the `dist/` directory.

### Step 2: Automated Deployment via GitHub Actions
Create a file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Step 3: Enable Pages in GitHub Settings
1. Go to your GitHub repository -> **Settings** -> **Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push to `main`, and your game will be live automatically!

---

## 📂 Project Architecture

```
SENTARY-main/
├── index.html                   # Entry HTML with Tailwind CDN & Google Fonts
├── vite.config.ts               # Vite configuration (relative base for Pages)
├── package.json
├── src/
│   ├── main.ts                  # Main entry, loop, and mouse raycasting
│   ├── style.css                # Global animations, fonts, and scrollbars
│   ├── game/
│   │   ├── types.ts             # Core data interfaces (Resources, Cats, Buildings)
│   │   ├── constants.ts         # Building costs, rates, and cat role metadata
│   │   ├── gameState.ts         # Central reactive state manager & LocalStorage save/load
│   │   ├── gridManager.ts       # 36x36 tile map occupancy and BFS pathfinding
│   │   ├── assetBuilder.ts      # Stylized procedural 3D meshes (cats, buildings, props)
│   │   ├── worldScene.ts        # Three.js scene, isometric camera, soft lights, day/night
│   │   ├── buildingManager.ts   # Placement validation, ghost preview, and demolishing
│   │   ├── catManager.ts        # Cat state machine, movement paths, and bouncy animations
│   │   └── simulationSystem.ts  # Economy ticks, construction progress, role bonuses
│   └── ui/
│       └── uiManager.ts         # Cozy glassmorphic HUD, inspector, and worker assignments
└── dist/                        # Production build ready for static hosting
```
