
import pointsManager from '../core/manager.js';
import { renderPointDebugger } from './point.js';
import { renderBillboardDebugger } from './billboard.js';
import { renderLabelDebugger } from './label.js';
import { t } from './utils.js';

class Debugger {
  constructor() {
    this.enabled = false;
    this.container = null;
    this.currentPoint = null;
    this.lang = 'zh'; // Default language
    this._boundOnRightClick = this._onRightClick.bind(this);
    this.titleEl = null;
    this.highlightEntity = null;
  }

  init() {
    if (this.container) return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'cesium-friendly-debugger';
    this.container.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 420px;
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
    `;

    // Title & Close Button Container
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
    // Remove existing highlight
    if (this.highlightEntity) {
      // Try to find the viewer from the entity or use stored reference
      // Since we don't store viewer globally, we rely on the target's viewer or the one from previous target
      if (this.highlightEntity.entityCollection) {
         this.highlightEntity.entityCollection.remove(this.highlightEntity);
      }
      this.highlightEntity = null;
    }

    if (!target || !target.viewer || !target.cesium) return;

    const Cesium = target.cesium;
    const viewer = target.viewer;

    // Create a dynamic position callback that follows the target
    const positionCallback = new Cesium.CallbackProperty(() => {
        if (!this.currentPoint || !this.currentPoint.position) return undefined;
        const pos = this.currentPoint.position;
        return Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
    }, false);

    // Create a pulsing color callback
    const colorCallback = new Cesium.CallbackProperty((time) => {
        const alpha = Math.abs(Math.sin(performance.now() / 500)) * 0.5 + 0.2;
        return Cesium.Color.YELLOW.withAlpha(alpha);
    }, false);

    this.highlightEntity = viewer.entities.add({
        position: positionCallback,
        point: {
            pixelSize: 20,
            color: colorCallback,
            outlineColor: Cesium.Color.YELLOW,
            outlineWidth: 2,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // Always on top
            heightReference: target.heightReference === 'clampToGround' 
                ? Cesium.HeightReference.CLAMP_TO_GROUND 
                : Cesium.HeightReference.NONE
        }
    });
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
    }
  }
}

export default new Debugger();
