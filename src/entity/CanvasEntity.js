import { BaseEntity } from './BaseEntity.js';

export class CanvasEntity extends BaseEntity {
  constructor(id, app, options = {}) {
    super(id, app, options);
    this.type = 'canvas';
    this.options.composite = options.composite !== undefined ? !!options.composite : true;
    this.options.scale = this.options.scale !== undefined ? this.options.scale : 1;
    this.options.opacity = this.options.opacity !== undefined ? this.options.opacity : 1;

    // isolate component configs to avoid cross-entity mutation/pollution
    this.options.point = this._clone(options.point) || undefined;
    this.options.billboard = this._clone(options.billboard) || undefined;
    this.options.label = this._clone(options.label) || undefined;
    this._composedImage = null;
    this._composeToken = 0;
    this._composeSignature = '';
  }

  usePoint(options = {}) {
    this.options.point = { ...(this.options.point || {}), ...this._clone(options) };
    return this;
  }

  useBillboard(options = {}) {
    this.options.billboard = { ...(this.options.billboard || {}), ...this._clone(options) };
    return this;
  }

  useLabel(options = {}) {
    this.options.label = { ...(this.options.label || {}), ...this._clone(options) };
    return this;
  }

  use(type, options = {}) {
    const key = (type || '').toString().toLowerCase();
    if (key === 'point') return this.usePoint(options);
    if (key === 'billboard') return this.useBillboard(options);
    if (key === 'label') return this.useLabel(options);
    return this;
  }

  setComposite(enable = true) {
    this.options.composite = !!enable;
    return this;
  }

