
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
      let lng, lat, alt;

      // 1. Check if it's a SmartGeometryEntity/PointEntity/Wrapper with position array
      //    (SmartGeometryEntity and PointEntity both store position as [lng, lat, alt])
      if (targetPos && targetPos.position && Array.isArray(targetPos.position)) {
          [lng, lat, alt] = targetPos.position;
      } 
      // 2. Check if it's a simple object {lng, lat, alt}
      else if (targetPos && typeof targetPos.lng === 'number' && typeof targetPos.lat === 'number') {
          lng = targetPos.lng;
          lat = targetPos.lat;
          alt = targetPos.alt || 0;
      }
      
      // Validation: Ensure coordinates are valid numbers
      if (lng !== undefined && lat !== undefined && !isNaN(lng) && !isNaN(lat)) {
           // console.log('[FlyManager] Flying to coordinates:', { lng, lat, alt });
           const targetCartesian = this.cesium.Cartesian3.fromDegrees(lng, lat, alt || 0);
           const boundingSphere = new this.cesium.BoundingSphere(targetCartesian, 0);
           
           this.viewer.camera.flyToBoundingSphere(boundingSphere, {
               duration: duration,
               offset: orientation ? new this.cesium.HeadingPitchRange(
                   this.cesium.Math.toRadians(orientation.heading || 0),
                   this.cesium.Math.toRadians(orientation.pitch || -90),
                   orientation.range || 0
               ) : undefined,
               complete: () => {
                   resolve();
               }
           });
           return;
      }

      // 3. Fallback: Check if it has an .entity property (legacy wrapper or direct Cesium Entity)
      //    Note: We prefer BoundingSphere method above if position is known, to avoid "tilted view off-center" issues.
      if (targetPos && (targetPos instanceof this.cesium.Entity || (targetPos.entity && targetPos.entity instanceof this.cesium.Entity))) {
           const ent = targetPos instanceof this.cesium.Entity ? targetPos : targetPos.entity;
           this.viewer.flyTo(ent, {
               duration: duration,
               offset: orientation ? new this.cesium.HeadingPitchRange(
                   this.cesium.Math.toRadians(orientation.heading || 0),
                   this.cesium.Math.toRadians(orientation.pitch || -45),
                   orientation.range || 0
               ) : undefined
           }).then(resolve);
           return;
      }
      
      // If nothing matched, just resolve
      resolve();
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
