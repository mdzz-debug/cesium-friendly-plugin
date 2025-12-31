
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
  flyTo(positionOrEntity, orientation, duration = 2.0) {
    return new Promise((resolve) => {
      if (!this.viewer) {
        resolve();
        return;
      }

      let targetPos = positionOrEntity;
      
      // Handle Entity Wrapper or Cesium Entity
      if (positionOrEntity && (positionOrEntity.position || positionOrEntity.id)) {
          // It might be our wrapper
          if (typeof positionOrEntity.position === 'object' && !Array.isArray(positionOrEntity.position)) {
              // Assume it's a wrapper with {lng, lat, alt} position getter/property
               // But wait, our wrappers usually have position as getter returning array or internal property?
               // BaseEntity has position setter, but getting it might be tricky.
               // Let's check if it has .entity.position
               if (positionOrEntity.entity && positionOrEntity.entity.position) {
                   // Use Cesium's flyTo for entities
                   this.viewer.flyTo(positionOrEntity.entity, {
                       duration: duration,
                       offset: orientation ? new this.cesium.HeadingPitchRange(
                           this.cesium.Math.toRadians(orientation.heading || 0),
                           this.cesium.Math.toRadians(orientation.pitch || -45),
                           orientation.range || 0
                       ) : undefined
                   }).then(resolve);
                   return;
               }
          }
      }

      // Default: Assume {lng, lat, alt} object
      this.viewer.camera.flyTo({
        destination: this.cesium.Cartesian3.fromDegrees(
          targetPos.lng, 
          targetPos.lat, 
          targetPos.alt
        ),
        orientation: orientation ? {
          heading: this.cesium.Math.toRadians(orientation.heading),
          pitch: this.cesium.Math.toRadians(orientation.pitch),
          roll: this.cesium.Math.toRadians(orientation.roll)
        } : undefined,
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
    return this;
  }

  setDepthTest(enabled) {
    if (!this.viewer) return;
    this.viewer.scene.globe.depthTestAgainstTerrain = enabled;
    return this;
  }

  update() {
    return this;
  }
}

export default new FlyManager();
