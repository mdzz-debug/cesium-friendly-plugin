import * as Cesium from 'cesium';

export default class GridWaterSurface {
  constructor(options = {}) {
    this.center = options.center || { lon: 118.02, lat: 29.512, height: 520 };
    this.size = options.size || { x: 2000.0, y: 2000.0 };
    this.segments = options.segments || { x: 64, y: 64 };
    this.amplitude = options.amplitude !== undefined ? options.amplitude : 3.0;
    this.wavelength = options.wavelength !== undefined ? options.wavelength : 400.0;
    this.speed = options.speed !== undefined ? options.speed : 0.03;
    this.baseColor = options.baseColor || new Cesium.Color(0.05, 0.3, 0.6, 0.8);
    this.shallowColor = options.shallowColor || new Cesium.Color(0.1, 0.6, 0.8, 0.9);
    this.specularColor = options.specularColor || new Cesium.Color(1.0, 1.0, 1.0, 0.7);
    this.id = options.id || 'GridWaterSurface';
    this._viewerRef = options.viewer || null;
    this._primitive = null;
  }

  _resolveViewer(viewer) {
    if (viewer) return viewer;
    if (this._viewerRef) return this._viewerRef;
    if (typeof window !== 'undefined' && window.CesiumFriendlyPlugin && typeof window.CesiumFriendlyPlugin.getViewer === 'function') {
      return window.CesiumFriendlyPlugin.getViewer();
    }
    return null;
  }

  add(viewer) {
    try {
      console.log('[GridWaterSurface] add()', { id: this.id });
    } catch (e) {}
    const v = this._resolveViewer(viewer);
    if (!v) {
      try {
        console.warn('[GridWaterSurface] add() 无法解析 viewer，是否已调用 CesiumFriendlyPlugin.init(Cesium, viewer)？', { id: this.id });
      } catch (e) {}
      return null;
    }
    try {
      console.log('[GridWaterSurface] add() 解析到 viewer', !!v);
    } catch (e) {}
    return this.addToViewer(v);
  }

  remove(viewer) {
    const v = this._resolveViewer(viewer);
    if (!v) {
      return;
    }
    this.removeFromViewer(v);
  }

  addToViewer(viewer) {
    if (!viewer || !viewer.scene) return null;
    if (this._primitive) return this._primitive;

    try {
      console.log('[GridWaterSurface] addToViewer() 开始创建', {
        id: this.id,
        center: this.center,
        size: this.size,
        amplitude: this.amplitude,
        wavelength: this.wavelength,
        speed: this.speed
      });
    } catch (e) {}

    const cesium = Cesium;
    const halfX = this.size.x * 0.5;
    const halfY = this.size.y * 0.5;

    const centerCartesian = cesium.Cartesian3.fromDegrees(
      this.center.lon,
      this.center.lat,
      this.center.height
    );
    const enu = cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);

    function offset(dx, dy) {
      const local = new cesium.Cartesian3(dx, dy, 0.0);
      return cesium.Matrix4.multiplyByPoint(enu, local, new cesium.Cartesian3());
    }

    const p1 = offset(-halfX, -halfY);
    const p2 = offset(halfX, -halfY);
    const p3 = offset(halfX, halfY);
    const p4 = offset(-halfX, halfY);

    const c1 = cesium.Cartographic.fromCartesian(p1);
    const c2 = cesium.Cartographic.fromCartesian(p2);
    const c3 = cesium.Cartographic.fromCartesian(p3);
    const c4 = cesium.Cartographic.fromCartesian(p4);

    const west = Math.min(c1.longitude, c2.longitude, c3.longitude, c4.longitude);
    const east = Math.max(c1.longitude, c2.longitude, c3.longitude, c4.longitude);
    const south = Math.min(c1.latitude, c2.latitude, c3.latitude, c4.latitude);
    const north = Math.max(c1.latitude, c2.latitude, c3.latitude, c4.latitude);

    const rectangle = new cesium.Rectangle(west, south, east, north);

    try {
      console.log('[GridWaterSurface] 计算矩形', {
        west, south, east, north
      });
    } catch (e) {}

    const segX = Math.max(1, Math.min(this.segments.x || 64, 256));
    const segY = Math.max(1, Math.min(this.segments.y || 64, 256));
    const stepX = this.size.x / segX;
    const stepY = this.size.y / segY;

    const posArray = [];
    const normArray = [];
    const stArray = [];
    const indexArray = [];

    for (let iy = 0; iy <= segY; iy++) {
      for (let ix = 0; ix <= segX; ix++) {
        const dx = -halfX + ix * stepX;
        const dy = -halfY + iy * stepY;
        const local = new cesium.Cartesian3(dx, dy, 0.0);
        const world = cesium.Matrix4.multiplyByPoint(enu, local, new cesium.Cartesian3());
        posArray.push(world.x, world.y, world.z);
        const uvx = ix / segX;
        const uvy = iy / segY;
        stArray.push(uvx, uvy);
        const n = cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(world, new cesium.Cartesian3());
        normArray.push(n.x, n.y, n.z);
      }
    }

