
import pointsManager from '../core/manager.js';
import flyManager from '../earth/fly.js';
import { renderPointDebugger } from './point.js';
import { renderBillboardDebugger } from './billboard.js';
import { renderLabelDebugger } from './label.js';
import { renderEarthDebugger } from './earth.js';
import { t } from './utils.js';

class Debugger {
  constructor() {
    this.enabled = false;
    this.container = null;
    this.currentPoint = null;
    this.lang = 'zh'; // Default language
    this._boundOnRightClick = this._onRightClick.bind(this);
    this.titleEl = null;
    this.headerEl = null;
    this.svgContainer = null;
    this.connectorPath = null;
    this.connectorPoint = null;
    this._removePostRender = null;
  }

  init() {
    if (this.container) return;

    if (!document.getElementById('cesium-friendly-debugger-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'cesium-friendly-debugger-styles';
      styleEl.textContent = `
        #cesium-friendly-debugger {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.45) rgba(255, 255, 255, 0.06);
        }
        #cesium-friendly-debugger::-webkit-scrollbar {
          width: 10px;
        }
        #cesium-friendly-debugger::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
        }
        #cesium-friendly-debugger::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.45);
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.06);
        }
        #cesium-friendly-debugger::-webkit-scrollbar-thumb:hover {
          background: rgba(226, 232, 240, 0.55);
        }
      `;
      document.head.appendChild(styleEl);
    }

    // Create SVG Overlay
    this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
      overflow: visible;
    `;
    
    // Connection Line
    this.connectorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.connectorPath.setAttribute('fill', 'none');
    this.connectorPath.setAttribute('stroke', '#38bdf8');
    this.connectorPath.setAttribute('stroke-width', '1.5');
    this.connectorPath.setAttribute('stroke-dasharray', '4,4');
    this.connectorPath.style.filter = 'drop-shadow(0 0 2px rgba(56, 189, 248, 0.5))';
    this.svgContainer.appendChild(this.connectorPath);

    // Anchor Point
    this.connectorPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.connectorPoint.setAttribute('r', '4');
    this.connectorPoint.setAttribute('fill', 'rgba(15, 23, 42, 0.85)');
    this.connectorPoint.setAttribute('stroke', '#38bdf8');
    this.connectorPoint.setAttribute('stroke-width', '2');
    this.connectorPoint.style.display = 'none';
    this.svgContainer.appendChild(this.connectorPoint);
    this.connectorPath.style.display = 'none';

    document.body.appendChild(this.svgContainer);

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'cesium-friendly-debugger';
    this.container.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 500px;
      height: 90vh;
      background: rgba(15, 23, 42, 0.85);
      color: #e2e8f0;
      padding: 24px;
      border-radius: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      z-index: 9999;
      display: none;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(56, 189, 248, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    `;

    // Title & Close Button Container
    const header = document.createElement('div');
    this.headerEl = header;
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -24px -24px 20px;
      padding: 24px 24px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      z-index: 2;
      top: -25px;
      background: rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
    `;
    this.container.appendChild(header);

    // Left side: Title + Lang Switch
    const leftHeader = document.createElement('div');
    leftHeader.style.display = 'flex';
    leftHeader.style.alignItems = 'center';
    leftHeader.style.gap = '12px';
    header.appendChild(leftHeader);

    // Title
    this.titleEl = document.createElement('div');
    this.titleEl.textContent = t('title', this.lang);
    this.titleEl.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.5px;
      color: #fff;
    `;
    leftHeader.appendChild(this.titleEl);

    // Lang Switch
    const langBtn = document.createElement('button');
    langBtn.textContent = this.lang === 'zh' ? 'EN' : '中';
    langBtn.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ccc;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    langBtn.onmouseover = () => langBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    langBtn.onmouseout = () => langBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    langBtn.onclick = () => {
      this.lang = this.lang === 'zh' ? 'en' : 'zh';
      langBtn.textContent = this.lang === 'zh' ? 'EN' : '中';
      this.titleEl.textContent = t('title', this.lang);
      if (this.currentPoint) {
        this.render();
      }
    };
    leftHeader.appendChild(langBtn);

    // Close Button
    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    closeBtn.style.cssText = `
      cursor: pointer;
      color: #aaa;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      transition: background 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.color = '#fff';
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.color = '#aaa';
      closeBtn.style.background = 'transparent';
    };
    closeBtn.onclick = () => {
      this.container.style.display = 'none';
      this.currentPoint = null;
      this._updateHighlight(null);
    };
    header.appendChild(closeBtn);

    // Content area
    this.content = document.createElement('div');
    this.container.appendChild(this.content);

    document.body.appendChild(this.container);

    // Listen to right click changes
    pointsManager.addRightClickListener(this._boundOnRightClick);
  }

  enable() {
    this.enabled = true;
    // Don't auto show on enable, wait for right click
  }

  disable() {
    this.enabled = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
    this._updateHighlight(null);
  }

  _updateHighlight(target) {
    // Remove existing listener
    if (this._removePostRender) {
      this._removePostRender();
      this._removePostRender = null;
    }

    // Hide SVG elements initially
    if (this.connectorPath) this.connectorPath.style.display = 'none';
    if (this.connectorPoint) this.connectorPoint.style.display = 'none';

    // Cleanup earth highlight
    if (this._earthHighlight) {
        const scene = this._earthHighlight.scene;
        if (scene && scene.globe) {
             scene.globe.enableLighting = this._earthHighlight.originalLighting;
             scene.globe.atmosphereBrightnessShift = this._earthHighlight.originalAtmosphere;
        }
        this._earthHighlight = null;
    }

    if (!target || !target.viewer || !target.cesium) return;

    const scene = target.viewer.scene;
    const Cesium = target.cesium;

    // Earth Highlight Logic
    if (target.type === 'earth') {
         this._earthHighlight = {
             scene: scene,
             originalLighting: scene.globe.enableLighting,
             originalAtmosphere: scene.globe.atmosphereBrightnessShift
         };
         
         // Highlight effect: Disable lighting (to see map clearly) and boost atmosphere
         scene.globe.enableLighting = false;
         scene.globe.atmosphereBrightnessShift = 0.5; // Glow effect

         // Zoom out to see full earth if needed
         const cameraHeight = scene.camera.positionCartographic.height;
         if (cameraHeight < 10000000) {
             const dest = Cesium.Cartesian3.fromDegrees(
                 target.position.lng,
                 target.position.lat,
                 25000000 // High enough to see the globe
             );
             scene.camera.flyTo({
                 destination: dest,
                 duration: 1.5
             });
         }
    }

    const updateLine = () => {
        if (this.currentPoint !== target) {
            if (this.connectorPath) this.connectorPath.style.display = 'none';
            if (this.connectorPoint) this.connectorPoint.style.display = 'none';
            return;
        }
        if (!this.container || this.container.style.display === 'none') {
            if (this.connectorPath) this.connectorPath.style.display = 'none';
            if (this.connectorPoint) this.connectorPoint.style.display = 'none';
            return;
        }
        
        // 1. Get Entity Screen Position
        const pos = target.position; // [lng, lat, alt]
        if (!pos) {
             if (this.connectorPath) this.connectorPath.style.display = 'none';
             if (this.connectorPoint) this.connectorPoint.style.display = 'none';
             return;
        }

        // Validate coordinates
        let lng = pos.lng ?? pos[0];
        let lat = pos.lat ?? pos[1];
        const absAlt = pos.alt ?? pos[2] ?? 0;
        const heightOffset = typeof target.heightOffset === 'number' ? target.heightOffset : 0;
        const hasHeightOffset = heightOffset !== 0;
        const heightReference = target.heightReference === 'relativeToGround' || (target.heightReference === 'clampToGround' && hasHeightOffset)
          ? 'relativeToGround'
          : (target.heightReference || 'none');
        let alt = 0;

        if (typeof lng !== 'number' || typeof lat !== 'number') {
             if (this.connectorPath) this.connectorPath.style.display = 'none';
             if (this.connectorPoint) this.connectorPoint.style.display = 'none';
             return;
        }

        // Handle height reference (clampToGround / relativeToGround)
        if ((heightReference === 'clampToGround' || heightReference === 'relativeToGround') && scene.globe) {
            const cartographic = Cesium.Cartographic.fromDegrees(lng, lat);
            const terrainHeight = scene.globe.getHeight(cartographic);
            if (terrainHeight !== undefined) {
                if (heightReference === 'clampToGround') {
                    alt = terrainHeight;
                } else {
                    alt = terrainHeight + heightOffset;
                }
            } else {
                alt = heightReference === 'relativeToGround' ? heightOffset : 0;
            }
        } else if (heightReference === 'relativeToGround') {
            alt = heightOffset;
        } else {
            alt = absAlt + heightOffset;
        }

        const cartesian = Cesium.Cartesian3.fromDegrees(lng, lat, alt);
        
        let screenPos;
        if (scene.cartesianToCanvasCoordinates) {
            screenPos = scene.cartesianToCanvasCoordinates(cartesian);
        } else if (Cesium.SceneTransforms && Cesium.SceneTransforms.wgs84ToWindowCoordinates) {
            screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, cartesian);
        }
        
        if (!screenPos) {
            if (this.connectorPath) this.connectorPath.style.display = 'none';
            if (this.connectorPoint) this.connectorPoint.style.display = 'none';
            return;
        }

        // 2. Get Panel Position (Left Edge Center)
        const panelRect = this.container.getBoundingClientRect();
        const panelX = panelRect.left;
        const headerRect = this.headerEl ? this.headerEl.getBoundingClientRect() : null;
        const panelY = headerRect ? (headerRect.top + headerRect.height / 2) : (panelRect.top + 45);
        
        // 3. Draw Curve
        const p1 = { x: screenPos.x, y: screenPos.y };
        
        // Midpoint for S-curve
        const midX = (p1.x + panelX) / 2;
        
        // If panel is to the right (normal case), curve flows nicely.
        const pathStr = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${panelY}, ${panelX} ${panelY}`;
        
        if (this.connectorPath) {
            this.connectorPath.setAttribute('d', pathStr);
            this.connectorPath.style.display = 'block';
        }

        if (this.connectorPoint) {
            this.connectorPoint.setAttribute('cx', p1.x);
            this.connectorPoint.setAttribute('cy', p1.y);
            this.connectorPoint.style.display = 'block';
        }
    };
    
    this._removePostRender = scene.postRender.addEventListener(updateLine);
  }

  _onRightClick(point) {
    if (!this.enabled) return;
    this.currentPoint = point;
    this._updateHighlight(point);
    this.render();
    this.container.style.display = 'block';
  }

  render() {
    if (!this.content) return;
    this.content.innerHTML = '';

    if (!this.currentPoint) {
      this.content.innerHTML = '<div style="color: #aaa; font-style: italic;">Select an entity to debug</div>';
      return;
    }

    const point = this.currentPoint;
    
    // Type specific controls
    if (point.type === 'point') {
      renderPointDebugger(this.content, point, this.lang);
    } else if (point.type === 'billboard') {
      renderBillboardDebugger(this.content, point, this.lang);
    } else if (point.type === 'label') {
      renderLabelDebugger(this.content, point, this.lang);
    } else if (point.type === 'earth') {
      renderEarthDebugger(this.content, point, this.lang);
    }
  }
}

export default new Debugger();
