
/**
 * Camera Height Listener
 * 监听相机高度变化工具
 * 
 * 职责：单纯地监听相机高度变化，并通知订阅者。
 * 不涉及具体的业务逻辑（如 Label 的显隐、销毁等）。
 */
export class HeightListener {
  constructor(viewer, cesium) {
    this.viewer = viewer;
    this.cesium = cesium;
    this.listeners = new Set();
    this._lastHeight = 0;
    this._removePostRenderListener = null;
    this.isActive = false;
  }

  /**
   * Start listening to height changes
   */
  start() {
    if (this.isActive) return;
    
    this._removePostRenderListener = this.viewer.scene.postRender.addEventListener(() => {
      const camera = this.viewer.camera;
      // Calculate height
      let height = 0;
      if (this.cesium && this.cesium.Cartographic) {
          const cartographic = this.cesium.Cartographic.fromCartesian(camera.position);
          height = cartographic.height;
      } else {
          // Fallback if cesium not fully ready?
          return;
      }
      
      // Notify every frame or with threshold? 
      // Using a small threshold to avoid minimal jitter updates if needed, 
      // but for smooth fading, real-time is often better.
      // Here we notify if there's any change, allowing subscribers to debounce if they want.
      
      if (Math.abs(this._lastHeight - height) > 0.1) {
        this._lastHeight = height;
        this._notify(height);
      }
    });
    
    this.isActive = true;
  }

  /**
   * Stop listening
   */
  stop() {
    if (this._removePostRenderListener) {
      this._removePostRenderListener();
      this._removePostRenderListener = null;
    }
    this.isActive = false;
  }

  /**
   * Subscribe to height changes
   * @param {Function} callback (height) => {}
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    if (!this.isActive) {
      this.start();
    }
    // Return unsubscribe function for convenience
    return () => this.unsubscribe(callback);
  }

  /**
   * Unsubscribe
   * @param {Function} callback 
   */
  unsubscribe(callback) {
    this.listeners.delete(callback);
    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  _notify(height) {
    for (const listener of this.listeners) {
      try {
        listener(height);
      } catch (e) {
        console.error('Error in HeightListener notify:', e);
      }
    }
  }
}

// Singleton instance management
let instance = null;

export function getHeightListener(viewer, cesium) {
  if (!instance) {
    instance = new HeightListener(viewer, cesium);
  }
  return instance;
}