    for (let iy = 0; iy < segY; iy++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iy * (segX + 1) + ix;
        const b = a + 1;
        const c = a + (segX + 1);
        const d = c + 1;
        indexArray.push(a, b, c, b, d, c);
      }
    }

    const geometry = new cesium.Geometry({
      attributes: {
        position: new cesium.GeometryAttribute({
          componentDatatype: cesium.ComponentDatatype.DOUBLE,
          componentsPerAttribute: 3,
          values: new Float64Array(posArray)
        }),
        normal: new cesium.GeometryAttribute({
          componentDatatype: cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 3,
          values: new Float32Array(normArray)
        }),
        st: new cesium.GeometryAttribute({
          componentDatatype: cesium.ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: new Float32Array(stArray)
        })
      },
      indices: new Uint32Array(indexArray),
      primitiveType: cesium.PrimitiveType.TRIANGLES
    });

    const boundingSphere = cesium.BoundingSphere.fromVertices(posArray);
    geometry.boundingSphere = boundingSphere;
    geometry.boundingSphereCV = boundingSphere;
    geometry.boundingSphere2D = boundingSphere;

    try {
      console.log('[GridWaterSurface] 生成网格', { vertices: posArray.length / 3, triangles: indexArray.length / 3, segX, segY });
      console.log('[GridWaterSurface] 设置包围球', { centerCartesian, radius: boundingSphere.radius });
    } catch (e) {}

    const waveAmplitude = this.amplitude;
    const waveLength = this.wavelength;
    const waveSpeed = this.speed;

    const vertexShaderSource = `
      in vec3 position3DHigh;
      in vec3 position3DLow;
      in vec3 normal;
      in vec2 st;
      in float batchId;
      out vec2 v_st;
      out float v_wave;
      void main() {
          float time = czm_frameNumber * ${waveSpeed.toFixed(6)};
          float k = 6.2831853 / ${waveLength.toFixed(1)};
          float wave1 = sin(dot(st * 4.0, vec2(1.0, 1.3)) * k + time);
          float wave2 = sin(dot(st * 3.0, vec2(-1.2, 0.8)) * k + time * 1.1);
          float wave = (wave1 + wave2) * 0.5;
          float height = wave * ${waveAmplitude.toFixed(3)};
          
          vec3 positionMC = position3DHigh + position3DLow;
          vec3 displacedMC = positionMC + normalize(normal) * height;
          
          gl_Position = czm_modelViewProjection * vec4(displacedMC, 1.0);
          v_st = st;
          v_wave = wave;
      }
    `;

    const base = this.baseColor;
    const shallow = this.shallowColor;
    const spec = this.specularColor;

    const fragmentShaderSource = `
      in vec2 v_st;
      in float v_wave;
      void main() {
          float depthFactor = clamp(v_st.y, 0.0, 1.0);
          vec3 deepColor = vec3(${base.red.toFixed(3)}, ${base.green.toFixed(3)}, ${base.blue.toFixed(3)});
          vec3 shallowColor = vec3(${shallow.red.toFixed(3)}, ${shallow.green.toFixed(3)}, ${shallow.blue.toFixed(3)});
          vec3 color = mix(shallowColor, deepColor, depthFactor);
          float intensity = 0.5 + 0.5 * v_wave;
          vec3 specColor = vec3(${spec.red.toFixed(3)}, ${spec.green.toFixed(3)}, ${spec.blue.toFixed(3)});
          color += specColor * intensity * 0.25;
          float alpha = ${base.alpha.toFixed(3)};
          out_FragColor = vec4(color, alpha);
      }
    `;

    const appearance = new cesium.Appearance({
      renderState: {
        depthTest: { enabled: true },
        blending: cesium.BlendingState.ALPHA_BLEND
      },
      vertexShaderSource,
      fragmentShaderSource,
      attributeLocations: {
        position3DHigh: 0,
        position3DLow: 1,
        normal: 2,
        st: 3,
        batchId: 4
      }
    });

    try {
      console.log('[GridWaterSurface] 创建 Appearance 完成');
    } catch (e) {}

    const instance = new cesium.GeometryInstance({
      id: this.id,
      geometry
    });

    try {
      console.log('[GridWaterSurface] 创建 GeometryInstance 完成', { id: this.id });
    } catch (e) {}

    const primitive = new cesium.Primitive({
      geometryInstances: instance,
      appearance,
      asynchronous: false
    });

    try {
      console.log('[GridWaterSurface] 创建 Primitive 完成，准备加入场景');
    } catch (e) {}

    this._primitive = viewer.scene.primitives.add(primitive);
    try {
      const count = viewer.scene.primitives.length;
      console.log('[GridWaterSurface] Primitive 已加入场景', { id: this.id, primitivesCount: count, primitive: !!this._primitive });
    } catch (e) {}
    return this._primitive;
  }

  removeFromViewer(viewer) {
    if (!viewer || !viewer.scene) return;
    if (this._primitive) {
      viewer.scene.primitives.remove(this._primitive);
      this._primitive = null;
    }
  }

  getPrimitive() {
    return this._primitive;
  }
}
