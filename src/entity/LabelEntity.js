
import { GeometryEntity } from './GeometryEntity.js';
import { getHeightListener } from '../utils/heightListener.js';

export class LabelEntity extends GeometryEntity {
  constructor(id, viewer, cesium, options = {}) {
    super(id, viewer, cesium, options);
    this.type = 'label';
    
    // Style props
    this.text = options.text || '';
    this.fontSize = options.fontSize || 14;
    this.bold = !!options.bold;
    this.font = options.font || `${this.bold ? 'bold ' : ''}${this.fontSize}px sans-serif`;
    this.style = options.style || 'FILL';
    this.color = options.color || '#FFFFFF';
    this.backgroundColor = options.backgroundColor || null;
    this.showBackground = !!options.backgroundColor;
    this.scale = options.scale || 1.0;
    this.pixelOffset = options.pixelOffset || [0, 0];
    // Default eyeOffset to slightly forward (negative Z) to ensure label is on top
    this.eyeOffset = options.eyeOffset || [0, 0, -5];
    this.horizontalOrigin = options.horizontalOrigin || 'CENTER';
    this.verticalOrigin = options.verticalOrigin || 'CENTER';
    
    // Advanced props
    this.distanceDisplayCondition = options.distanceDisplayCondition || null;
    this.scaleByDistance = options.scaleByDistance || null;
    this.translucencyByDistance = options.translucencyByDistance || null;
    this.pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance || null;
    this.disableDepthTestDistance = options.disableDepthTestDistance === false ? undefined : Number.POSITIVE_INFINITY;
    
    // Height display logic
    this.minDisplayHeight = options.minDisplayHeight !== undefined ? options.minDisplayHeight : 0;
    this.maxDisplayHeight = options.maxDisplayHeight !== undefined ? options.maxDisplayHeight : Infinity;
    
    this._heightListenerUnsubscribe = null;
    this.updateVisibilityByHeight = this.updateVisibilityByHeight.bind(this);
  }

