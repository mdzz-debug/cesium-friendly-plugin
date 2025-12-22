
class FlyManager {
  constructor() {
    this.viewer = null;
    this.cesium = null;
  }

  init(cesium, viewer) {
    this.cesium = cesium;
    this.viewer = viewer;
  }

  // --- Fly To ---
  flyTo(position, orientation, duration = 2.0) {
    return new Promise((resolve) => {
      if (!this.viewer) {
        resolve();
        return;
      }
      
      this.viewer.camera.flyTo({
        destination: this.cesium.Cartesian3.fromDegrees(
          position.lng, 
          position.lat, 
          position.alt
        ),
        orientation: {
          heading: this.cesium.Math.toRadians(orientation.heading),
          pitch: this.cesium.Math.toRadians(orientation.pitch),
          roll: this.cesium.Math.toRadians(orientation.roll)
        },
        duration: duration,
        complete: () => {
          resolve();
        }
      });
    });
  }

  // --- Fly & Orbit ---
  flyAndOrbit(position, orientation, duration = 1.0, cycles = 3) {
    return new Promise((resolve) => {
      if (!this.viewer) {
        resolve();
        return;
      }

      // 1. Cancel any existing orbit
      if (this._stopOrbit) {
          this._stopOrbit();
      }

      // 2. Fly to target
      this.flyTo(position, orientation, duration).then(() => {
          // 3. Start Orbit
          this._startOrbit(cycles, resolve);
      });
    });
  }

  _startOrbit(cycles, onComplete) {
    if (!this.viewer) {
        if (onComplete) onComplete();
        return;
    }
    
    const scene = this.viewer.scene;
    const camera = scene.camera;
    
    let rotatedAngle = 0;
    const totalAngle = cycles * 2 * Math.PI; // 360 * cycles
    const speed = 0.5 * (Math.PI / 180); // 0.5 degree per frame
    
    const onTick = () => {
        if (rotatedAngle >= totalAngle) {
            this._stopOrbit();
            if (onComplete) onComplete();
            return;
        }
        
        // Rotate camera around Z axis of Earth
        camera.rotate(this.cesium.Cartesian3.UNIT_Z, -speed); 
        rotatedAngle += speed;
    };
    
    const removeListener = scene.postRender.addEventListener(onTick);
    
    this._stopOrbit = () => {
        removeListener();
        this._stopOrbit = null;
    };
  }

  stopOrbit() {
    if (this._stopOrbit) {
        this._stopOrbit();
    }
  }

  getCurrentCamera() {
    if (!this.viewer) return null;
    
    const camera = this.viewer.camera;
    // Use fromCartesian to ensure fresh calculation
    const cartographic = this.cesium.Cartographic.fromCartesian(camera.position);
    
    return {
      position: {
        lng: this.cesium.Math.toDegrees(cartographic.longitude),
        lat: this.cesium.Math.toDegrees(cartographic.latitude),
        alt: cartographic.height
      },
      orientation: {
        heading: this.cesium.Math.toDegrees(camera.heading),
        pitch: this.cesium.Math.toDegrees(camera.pitch),
        roll: this.cesium.Math.toDegrees(camera.roll)
      }
    };
  }

  // --- Surface Transparency ---
  setSurfaceOpacity(opacity) {
    if (!this.viewer) return;
    this.viewer.scene.globe.translucency.enabled = opacity < 1.0;
    this.viewer.scene.globe.translucency.frontFaceAlpha = opacity;
  }

  setDepthTest(enabled) {
    if (!this.viewer) return;
    this.viewer.scene.globe.depthTestAgainstTerrain = enabled;
  }
}

export default new FlyManager();
