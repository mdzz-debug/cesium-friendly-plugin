# Earth & Camera Control

Control Earth camera, appearance, and global settings via the main plugin instance.

## Usage

Access these methods directly from your initialized plugin instance.

```javascript
import CesiumFriendlyPlugin from 'cesium-friendly-plugin';

// ... init ...
CesiumFriendlyPlugin.init(cesium, viewer);
```

## API

### `flyTo(position, orientation, duration)`

Fly camera to a specific location and orientation. Returns a **Promise** that resolves when flight completes.

- **position**: Object `{ lng, lat, alt }`
- **orientation**: Object `{ heading, pitch, roll }`
- **duration**: Number (optional, default 2.0 seconds)

**Example:**

```javascript
CesiumFriendlyPlugin.flyTo({
  lng: 116.4, 
  lat: 39.9, 
  alt: 10000
}, {
  heading: 0, 
  pitch: -90, 
  roll: 0
}, 5.0).then(() => {
  console.log("Flight finished!");
});
```

### `flyAndOrbit(position, orientation, duration, cycles)`

Fly to a location and then orbit around it (or Earth center, depending on context). Returns a **Promise** that resolves when the orbit finishes.

- **position**: Object `{ lng, lat, alt }`
- **orientation**: Object `{ heading, pitch, roll }`
- **duration**: Number (Flight duration in seconds, default 1.0)
- **cycles**: Number (Number of orbit cycles, default 3)

**Example:**

```javascript
CesiumFriendlyPlugin.flyAndOrbit({
  lng: 116.4, 
  lat: 39.9, 
  alt: 25000000
}, {
  heading: 0, 
  pitch: -90, 
  roll: 0
}, 1.0, 3).then(() => {
  console.log('Orbit Finished!');
});
```

### `setSurfaceOpacity(opacity)`

Set the transparency of the Earth's surface.

- **opacity**: Number (0.0 to 1.0)

**Example:**

```javascript
CesiumFriendlyPlugin.setSurfaceOpacity(0.5);
```

### `setDepthTest(enabled)`

Enable or disable depth testing against terrain.

- **enabled**: Boolean

**Example:**

```javascript
CesiumFriendlyPlugin.setDepthTest(false);
```

### `getCurrentCamera()`

Get the current camera position and orientation.

**Returns:**

```javascript
{
  position: { lng, lat, alt },
  orientation: { heading, pitch, roll }
}
```