  _createEntity() {
    const Cesium = this.cesium;
    
    // Initial Position
    const isRelative = this.heightReference === 'relativeToGround';
    const h = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0);
    const position = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], h);

    // Initial Graphics
    const labelGraphics = new Cesium.LabelGraphics({
        text: this.text,
        font: this.font,
        style: Cesium.LabelStyle[this.style] || Cesium.LabelStyle.FILL,
        fillColor: Cesium.Color.fromCssColorString(this.color),
        showBackground: this.showBackground,
        backgroundColor: this.backgroundColor ? Cesium.Color.fromCssColorString(this.backgroundColor) : undefined,
        scale: this.scale,
        pixelOffset: new Cesium.Cartesian2(this.pixelOffset[0], this.pixelOffset[1]),
        eyeOffset: new Cesium.Cartesian3(this.eyeOffset[0], this.eyeOffset[1], this.eyeOffset[2]),
        horizontalOrigin: this._getHorizontalOrigin(this.horizontalOrigin),
        verticalOrigin: this._getVerticalOrigin(this.verticalOrigin),
        heightReference: this._getHeightReferenceEnum(),
        distanceDisplayCondition: this.distanceDisplayCondition,
        scaleByDistance: this.scaleByDistance,
        translucencyByDistance: this.translucencyByDistance,
        pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance,
        disableDepthTestDistance: this.disableDepthTestDistance
    });

    const entity = new Cesium.Entity({
        id: this.id,
        name: this.name,
        description: this.description,
        position: position,
        label: labelGraphics
    });
    
    // Attach metadata
    entity._meta = { ...this.options };

    return entity;
  }
  
  
  // --- Lifecycle Override for Height Check ---
  
  // add() is handled by BaseEntity which iterates collection and calls _mount()
  // _mount() calls _enableHeightCheck() so we don't need to override add() here anymore.
  
  destroy() {
      this._disableHeightCheck();
      super.destroy();
  }

  // --- Style Setters ---

  setText(text) {
    this.text = text;
    if (this.entity && this.entity.label) {
      this.entity.label.text = text;
    }
    return this;
  }

  setFont(font) {
    this.font = font;
    if (this.entity && this.entity.label) {
      this.entity.label.font = font;
    }
    return this;
  }

  setFontSize(size) {
    this.fontSize = size;
    this.font = `${this.bold ? 'bold ' : ''}${size}px sans-serif`;
    return this.setFont(this.font);
  }

  setBold(enable) {
    this.bold = !!enable;
    this.font = `${this.bold ? 'bold ' : ''}${this.fontSize}px sans-serif`;
    return this.setFont(this.font);
  }

  setColor(color) {
    this.color = color;
    if (this.entity && this.entity.label) {
      this.entity.label.fillColor = this.cesium.Color.fromCssColorString(color);
    }
    return this;
  }

  // Alias for backward compatibility or clarity
  setFillColor(color) {
    return this.setColor(color);
  }

  setOutlineColor(color) {
    this.outlineColor = color;
    if (this.entity && this.entity.label) {
        this.entity.label.outlineColor = this.cesium.Color.fromCssColorString(color);
    }
    return this;
  }

  setOutlineWidth(width) {
    this.outlineWidth = width;
    if (this.entity && this.entity.label) {
        this.entity.label.outlineWidth = width;
    }
    return this;
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
    this.showBackground = !!color;
    if (this.entity && this.entity.label) {
      if (color) {
        this.entity.label.showBackground = true;
        this.entity.label.backgroundColor = this.cesium.Color.fromCssColorString(color);
      } else {
        this.entity.label.showBackground = false;
      }
    }
    return this;
  }

  setScale(scale) {
    this.scale = scale;
    if (this.entity && this.entity.label) {
      this.entity.label.scale = scale;
    }
    return this;
  }
  
  setPixelOffset(x, y) {
    this.pixelOffset = [x, y];
    if (this.entity && this.entity.label) {
        this.entity.label.pixelOffset = new this.cesium.Cartesian2(x, y);
    }
    return this;
  }

  setEyeOffset(x, y, z) {
    this.eyeOffset = [x, y, z];
    if (this.entity && this.entity.label) {
        this.entity.label.eyeOffset = new this.cesium.Cartesian3(x, y, z);
    }
    return this;
  }
  
  setDisableDepthTestDistance(distance) {
    if (distance === true) {
        this.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    } else if (distance === false) {
        this.disableDepthTestDistance = undefined;
    } else {
        this.disableDepthTestDistance = distance;
    }

    if (this.entity && this.entity.label) {
        this.entity.label.disableDepthTestDistance = this.disableDepthTestDistance;
    }
    return this;
  }

  setStyle(style) {
    this.style = style;
    if (this.entity && this.entity.label) {
        this.entity.label.style = this.cesium.LabelStyle[style] || this.cesium.LabelStyle.FILL;
    }
    return this;
  }

  setHorizontalOrigin(origin) {
    this.horizontalOrigin = origin;
    if (this.entity && this.entity.label) {
      this.entity.label.horizontalOrigin = this._getHorizontalOrigin(origin);
    }
    return this;
  }

  setVerticalOrigin(origin) {
    this.verticalOrigin = origin;
    if (this.entity && this.entity.label) {
      this.entity.label.verticalOrigin = this._getVerticalOrigin(origin);
    }
    return this;
  }

  setDistanceDisplayCondition(near, far) {
    this.distanceDisplayCondition = { near, far };
    if (this.entity && this.entity.label) {
        this.entity.label.distanceDisplayCondition = new this.cesium.DistanceDisplayCondition(near, far);
    }
    return this;
  }

  setScaleByDistance(near, nearValue, far, farValue) {
    this.scaleByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.label) {
        this.entity.label.scaleByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setTranslucencyByDistance(near, nearValue, far, farValue) {
    this.translucencyByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.label) {
        this.entity.label.translucencyByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  setPixelOffsetScaleByDistance(near, nearValue, far, farValue) {
    this.pixelOffsetScaleByDistance = { near, nearValue, far, farValue };
    if (this.entity && this.entity.label) {
        this.entity.label.pixelOffsetScaleByDistance = new this.cesium.NearFarScalar(near, nearValue, far, farValue);
    }
    return this;
  }

  // --- Height Display Logic ---

  setDisplayHeightRange(min, max) {
    this.minDisplayHeight = min !== undefined ? min : 0;
    this.maxDisplayHeight = max !== undefined ? max : Infinity;
    this._enableHeightCheck();
    return this;
  }

  updateVisibilityByHeight(cameraHeight) {
    if (!this.entity) return;
    const visible = cameraHeight >= this.minDisplayHeight && cameraHeight <= this.maxDisplayHeight;
    if (this.entity.show !== visible) {
        this.entity.show = visible;
    }
  }

  _enableHeightCheck() {
    this._disableHeightCheck();

    // If default (always visible)
    if ((this.minDisplayHeight <= 0 && this.maxDisplayHeight === Infinity) || 
        (this.minDisplayHeight === 0 && this.maxDisplayHeight === 0)) {
        if (this.entity) this.entity.show = true;
        return;
    }

    if (this.viewer && this.cesium) {
        const hl = getHeightListener(this.viewer, this.cesium);
        this._heightListenerUnsubscribe = hl.subscribe(this.updateVisibilityByHeight);

        // Immediate check
        try {
            const camera = this.viewer.camera;
            if (camera && camera.position) {
                const cartographic = this.cesium.Cartographic.fromCartesian(camera.position);
                if (cartographic) {
                    this.updateVisibilityByHeight(cartographic.height);
                }
            }
        } catch (e) {
            // Ignore potential initial errors
        }
    }
  }

  _disableHeightCheck() {
    if (this._heightListenerUnsubscribe) {
      this._heightListenerUnsubscribe();
      this._heightListenerUnsubscribe = null;
    }
  }

  // --- State ---

  saveState() {
    this._savedState = {
      text: this.text,
      font: this.font,
      fontSize: this.fontSize,
      bold: this.bold,
      color: this.color,
      backgroundColor: this.backgroundColor,
      scale: this.scale,
      pixelOffset: this.pixelOffset,
      eyeOffset: this.eyeOffset,
      minDisplayHeight: this.minDisplayHeight,
      maxDisplayHeight: this.maxDisplayHeight
    };
    return this;
  }

  restoreState() {
    if (this._savedState) {
      const s = this._savedState;
      this.setText(s.text);
      this.setFont(s.font); // This might conflict with fontSize/bold setters if called out of order, but fine for now
      this.fontSize = s.fontSize;
      this.bold = s.bold;
      this.setColor(s.color);
      this.setBackgroundColor(s.backgroundColor);
      this.setScale(s.scale);
      this.setPixelOffset(s.pixelOffset[0], s.pixelOffset[1]);
      this.setEyeOffset(s.eyeOffset[0], s.eyeOffset[1], s.eyeOffset[2]);
      this.setDisplayHeightRange(s.minDisplayHeight, s.maxDisplayHeight);
      this._savedState = null;
    }
    return this;
  }
}
