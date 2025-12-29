
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
    this.outlineColor = options.outlineColor || '#000000';
    this.outlineWidth = options.outlineWidth || 1.0;
    this.backgroundColor = options.backgroundColor || null;
    this.showBackground = options.showBackground !== undefined ? !!options.showBackground : !!options.backgroundColor;
    this.scale = options.scale !== undefined ? options.scale : 1.0;
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
    const h = isRelative ? (this.heightOffset || 0) : (this.position[2] || 0) + (this.heightOffset || 0);
    const position = Cesium.Cartesian3.fromDegrees(this.position[0], this.position[1], h);

    // Initial Graphics
    const labelGraphics = new Cesium.LabelGraphics({
        text: this.text,
        font: this.font,
        style: Cesium.LabelStyle[this.style] || Cesium.LabelStyle.FILL,
        fillColor: Cesium.Color.fromCssColorString(this.color),
        outlineColor: Cesium.Color.fromCssColorString(this.outlineColor),
        outlineWidth: this.outlineWidth,
        showBackground: this.showBackground,
        backgroundColor: this.backgroundColor ? Cesium.Color.fromCssColorString(this.backgroundColor) : undefined,
        scale: this.scale,
        pixelOffset: new Cesium.Cartesian2(this.pixelOffset[0], this.pixelOffset[1]),
        eyeOffset: new Cesium.Cartesian3(this.eyeOffset[0], this.eyeOffset[1], this.eyeOffset[2]),
        horizontalOrigin: this._getHorizontalOrigin(this.horizontalOrigin),
        verticalOrigin: this._getVerticalOrigin(this.verticalOrigin),
        heightReference: this._getHeightReferenceEnum(),
        distanceDisplayCondition: this.distanceDisplayCondition ? 
            new Cesium.DistanceDisplayCondition(this.distanceDisplayCondition.near, this.distanceDisplayCondition.far) : undefined,
        scaleByDistance: this.scaleByDistance ? new Cesium.NearFarScalar(
            this.scaleByDistance.near, 
            this.scaleByDistance.nearValue, 
            this.scaleByDistance.far, 
            this.scaleByDistance.farValue
        ) : undefined,
        translucencyByDistance: this.translucencyByDistance ? new Cesium.NearFarScalar(
            this.translucencyByDistance.near, 
            this.translucencyByDistance.nearValue, 
            this.translucencyByDistance.far, 
            this.translucencyByDistance.farValue
        ) : undefined,
        pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance ? new Cesium.NearFarScalar(
            this.pixelOffsetScaleByDistance.near, 
            this.pixelOffsetScaleByDistance.nearValue, 
            this.pixelOffsetScaleByDistance.far, 
            this.pixelOffsetScaleByDistance.farValue
        ) : undefined,
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
  
  delete() {
      this._disableHeightCheck();
      super.delete();
  }

  // --- Style Setters ---

  setText(text) {
    this.text = text;
    if (this.entity && this.entity.label) {
      this.entity.label.text = text;
    }
    this.trigger('change', this);
    return this;
  }

  setFont(font) {
    this.font = font;
    if (this.entity && this.entity.label) {
      this.entity.label.font = font;
    }
    this.trigger('change', this);
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
    this.trigger('change', this);
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
    this.trigger('change', this);
    return this;
  }

  setOutlineWidth(width) {
    const val = parseFloat(width);
    this.outlineWidth = isNaN(val) ? 1.0 : val;
    if (this.entity && this.entity.label) {
      this.entity.label.outlineWidth = this.outlineWidth;
    }
    this.trigger('change', this);
    return this;
  }

  setShowBackground(show) {
    this.showBackground = !!show;
    if (this.entity && this.entity.label) {
      this.entity.label.showBackground = this.showBackground;
    }
    this.trigger('change', this);
    return this;
  }

  setBackgroundColor(color) {
    this.backgroundColor = color;
    // If color is provided, we default showBackground to true, 
    // unless user explicitly sets it to false later (but here we couple it for convenience)
    // However, to allow independent control, we should only set it to true if it was false?
    // Standard behavior: setting color implies you want to see it.
    this.showBackground = !!color;
    if (this.entity && this.entity.label) {
        if (color) {
            this.entity.label.showBackground = true;
            this.entity.label.backgroundColor = this.cesium.Color.fromCssColorString(color);
        } else {
            this.entity.label.showBackground = false;
        }
    }
    this.trigger('change', this);
    return this;
  }

  setStyle(style) {
    this.style = style;
    if (this.entity && this.entity.label && this.cesium && this.cesium.LabelStyle) {
        const styleEnum = this.cesium.LabelStyle[style];
        this.entity.label.style = styleEnum !== undefined ? styleEnum : this.cesium.LabelStyle.FILL;
    }
    this.trigger('change', this);
    return this;
  }

  // --- Height Display Logic ---

  setDisplayHeightRange(min, max) {
    if (Array.isArray(min)) {
        max = min[1];
        min = min[0];
    } else if (typeof min === 'object' && min !== null) {
        max = min.max;
        min = min.min;
    }

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
      style: this.style,
      color: this.color,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      backgroundColor: this.backgroundColor,
      showBackground: this.showBackground,
      scale: this.scale !== undefined ? this.scale : 1.0,
      pixelOffset: this.pixelOffset ? [...this.pixelOffset] : [0,0],
      eyeOffset: this.eyeOffset ? [...this.eyeOffset] : [0,0,0],
      horizontalOrigin: this.horizontalOrigin,
      verticalOrigin: this.verticalOrigin,
      heightReference: this.heightReference,
      heightOffset: this.heightOffset,
      distanceDisplayCondition: this.distanceDisplayCondition ? {...this.distanceDisplayCondition} : undefined,
      scaleByDistance: this.scaleByDistance ? {...this.scaleByDistance} : undefined,
      translucencyByDistance: this.translucencyByDistance ? {...this.translucencyByDistance} : undefined,
      pixelOffsetScaleByDistance: this.pixelOffsetScaleByDistance ? {...this.pixelOffsetScaleByDistance} : undefined,
      disableDepthTestDistance: this.disableDepthTestDistance,
      minDisplayHeight: this.minDisplayHeight,
      maxDisplayHeight: this.maxDisplayHeight
    };
    return this;
  }

  restoreState(duration = 0) {
    if (this._savedState) {
      const s = this._savedState;
      const options = {
          text: s.text,
          font: s.font,
          fontSize: s.fontSize,
          bold: s.bold,
          style: s.style,
          color: s.color,
          outlineColor: s.outlineColor,
          outlineWidth: s.outlineWidth,
          backgroundColor: s.backgroundColor,
          showBackground: s.showBackground,
          
          scale: s.scale,
          pixelOffset: s.pixelOffset,
          eyeOffset: s.eyeOffset,
          horizontalOrigin: s.horizontalOrigin,
          verticalOrigin: s.verticalOrigin,
          
          heightReference: s.heightReference,
          height: s.heightOffset,
          
          distanceDisplayCondition: s.distanceDisplayCondition || null,
          scaleByDistance: s.scaleByDistance || null,
          translucencyByDistance: s.translucencyByDistance || null,
          pixelOffsetScaleByDistance: s.pixelOffsetScaleByDistance || null,
          disableDepthTestDistance: s.disableDepthTestDistance,
          
          displayHeightRange: [s.minDisplayHeight, s.maxDisplayHeight]
      };
      
      this.update(options, duration);
      this._savedState = null;
    }
    return this;
  }
}
