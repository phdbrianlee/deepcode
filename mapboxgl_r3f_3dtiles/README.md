# MapboxGL + React Three Fiber + 3DTilesRenderer

This project demonstrates how to integrate [3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS) with [React](https://reactjs.org/), [mapbox-gl-js](https://docs.mapbox.com/mapbox-gl-js/), and [React Three Fiber](https://github.com/pmndrs/react-three-fiber).

## Features

- React-based UI
- Mapbox GL JS for 2D map base layer
- React Three Fiber for 3D rendering
- 3DTilesRendererJS for loading and rendering 3D Tiles
- Real-time tileset statistics display

## Prerequisites

- Node.js 18+ 
- A Mapbox access token (get one at https://account.mapbox.com/)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure your Mapbox token:

Create a `.env` file in the project root:

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Or copy from the example:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal.

## Usage

The demo loads the Cesium 3D Tiles sample dataset showing buildings in Philadelphia. You can:

- Navigate the map using mouse drag
- Zoom in/out with scroll wheel
- Tilt and rotate the view by right-click dragging
- View real-time tile loading statistics in the top-left panel

## Project Structure

```
mapboxgl_r3f_3dtiles/
├── src/
│   ├── components/
│   │   ├── TilesRenderer.jsx    # 3D Tiles renderer component
│   │   └── InfoPanel.jsx        # Statistics display panel
│   ├── App.jsx                   # Main application component
│   ├── App.css                  # Application styles
│   └── main.jsx                 # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Key Implementation Details

### TilesRenderer Component

The `TilesRenderer` component wraps `ThreeTilesRenderer` from the 3DTilesRendererJS library and integrates it with React Three Fiber's render loop:

```jsx
useFrame(() => {
  camera.updateMatrixWorld();
  tilesRenderer.update();
});
```

### Layer Integration

The map and 3D canvas are layered:
1. Bottom layer: Mapbox GL map (z-index: 1)
2. Top layer: React Three Fiber canvas (z-index: 2)

This allows the 3D tiles to overlay the 2D map while maintaining interactivity.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Dependencies

- **react**: ^18.3.1
- **react-dom**: ^18.3.1
- **@react-three/fiber**: ^8.17.9
- **@react-three/drei**: ^10.0.0
- **three**: ^0.170.0
- **3d-tiles-renderer**: ^0.4.23
- **mapbox-gl**: ^3.8.0
- **react-map-gl**: ^7.1.7

## License

MIT