  _clone(value) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return [...value];
    return { ...value };
  }

  _resolvePosition(pos) {
    const Cesium = this.cesium;
    if (!pos) return Cesium.Cartesian3.fromDegrees(0, 0, 0);
    if (Array.isArray(pos)) return Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0);
    return Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt || 0);
  }

  _resolveColor(value, fallback = 'white') {
    const Cesium = this.cesium;
    if (this.app && typeof this.app.resolveColorToken === 'function') {
      return this.app.resolveColorToken(value, fallback);
    }
    if (value instanceof Cesium.Color) return value;
    if (typeof value === 'string') return Cesium.Color.fromCssColorString(value);
    return Cesium.Color.fromCssColorString(fallback);
  }

  _buildPoint(pointOpts = {}) {
    const Cesium = this.cesium;
    let color = this._resolveColor(pointOpts.color, 'red');
    if (pointOpts.opacity !== undefined) color = color.withAlpha(pointOpts.opacity);

    const point = {
      pixelSize: pointOpts.pixelSize !== undefined ? pointOpts.pixelSize : 10,
      color,
      outlineColor: this._resolveColor(pointOpts.outlineColor, 'white'),
      outlineWidth: pointOpts.outlineWidth !== undefined ? pointOpts.outlineWidth : 0,
      disableDepthTestDistance: this._resolveDisableDepthTestDistance(pointOpts)
    };

    if (pointOpts.pixelOffset) {
      point.pixelOffset = new Cesium.Cartesian2(pointOpts.pixelOffset.x, pointOpts.pixelOffset.y);
    }
    const pointEyeOffset = this._resolveEyeOffset(pointOpts);
    if (pointEyeOffset) point.eyeOffset = pointEyeOffset;
    return point;
  }

  _buildBillboard(billboardOpts = {}) {
    const Cesium = this.cesium;
    const commonHOrigin = this.options.horizontalOrigin;
    const commonVOrigin = this.options.verticalOrigin;
    const billboard = {
      image: this._composedImage || billboardOpts.image || '',
      scale: (billboardOpts.scale !== undefined ? billboardOpts.scale : 1) * (this.options.scale !== undefined ? this.options.scale : 1),
      disableDepthTestDistance: this._resolveDisableDepthTestDistance(billboardOpts),
      horizontalOrigin: this._resolveHorizontalOrigin(
        billboardOpts.horizontalOrigin !== undefined ? billboardOpts.horizontalOrigin : commonHOrigin,
        'CENTER'
      ),
      verticalOrigin: this._resolveVerticalOrigin(
        billboardOpts.verticalOrigin !== undefined ? billboardOpts.verticalOrigin : commonVOrigin,
        'CENTER'
      )
    };

    if (billboardOpts.color || billboardOpts.opacity !== undefined) {
      const alpha = (billboardOpts.opacity !== undefined ? billboardOpts.opacity : 1) * (this.options.opacity !== undefined ? this.options.opacity : 1);
      billboard.color = this._resolveColor(billboardOpts.color, 'white').withAlpha(alpha);
    } else if (this.options.opacity !== undefined) {
      billboard.color = this._resolveColor('white', 'white').withAlpha(this.options.opacity);
    }
    if (billboardOpts.width !== undefined) billboard.width = billboardOpts.width;
    if (billboardOpts.height !== undefined) billboard.height = billboardOpts.height;
    if (billboardOpts.pixelOffset) {
      billboard.pixelOffset = new Cesium.Cartesian2(billboardOpts.pixelOffset.x, billboardOpts.pixelOffset.y);
    }
    const billboardEyeOffset = this._resolveEyeOffset(billboardOpts);
    if (billboardEyeOffset) billboard.eyeOffset = billboardEyeOffset;
    return billboard;
  }

  _buildLabel(labelOpts = {}) {
    const Cesium = this.cesium;
    const commonHOrigin = this.options.horizontalOrigin;
    const commonVOrigin = this.options.verticalOrigin;
    const fillAlpha = labelOpts.opacity !== undefined ? labelOpts.opacity : 1;
    const label = {
      text: labelOpts.text || '',
      font: labelOpts.font || '16px sans-serif',
      fillColor: this._resolveColor(labelOpts.fillColor || labelOpts.color, 'white').withAlpha(fillAlpha),
      outlineColor: this._resolveColor(labelOpts.outlineColor, 'black'),
      outlineWidth: labelOpts.outlineWidth !== undefined ? labelOpts.outlineWidth : 0,
      scale: labelOpts.scale !== undefined ? labelOpts.scale : 1,
      disableDepthTestDistance: this._resolveDisableDepthTestDistance(labelOpts),
      horizontalOrigin: this._resolveHorizontalOrigin(
        labelOpts.horizontalOrigin !== undefined ? labelOpts.horizontalOrigin : commonHOrigin,
        'CENTER'
      ),
      verticalOrigin: this._resolveVerticalOrigin(
        labelOpts.verticalOrigin !== undefined ? labelOpts.verticalOrigin : commonVOrigin,
        'BOTTOM'
      )
    };

    if (labelOpts.pixelOffset) {
      label.pixelOffset = new Cesium.Cartesian2(labelOpts.pixelOffset.x, labelOpts.pixelOffset.y);
    }
    const labelEyeOffset = this._resolveEyeOffset(labelOpts);
    if (labelEyeOffset) label.eyeOffset = labelEyeOffset;
    return label;
  }

  _resolveEyeOffset(componentOpts = {}) {
    const Cesium = this.cesium;
    const hasLayer = componentOpts.layer !== undefined;
    const hasEyeOffset = componentOpts.eyeOffset !== undefined;
    if (!hasLayer && !hasEyeOffset) return undefined;

    const layer = Number(componentOpts.layer || 0);
    const layerStep = Number(
      componentOpts.layerStep !== undefined
        ? componentOpts.layerStep
        : (this.options.layerStep !== undefined ? this.options.layerStep : 1000)
    ) || 1000;

    let x = 0;
    let y = 0;
    let z = 0;

    const eo = componentOpts.eyeOffset;
    if (Array.isArray(eo)) {
      x = Number(eo[0] || 0);
      y = Number(eo[1] || 0);
      z = Number(eo[2] || 0);
    } else if (eo && typeof eo === 'object') {
      x = Number(eo.x || 0);
      y = Number(eo.y || 0);
      z = Number(eo.z || 0);
    }

    // Cesium eye coordinates: negative z is toward camera.
    // so larger layer should be more front => subtract z.
    z -= layer * layerStep;
    return new Cesium.Cartesian3(x, y, z);
  }

  _createEntity() {
    const opts = this.options;
    const entity = {
      id: this.id,
      position: this._resolvePosition(opts.position)
    };

    if (opts.point) entity.point = this._buildPoint(opts.point);
    if (opts.billboard) entity.billboard = this._buildBillboard(opts.billboard);
    if (opts.label && !opts.composite) entity.label = this._buildLabel(opts.label);

    return entity;
  }

  _updatePosition() {
    if (this.entity) this.entity.position = this._resolvePosition(this.options.position);
  }

  _updateEntity() {
    if (!this.entity) return;
    if (this.options.position) this.entity.position = this._resolvePosition(this.options.position);

    if (this.options.point) {
      this.entity.point = this._buildPoint(this.options.point);
    }
    if (this.options.billboard) {
      this.entity.billboard = this._buildBillboard(this.options.billboard);
    }
    if (this.options.label && !this.options.composite) {
      this.entity.label = this._buildLabel(this.options.label);
    } else if (this.entity.label) {
      this.entity.label = undefined;
    }

    this._maybeComposeBillboardImage();
  }

  onAdd() {
    this._maybeComposeBillboardImage();
  }

  _maybeComposeBillboardImage() {
    if (!this.options.composite || !this.options.billboard || !this.options.label) return;
    const signature = this._getComposeSignature();
    if (signature === this._composeSignature && this._composedImage) return;
    this._composeSignature = signature;
    this._composeBillboardImage();
  }

  _getComposeSignature() {
    const b = this.options.billboard || {};
    const l = this.options.label || {};
    return JSON.stringify({
      image: b.image,
      text: l.text,
      font: l.font,
      fillColor: l.fillColor || l.color,
      outlineColor: l.outlineColor,
      outlineWidth: l.outlineWidth,
      showBackground: l.showBackground,
      backgroundColor: l.backgroundColor,
      backgroundPadding: l.backgroundPadding,
      backgroundRadius: l.backgroundRadius,
      canvasX: l.canvasX,
      canvasY: l.canvasY,
      canvasPadding: l.canvasPadding
    });
  }

  _composeBillboardImage() {
    if (typeof document === 'undefined') return;
    const billboardOpts = this.options.billboard || {};
    const labelOpts = this.options.label || {};
    const imageSrc = billboardOpts.image;
    if (!imageSrc) return;

    const token = ++this._composeToken;
    this._loadImage(imageSrc).then((img) => {
      if (token !== this._composeToken) return;
      const baseWidth = img.naturalWidth || img.width || 512;
      const baseHeight = img.naturalHeight || img.height || 128;
      const text = labelOpts.text || '';
      const font = labelOpts.font || '26px sans-serif';
      const fillColor = labelOpts.fillColor || labelOpts.color || '#ffffff';
      const outlineColor = labelOpts.outlineColor || '#000000';
      const outlineWidth = labelOpts.outlineWidth !== undefined ? labelOpts.outlineWidth : 2;
      const showBackground = labelOpts.showBackground === true || !!labelOpts.backgroundColor;
      const backgroundColor = labelOpts.backgroundColor || 'rgba(0, 0, 0, 0.5)';
      const backgroundPadding = Number(labelOpts.backgroundPadding !== undefined ? labelOpts.backgroundPadding : 6);
      const backgroundRadius = Number(labelOpts.backgroundRadius !== undefined ? labelOpts.backgroundRadius : 4);
      const x = labelOpts.canvasX !== undefined ? labelOpts.canvasX : Math.round(baseWidth * 0.33);
      const y = labelOpts.canvasY !== undefined ? labelOpts.canvasY : Math.round(baseHeight * 0.52);
      const padding = Number(labelOpts.canvasPadding !== undefined ? labelOpts.canvasPadding : 4);

      let minX = 0;
      let minY = 0;
      let maxX = baseWidth;
      let maxY = baseHeight;

      if (text) {
        // Measure text first so we can expand canvas if label sits outside the billboard image.
        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');
        if (measureCtx) {
          measureCtx.font = font;
          const textWidth = measureCtx.measureText(text).width || 0;
          const fontPx = this._extractFontPx(font);
          const extra = Math.max(0, outlineWidth) + Math.max(0, padding);
          const textLeft = x - extra;
          const textRight = x + textWidth + extra;
          const textTop = y - fontPx / 2 - extra;
          const textBottom = y + fontPx / 2 + extra;

          minX = Math.min(minX, textLeft);
          minY = Math.min(minY, textTop);
          maxX = Math.max(maxX, textRight);
          maxY = Math.max(maxY, textBottom);

          if (showBackground) {
            minX = Math.min(minX, textLeft - backgroundPadding);
            minY = Math.min(minY, textTop - backgroundPadding);
            maxX = Math.max(maxX, textRight + backgroundPadding);
            maxY = Math.max(maxY, textBottom + backgroundPadding);
          }
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.ceil(maxX - minX));
      canvas.height = Math.max(1, Math.ceil(maxY - minY));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const offsetX = -minX;
      const offsetY = -minY;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, offsetX, offsetY, baseWidth, baseHeight);

      if (text) {
        ctx.font = font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = outlineWidth;

        if (showBackground) {
          const textWidth = ctx.measureText(text).width || 0;
          const fontPx = this._extractFontPx(font);
          const boxX = x + offsetX - backgroundPadding;
          const boxY = y + offsetY - fontPx / 2 - backgroundPadding;
          const boxW = textWidth + backgroundPadding * 2;
          const boxH = fontPx + backgroundPadding * 2;
          this._drawRoundRect(ctx, boxX, boxY, boxW, boxH, backgroundRadius);
          ctx.fillStyle = backgroundColor;
          ctx.fill();
        }

        ctx.strokeStyle = outlineColor;
        ctx.fillStyle = fillColor;
        if (outlineWidth > 0) {
          ctx.strokeText(text, x + offsetX, y + offsetY);
        }
        ctx.fillText(text, x + offsetX, y + offsetY);
      }

      this._composedImage = canvas;
      if (this.entity && this.entity.billboard) {
        this.entity.billboard.image = canvas;
      }
    }).catch(() => {
      // ignore composition errors and fallback to original billboard image
    });
  }

  _loadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject(new Error('empty image src'));
        return;
      }
      if (typeof src !== 'string') {
        if (src instanceof HTMLCanvasElement || src instanceof HTMLImageElement) {
          resolve(src);
          return;
        }
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  _extractFontPx(font) {
    const matched = /([0-9]+(?:\\.[0-9]+)?)px/.exec(font || '');
    if (!matched) return 26;
    const size = Number(matched[1]);
    return Number.isFinite(size) ? size : 26;
  }

  _drawRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius || 0, width / 2, height / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }
}
