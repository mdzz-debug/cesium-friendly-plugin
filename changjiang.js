import { EarthManager } from '@/earth/manager.js'
import * as Cesium from 'cesium'
import w from '@/earth/assets/boundary.png'
import w1 from '@/earth/assets/w.png'
// 引入自定义材质
import RoadThroughLine from '@/earth/utils/RoadThroughLine'
import DoubleRoadThroughLine from '@/earth/utils/DoubleRoadThroughLine'
import TripleRoadThroughLine from '@/earth/utils/TripleRoadThroughLine'
import waterNormals from '@/earth/assets/waterNormals.jpg'
import { useBaseScenePointManager } from '@/earth/scenes/base/pointManager.js'
// import * as shapefile from 'shapefile'
const { zoomToCoords } = useBaseScenePointManager()

const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'

const 长江流域轮廓 = `${baseUrl}earth/data/geojson/长江流域轮廓.geojson`
const 长江轮廓 = `${baseUrl}earth/data/geojson/长江流域轮廓-polyline.geojson`
const 长江流域干流 = `${baseUrl}earth/data/geojson/长江流域干流.geojson`
const 长江流域支流 = `${baseUrl}earth/data/geojson/长江流域支流.geojson`
const 长江流域湖泊 = `${baseUrl}earth/data/geojson/长江流域湖泊.geojson`
const 长江流域地级市 = `${baseUrl}earth/data/geojson/长江流域地级市.geojson`
const 长江流域干流_loaded = `${baseUrl}earth/data/geojson/长江流域干流_loaded.geojson`
const 长江流域支流_loaded1 = `${baseUrl}earth/data/geojson/cjlyRiverLevel1.json`
const 长江流域支流_loaded2 = `${baseUrl}earth/data/geojson/cjlyRiverLevel2_merged_sorted_reversed.geojson`
const 长江流域支流_loaded3 = `${baseUrl}earth/data/geojson/cjlyRiverLevel3.json`
const 长江流域干流_面 = `${baseUrl}earth/data/geojson/长江流域干流_面.geojson`
const 长江流域_polygon = `${baseUrl}earth/data/geojson/长江流域_polygon.geojson`
const 长江主干流域 = `${baseUrl}earth/data/geojson/new/changjiang.geojson`
// const 长江主干流域SHP = `${baseUrl}earth/data/geojson/new/changjiang.shp`
// const 长江主干流域_merged = `${baseUrl}earth/data/geojson/new/changjiang_merged.geojson`
const 长江主干流域_merged = `${baseUrl}earth/data/geojson/new/xinchangjiang.geojson`

const 引江济淮 = `${baseUrl}earth/data/geojson/new/yinjiangjihuai.geojson`
const 运河 = `${baseUrl}earth/data/geojson/new/yunhe.geojson`
const 支流 = `${baseUrl}earth/data/geojson/new/zhiliu.geojson`
const 引江济淮_merged = `${baseUrl}earth/data/geojson/new/yinjiangjihuai_merged.geojson`
const 运河_merged = `${baseUrl}earth/data/geojson/new/yunhe_merged.geojson`
const 支流_merged = `${baseUrl}earth/data/geojson/new/zhiliu_merged.geojson`

// 新增河流
const 鄱阳湖 = `${baseUrl}earth/data/geojson/new/鄱阳湖.geojson`
const 沱江 = `${baseUrl}earth/data/geojson/new/tuojiang.geojson`
const 藕池河 = `${baseUrl}earth/data/geojson/new/ouchihe.geojson`
const 华容河 = `${baseUrl}earth/data/geojson/new/huaronghe.geojson`
const 荆汉运河 = `${baseUrl}earth/data/geojson/new/荆汉运河.json`



import { registerAnimatedLineMaterial, createAnimatedLineFromGeoJson } from '@/earth/utils/animatedLine'
import { sleep } from '@/utils/tool'
import { useMaskManager } from '@/earth/utils/mask.js'
import { zoomToHeight } from '@/earth/utils/zoomUtils.js'
import { useEarthUiStore } from '@/stores/earth-ui.js'

const maskManager = useMaskManager()
const { registerSlot, showSlot, clearAllSlots } = useBaseScenePointManager()
let animatedLineInstance = null
let animatedLineDataSource = null
let animatedLineSlotEntity = null

// Chaikin 平滑（插点）——对经纬度点数组进行细分以获得更圆润的线
// 输入: points: [[lng, lat], ...]
// iterations: 细分次数（每次将点数量近似翻倍）
function chaikinSmooth(points, iterations = 2) {
  if (!points || points.length < 2) return points
  let pts = points.map(p => [p[0], p[1]])
  for (let it = 0; it < iterations; it++) {
    const newPts = []
    newPts.push(pts[0]) // 保留起点
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const q = [p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25]
      const r = [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]
      newPts.push(q)
      newPts.push(r)
    }
    newPts.push(pts[pts.length - 1]) // 保留终点
    pts = newPts
  }
  return pts
}

// Helper to fetch GeoJSON
const fetchJson = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`Failed to fetch GeoJSON from ${url}:`, e);
    return null;
  }
};

const river = {
  async show() {
    const viewer = await EarthManager.getViewer()
    try {
      let geojson = 长江流域干流 //gcoord.transform(changjiangGeoJson, gcoord.GCJ02, gcoord.WGS84);
      // 需要设置zindex
      const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
        // stroke: Cesium.Color.fromCssColorString('red'),
        strokeWidth: 0, // 增大线宽
        fill: Cesium.Color.fromCssColorString('#9bfff6').withAlpha(0), // 更不透明
        clampToGround: true,
      })
      // 设置zIndex，GeoJsonDataSource加载后可对entities遍历设置zIndex
      dataSource.entities.values.forEach(entity => {
        entity.zIndex = 1111

        // 设置多边形样式
        if (entity.polygon) {
          entity.polygon.material = Cesium.Color.fromCssColorString('#2c55bf')
          entity.polygon.outline = false
          entity.polygon.outlineColor = Cesium.Color.fromCssColorString('#06b6d4')
          entity.polygon.outlineWidth = 10
          entity.polygon.height = 0
          entity.polygon.extrudedHeight = 0
        }
      })
      viewer.dataSources.add(dataSource)
      return dataSource

      // viewer.flyTo(dataSource, { duration: 1 })

      // viewer.flyTo(dataSource, { duration: 1 }).then(() => {
      //   const defaultPositionConfig = {
      //     lng: 112.52926067822314,
      //     lat: 28.274302020449273,
      //     height: 974488.2737824006,
      //     useHeight: true,
      //     pitch: -0.7065683147924093,
      //     roll: 0.00012097887581052902,
      //     heading: 6.1899125146607,
      //   }
        
      //   zoomToCoords(defaultPositionConfig.lng, defaultPositionConfig.lat, defaultPositionConfig.height, defaultPositionConfig)
      // })

    } catch (error) {
      // console.error('显示长江数据失败:', error.message)
    }
  },
  
  async setColor(hex) {
    try {
      const color = Cesium.Color.fromCssColorString(hex)
      const baseColor = color.withAlpha(0.7)
      const blendColor = color.withAlpha(0.22)
      if (this._primitive && !this._primitive.isDestroyed?.()) {
        const material = this._primitive.appearance?.material
        if (material && material.uniforms) {
          if (material.uniforms.baseWaterColor) material.uniforms.baseWaterColor = baseColor
          if (material.uniforms.blendColor) material.uniforms.blendColor = blendColor
        }
      }
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        const outlineMat = this._outlinePrimitive.appearance?.material
        if (outlineMat && outlineMat.uniforms) {
          if (outlineMat.uniforms.color) outlineMat.uniforms.color = color
        }
      }
    } catch (e) {}
  },
  // 使用已处理好的 geojson 长江流域干流_loaded 绘制一条宽线，保留原有 show() 不变
  async showLoadedLine() {
    const viewer = await EarthManager.getViewer()
    try {
      const dataSource = await Cesium.GeoJsonDataSource.load(长江流域干流_loaded, {
        clampToGround: true,
        strokeWidth: 0,
      })
      viewer.dataSources.add(dataSource)

      // 给每条 polyline 设置宽度与发光材质，使用 GEODESIC 平滑线路
      dataSource.entities.values.forEach(entity => {
        if (entity.polyline) {
          // 确保渲染在上层
          entity.zIndex = 9999
          // 更宽的线以提高可见性
          entity.polyline.width = 14
          // 使用圆角拐点
          entity.polyline.cornerType = Cesium.CornerType.ROUNDED
          // 在地形上贴合
          entity.polyline.clampToGround = true
          entity.polyline.arcType = Cesium.ArcType.GEODESIC
          // 发光材质：降低 glowPower 值以增强发光效果（0 最亮）
          entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
            color: Cesium.Color.fromCssColorString('#00ffff').withAlpha(1.0),
            glowPower: 0.08,
          })
        }
      })

      // 飞到这个数据源
      viewer.flyTo(dataSource, { duration: 1 })
    } catch (error) {
      // console.error('显示已加载长江干流失败:', error.message)
    }
  },
  // 使用 CorridorGeometry 绘制实体带（以米为单位），cornerType 为 ROUNDED 以获得更圆润的连接处
  async showLoadedRounded(options = {}) {
    const viewer = await EarthManager.getViewer()
    try {
      const { widthMeters = 2000, glowFactor = 1.6 } = options

      // 解析 GeoJSON，创建 Corridor Geometry 实例数组
      const instances = []
      const glowInstances = []
      // 保存中线坐标，用于创建 PolylineGlow 覆盖层（像素宽）
      const glowPaths = []

      const geo = await fetchJson(长江流域干流_loaded)
      if (geo && geo.features) {
        geo.features.forEach(feature => {
          if (feature.geometry && feature.geometry.type === 'LineString') {
            let coords = feature.geometry.coordinates
            // 如果需要插点平滑，可通过 options.smoothIterations 控制迭代次数
            const smoothIterations = options.smoothIterations || 0
            if (smoothIterations > 0) {
              // coords 可能是 [ [lng,lat], ... ]
              coords = chaikinSmooth(coords, smoothIterations)
            }
            if (!coords || coords.length < 2) return
            const positions = Cesium.Cartesian3.fromDegreesArray(coords.flat(Infinity))

            const corridor = new Cesium.CorridorGeometry({
              positions: positions,
              width: widthMeters,
              cornerType: Cesium.CornerType.ROUNDED,
              vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            })

            const instance = new Cesium.GeometryInstance({
              geometry: corridor,
            })
            instances.push(instance)

            // glow instance (wider, translucent)
            const glowCorridor = new Cesium.CorridorGeometry({
              positions: positions,
              width: widthMeters * glowFactor,
              cornerType: Cesium.CornerType.ROUNDED,
              vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
            })
            glowInstances.push(new Cesium.GeometryInstance({ geometry: glowCorridor }))
            // 保存中线坐标，用于 PolylineGlow 覆盖层
            glowPaths.push(coords)
          }
        })
      }

      // 颜色与材质
      const mainColor = options.color || Cesium.Color.fromCssColorString('#00ffff').withAlpha(1.0)
      const glowColor = options.glowColor || mainColor.withAlpha(Math.max(0.12, (mainColor.alpha || 1) * 0.18))

      // 主体带（可根据 alpha 决定是否半透明）
      if (instances.length > 0) {
        const primitive = new Cesium.Primitive({
          geometryInstances: instances,
          appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Color', {
              color: mainColor,
            }),
            translucent: !!(mainColor && mainColor.alpha < 1.0),
          }),
          asynchronous: false,
        })
        viewer.scene.primitives.add(primitive)
      }

      // 发光层（半透明）
      if (glowInstances.length > 0) {
        const glowPrimitive = new Cesium.Primitive({
          geometryInstances: glowInstances,
          appearance: new Cesium.MaterialAppearance({
            material: Cesium.Material.fromType('Color', {
              color: glowColor,
            }),
            translucent: true,
          }),
          asynchronous: false,
        })
        viewer.scene.primitives.add(glowPrimitive)
      }

      // 额外添加基于中线的 PolylineGlow 覆盖层以增强发光效果
      if (glowPaths.length > 0) {
        glowPaths.forEach(pathCoords => {
          try {
            const positions = Cesium.Cartesian3.fromDegreesArray(pathCoords.flat(Infinity))
            const widthPx = Math.min(160, Math.max(8, Math.round((widthMeters || 2000) / 200)))
            viewer.entities.add({
              polyline: {
                positions: positions,
                width: widthPx,
                clampToGround: true,
                material: new Cesium.PolylineGlowMaterialProperty({
                  color: options.glowColor || glowColor,
                  glowPower: 0.06,
                }),
                cornerType: Cesium.CornerType.ROUNDED,
              }
            })
          } catch (e) {
            // ignore malformed path
          }
        })
      }

      // 可选：叠加流动动画（使用已有的 createAnimatedLineFromGeoJson）
      if (options.flow) {
        try {
          // 清理旧动画
          await removeAnimatedLine()
          registerAnimatedLineMaterial(Cesium)

          // deep copy geojson
          const cleanGeo = geo ? JSON.parse(JSON.stringify(geo)) : null
          if (cleanGeo) {
            // 添加数据源（用于 camera 或管理）
            animatedLineDataSource = await Cesium.GeoJsonDataSource.load(cleanGeo, { strokeWidth: 0 })
            viewer.dataSources.add(animatedLineDataSource)

            // 创建动画线
            const flowResult = createAnimatedLineFromGeoJson(viewer, Cesium, cleanGeo, {
              width: options.flowWidth || 6,
              color: options.flowColor || (options.color || Cesium.Color.fromCssColorString('#00ffff')),
              duration: options.flowDuration || 8,
              autoStart: true,
              emissionStrength: options.emissionStrength || 1.6,
              clampToGround: true,
              loop: options.flowLoop !== false,
            })
            animatedLineInstance = flowResult
            viewer.clock.shouldAnimate = true
          }
        } catch (e) {
          // ignore
        }
      }

      // 可选：飞到数据中点
      try {
        if (options.autoFly && geo) {
          const firstFeature = geo.features && geo.features[0]
          if (firstFeature && firstFeature.geometry && firstFeature.geometry.coordinates) {
            const coords = firstFeature.geometry.coordinates
            const mid = Math.floor(coords.length / 2)
            const midCoord = coords[mid] || coords[0]
            viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(midCoord[0], midCoord[1], (widthMeters * 0.5) + 2000), duration: 1 })
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      // console.error('显示带状圆润长江干流失败:', error.message)
    }
  },
}

// 移除已创建的长江动画线，供模式切换时调用
async function removeAnimatedLine() {
  if (!animatedLineInstance && !animatedLineDataSource && !animatedLineSlotEntity) return

  const viewer = await EarthManager.getViewer()

  if (animatedLineInstance?.control) {
    animatedLineInstance.control.remove()
  }
  animatedLineInstance = null

  if (animatedLineDataSource) {
    viewer.dataSources.remove(animatedLineDataSource, true)
    animatedLineDataSource = null
  }

  if (animatedLineSlotEntity) {
    viewer.entities.remove(animatedLineSlotEntity)
    animatedLineSlotEntity = null
  }

  clearAllSlots()
  viewer.clock.shouldAnimate = false
}

const createAnimatedLine = async (options = {}) => {
  const { slot, duration } = options

  // 先清理可能存在的旧动画
  await removeAnimatedLine()

  registerAnimatedLineMaterial(Cesium)

  const viewer = await EarthManager.getViewer()
  let animatedLineDataSource = await Cesium.GeoJsonDataSource.load(长江流域干流_loaded, {
    strokeWidth: 0
  })
  viewer.dataSources.add(animatedLineDataSource)
  viewer.flyTo(animatedLineDataSource, { duration: 1})
  
  const fetchedGeo = await fetchJson(长江流域干流_loaded);

  // 深拷贝 GeoJSON 数据，确保是纯数据对象（避免 Worker postMessage 序列化错误）
  const cleanGeoJson = fetchedGeo ? JSON.parse(JSON.stringify(fetchedGeo)) : null
  if (!cleanGeoJson) return;

  // 从 GeoJSON 提取坐标用于 flyTo
  let flyToCoordinates = []
  if (cleanGeoJson.features && cleanGeoJson.features.length > 0) {
    const firstFeature = cleanGeoJson.features[0]
    if (firstFeature.geometry && firstFeature.geometry.coordinates) {
      const coords = firstFeature.geometry.coordinates
      // 取中点坐标
      const midIndex = Math.floor(coords.length / 2)
      flyToCoordinates = coords[midIndex] || coords[0]
    }
  }
  
  const sub1 = await fetchJson(长江流域支流_loaded1);
  const sub2 = await fetchJson(长江流域支流_loaded2);
  const sub3 = await fetchJson(长江流域支流_loaded3);

  // 深拷贝副线程 GeoJSON 数据，确保是纯数据对象
  const subLineGeoJsonArray1 = []
  if (sub1 && sub1.features) {
    sub1.features.forEach(subFeature => {
      if (subFeature.geometry && (subFeature.geometry.type === 'LineString' || subFeature.geometry.type === 'MultiLineString')) {
        // 深拷贝每个 feature，确保是纯数据
        // subFeature.coordinates = subFeature.coordinates[0]
        subLineGeoJsonArray1.push(JSON.parse(JSON.stringify(subFeature)))
      }
    })
  }

  // 第二个分支
  const subLineGeoJsonArray2 = []
  if (sub2 && sub2.features) {
    sub2.features.forEach(subFeature => {
      if (subFeature.geometry && (subFeature.geometry.type === 'LineString' || subFeature.geometry.type === 'MultiLineString')) {
        // 深拷贝每个 feature，确保是纯数据
        // subFeature.coordinates = subFeature.coordinates[0]
        subLineGeoJsonArray2.push(JSON.parse(JSON.stringify(subFeature)))
      }
    })
  }

  // 第三个分支
  const subLineGeoJsonArray3 = []
  if (sub3 && sub3.features) {
    sub3.features.forEach(subFeature => {
      if (subFeature.geometry && (subFeature.geometry.type === 'LineString' || subFeature.geometry.type === 'MultiLineString')) {
        // 深拷贝每个 feature，确保是纯数据
        // subFeature.coordinates = subFeature.coordinates[0]
        subLineGeoJsonArray3.push(JSON.parse(JSON.stringify(subFeature)))
      }
    })
  }

  // 构建副线程配置数组，将三个分支都添加进去
  const subLinesConfig = []
  
  // 第二个分支
  if (subLineGeoJsonArray2.length > 0) {
    subLinesConfig.push({
      geoJson: subLineGeoJsonArray2, // 副线程 geoJson 数组
      triggerDistance: 50000000, // 主线程动画点距离副线程起点5公里时触发副线程
      width: 2, // 副线程宽度
      color: '#FFC526', // 副线程颜色（金色）
      duration: 1.2, // 副线程动画时长
      emissionStrength: 1.5, // 副线程发光强度
      autoStart: true,
      loop: false, // 副线程不循环，只走一次
      clampToGround: true,
    })
  }

  const lineResult = createAnimatedLineFromGeoJson(
    viewer,
    Cesium,
    cleanGeoJson, // 使用清理后的纯数据 GeoJSON
    {
      width: 6,
      color: '#00eaff', // 霓虹青色 - 主线程颜色
      duration: duration,
      autoStart: true,
      emissionStrength: 1.8, // 增强发光效果
      clampToGround: true,
      subLines: subLinesConfig,
      loop: true,
      onProgress: (progress) => {
        // 主线程进度监听（每10%打印一次，减少日志）
        const progressPercent = Math.floor(progress * 10) * 10
        if (progressPercent % 10 === 0 && progress > 0) {
          // console.log('主线程进度:', progressPercent + '%')
        }
      },
      onComplete: () => {
        console.log('动画完成！');
        // 可以在这里执行完成后的操作
        // maskManager.hide()
      }
    }
  )

  // 如果传入了插槽配置，在河流中点落一个不可见锚点并展示插槽
  if (slot && flyToCoordinates.length >= 2) {
    const [lng, lat, height = 0] = flyToCoordinates
    animatedLineSlotEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      point: {
        pixelSize: 1,
        color: Cesium.Color.TRANSPARENT,
        outlineWidth: 0
      },
      show: true
    })
    registerSlot(animatedLineSlotEntity, slot)
    await showSlot(animatedLineSlotEntity)
  }

  animatedLineInstance = lineResult
  return lineResult
}

const boundary = {
  _entities: [],
  _removeListener: null,
  async show() {
    try {
      const viewer = await EarthManager.getViewer()

      const geo = await fetchJson(长江流域轮廓)
      getFeatures(geo, viewer)

      const material = new RoadThroughLine(3000, w)

      const dataSource = await Cesium.GeoJsonDataSource.load(长江轮廓)
      viewer.dataSources.add(dataSource)
      // return
      const entities = dataSource.entities.values
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i]

        entity.polyline.material = material
        entity.polyline.width = 2
      }

      viewer.dataSources.add(dataSource)
    } catch (error) {
      // console.error('显示长江流域轮廓失败:', error.message)
    }
  },
  async showWall(limitHeight = 0) {
    if (this._entities.length > 0) return
    try {
      const viewer = await EarthManager.getViewer()
      const geo = await fetchJson(长江流域轮廓)
      if (!geo || !geo.features) return

      // 创建渐变纹理
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 100
      const ctx = canvas.getContext('2d')
      const grad = ctx.createLinearGradient(0, 0, 0, 100)
      grad.addColorStop(0, 'rgba(158, 213, 251, 0.0)') // 顶部颜色 透明
      grad.addColorStop(1, '#7dc5f8') // 底部颜色
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 1, 100)

      const material = new Cesium.ImageMaterialProperty({
        image: canvas,
        transparent: true
      })

      geo.features.forEach(feature => {
        if (!feature.geometry || !feature.geometry.coordinates) return

        feature.geometry.coordinates.forEach(coorList => {
          const positions = Cesium.Cartesian3.fromDegreesArray(coorList.flat(Infinity))
          const maximumHeights = new Array(positions.length).fill(30000)
          const minimumHeights = new Array(positions.length).fill(0)

          const entity = viewer.entities.add({
            wall: {
              positions: positions,
              maximumHeights: maximumHeights,
              minimumHeights: minimumHeights,
              material: material,
              outline: false
            }
          })
          this._entities.push(entity)
        })
      })

      // 监听高度变化切换显示
      if (limitHeight > 0) {
        const updateVisibility = () => {
          if (this._entities.length === 0) return
          const cameraHeight = viewer.camera.positionCartographic.height
          // 高度小于阈值时隐藏 (一定高度下电子围栏隐藏)
          const shouldShow = cameraHeight >= limitHeight

          if (this._entities[0].show !== shouldShow) {
            this._entities.forEach(entity => {
              entity.show = shouldShow
            })
          }
        }
        
        this._removeListener = viewer.scene.postRender.addEventListener(updateVisibility)
        updateVisibility()
      }

    } catch (error) {
      console.error('显示长江流域轮廓墙体失败:', error)
    }
  },
  async destroyWall() {
    const viewer = await EarthManager.getViewer()
    
    if (this._removeListener) {
      this._removeListener()
      this._removeListener = null
    }

    this._entities.forEach(entity => {
      viewer.entities.remove(entity)
    })
    this._entities = []
  }
}

const getFeatures = (data, viewer) => {
  const holeArr = []
  const features = data && data.features
  const LineInstanceArr = []

  // 遍历边界
  features.forEach(function (feature) {
    feature.geometry.coordinates.forEach(function (coorList) {
      holeArr.push({ positions: Cesium.Cartesian3.fromDegreesArray(coorList.flat(Infinity)) })

      // 使用的贴地线，开启地形不会产生影响
      const polyline = new Cesium.GroundPolylineGeometry({
        positions: Cesium.Cartesian3.fromDegreesArray(coorList.flat(Infinity)),
        width: 10,
      })
      const lineInstance = new Cesium.GeometryInstance({
        geometry: polyline,
      })
      LineInstanceArr.push(lineInstance)
    })
  })

  // 使用PolylineGlowMaterialAppearance实现线发光效果
  const line = new Cesium.GroundPolylinePrimitive({
    geometryInstances: LineInstanceArr,
    appearance: new Cesium.PolylineMaterialAppearance({
      material: Cesium.Material.fromType('PolylineGlow', {
        color: Cesium.Color.CYAN.withAlpha(0.2),
        glowPower: 0.2, // 光晕强度，0~1，0最亮，1最弱
        taperPower: 1.0, // 光晕边缘衰减，1默认
      }),
    }),
  })
  viewer?.scene.primitives.add(line)

  // 遮罩
  const polygonEntity = new Cesium.Entity({
    polygon: {
      hierarchy: {
        // 添加外部区域为1/4半圆，设置为180会报错
        positions: Cesium.Cartesian3.fromDegreesArray([0, 0, 0, 90, 179, 90, 179, 0]),
        // 中心挖空的“洞”
        holes: holeArr,
      },
      material: new Cesium.Color(0, 0, 0, 0.5),
    },
  })

  // viewer?.entities.add(polygonEntity)

  const layers = viewer?.scene.imageryLayers
  // 天地图影像图层
  // layers?.addImageryProvider(
  //     new Cesium.UrlTemplateImageryProvider({
  //         url: `http://t0.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=eeb07a200cf73b6893f52d5e2cccadca`,
  //     })
  // );
  // 添加天地图的国境线图层
  // layers?.addImageryProvider(
  //   new Cesium.UrlTemplateImageryProvider({
  //       url: `http://t0.tianditu.gov.cn/DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=eeb07a200cf73b6893f52d5e2cccadca`,
  //   })
  // );
  // 加载天地图影像底图 + 注记
  if (import.meta.env.VITE_MODE === 'development'){
    const tdtImg = new Cesium.UrlTemplateImageryProvider({
      url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&style=default&tilematrixSet=w&format=tiles&tileMatrix={z}&tileRow={y}&tileCol={x}&tk=e20389fde24257c39ad1c5961a3f3ee5',
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
    })
    viewer.imageryLayers.addImageryProvider(tdtImg)
  }
  // const tdtCia = new Cesium.UrlTemplateImageryProvider({
  //   url: 'https://t{s}.tianditu.gov.cn/cia_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cia&style=default&tilematrixSet=w&format=tiles&tileMatrix={z}&tileRow={y}&tileCol={x}&tk=e20389fde24257c39ad1c5961a3f3ee5',
  //   subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  // })
}

const allCity = {
  async show() {
    try {
      const viewer = await EarthManager.getViewer()
      const dataSource = await Cesium.GeoJsonDataSource.load(长江流域地级市, {
        fill: Cesium.Color.WHITE.withAlpha(0),
        stroke: Cesium.Color.WHITE.withAlpha(0.3), // 轮廓线颜色
        strokeWidth: 2, // 轮廓线宽
        // clampToGround: true,
      })
      viewer.dataSources.add(dataSource)
    } catch (error) {
      // console.error('显示长江流域地级市失败:', error.message)
    }
  },
}

const allWater = {
  async show() {
    try {
      const viewer = await EarthManager.getViewer()
      const dataSource = await Cesium.GeoJsonDataSource.load(长江流域湖泊, {
        fill: Cesium.Color.WHITE.withAlpha(0.3),
        clampToGround: true,
      })
      viewer.dataSources.add(dataSource)
    } catch (error) {
      // console.error('显示长江流域湖泊失败:', error.message)
    }
  },
}

// 根据 geojson 创建水面材质
const TextWater = {
  async show() {
    const viewer = await EarthManager.getViewer()
    const instances = []
    
    const geo = await fetchJson(长江流域_polygon);
    const features = geo && geo.features ? geo.features : []

    features.forEach(f => {
      const g = f && f.geometry
      if (!g) return
      if (g.type === 'Polygon') {
        const rings = g.coordinates || []
        if (!rings.length) return
        const outer = Cesium.Cartesian3.fromDegreesArray((rings[0] || []).flat(Infinity))
        const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
        const geom = new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
          vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        })
        instances.push(new Cesium.GeometryInstance({ geometry: geom }))
      } else if (g.type === 'MultiPolygon') {
        const polys = g.coordinates || []
        polys.forEach(rings => {
          if (!rings || !rings.length) return
          const outer = Cesium.Cartesian3.fromDegreesArray((rings[0] || []).flat(Infinity))
          const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
          const geom = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
          })
          instances.push(new Cesium.GeometryInstance({ geometry: geom }))
        })
      }
    })

    if (instances.length > 0) {
      const primitive = new Cesium.Primitive({
        geometryInstances: instances,
        appearance: new Cesium.EllipsoidSurfaceAppearance({
          aboveGround: true,
          material: new Cesium.Material({
            fabric: {
              type: 'Water',
              uniforms: {
                normalMap: waterNormals,
                frequency: 1000.0,
                animationSpeed: 0.01,
                amplitude: 10,
                baseWaterColor: Cesium.Color.fromCssColorString('#1e5fbf').withAlpha(0.7),
                blendColor: Cesium.Color.fromCssColorString('#0b3d79').withAlpha(0.22),
                specularIntensity: 0.22,
              },
            },
          }),
        }),
        show: true,
        asynchronous: false,
      })
      viewer.scene.primitives.add(primitive)
    }
  }
}

const MainRiverWater = {
  _primitive: null,
  _outlinePrimitive: null,
  _removeListener: null,

  async show() {
    const viewer = await EarthManager.getViewer()
    
    // 清理旧资源
    if (this._primitive) {
      viewer.scene.primitives.remove(this._primitive)
      this._primitive = null
    }
    if (this._outlinePrimitive) {
      viewer.scene.primitives.remove(this._outlinePrimitive)
      this._outlinePrimitive = null
    }
    if (this._removeListener) {
      this._removeListener()
      this._removeListener = null
    }

    const instances = []
    const outlineInstances = []
    
    const geo = await fetchJson(长江主干流域);
    const features = geo && geo.features ? geo.features : []

    const processRings = (rings) => {
      if (!rings || !rings.length) return
      const outerCoords = (rings[0] || []).flat(Infinity)
      const outer = Cesium.Cartesian3.fromDegreesArray(outerCoords)
      const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
      
      const geom = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
      })
      instances.push(new Cesium.GeometryInstance({ geometry: geom }))

      // 收集轮廓线数据
      if (outerCoords.length >= 6) {
        // 去除相邻重复点
        const uniquePositions = []
        if (outer.length > 0) {
          uniquePositions.push(outer[0])
          for (let i = 1; i < outer.length; i++) {
            if (!Cesium.Cartesian3.equalsEpsilon(outer[i], uniquePositions[uniquePositions.length - 1], Cesium.Math.EPSILON6)) {
              uniquePositions.push(outer[i])
            }
          }
        }
        
        // 如果去重后点数量不足，跳过
        if (uniquePositions.length < 2) return

        // 如果首尾点相同（闭合），移除最后一个点，避免 loop: true 时重复计算
        if (Cesium.Cartesian3.equalsEpsilon(uniquePositions[0], uniquePositions[uniquePositions.length - 1], Cesium.Math.EPSILON6)) {
            uniquePositions.pop()
        }
        
        // 再次检查点数量
        if (uniquePositions.length < 2) return

        const outlineGeom = new Cesium.GroundPolylineGeometry({
          positions: uniquePositions,
          width: 2.0,
          loop: true
        })
        outlineInstances.push(new Cesium.GeometryInstance({ geometry: outlineGeom }))
      }
    }

    features.forEach(f => {
      const g = f && f.geometry
      if (!g) return
      if (g.type === 'Polygon') {
        processRings(g.coordinates)
      } else if (g.type === 'MultiPolygon') {
        const polys = g.coordinates || []
        polys.forEach(processRings)
      }
    })

    if (instances.length > 0) {
      // 1. 低空显示的水面
      const primitive = new Cesium.GroundPrimitive({
        geometryInstances: instances,
        appearance: new Cesium.MaterialAppearance({
          material: new Cesium.Material({
            fabric: {
              type: 'Water',
              uniforms: {
                normalMap: waterNormals,
                frequency: 1000.0,
                animationSpeed: 0.01,
                amplitude: 10,
                baseWaterColor: Cesium.Color.fromCssColorString('#27AEB9').withAlpha(0.7),
                blendColor: Cesium.Color.fromCssColorString('#27AEB9').withAlpha(0.22),
                specularIntensity: 0.22,
              },
            },
          }),
        }),
        show: true,
        asynchronous: true,
      })
      viewer.scene.primitives.add(primitive)
      this._primitive = primitive

      // 2. 高空显示的蓝色轮廓
      if (outlineInstances.length > 0) {
        const outlinePrimitive = new Cesium.GroundPolylinePrimitive({
          geometryInstances: outlineInstances,
          appearance: new Cesium.PolylineMaterialAppearance({
            material: Cesium.Material.fromType('Color', {
              color: Cesium.Color.fromCssColorString('#27AEB9')
            })
          }),
          show: false,
          asynchronous: true
        })
        viewer.scene.primitives.add(outlinePrimitive)
        this._outlinePrimitive = outlinePrimitive
      }

      // 3. 监听高度变化切换显示
      const updateVisibility = () => {
        if (!this._primitive && !this._outlinePrimitive) return
        
        const height = viewer.camera.positionCartographic.height
        // 高空阈值 500km
        const isHigh = height > 500000.0
        
        if (this._primitive) this._primitive.show = !isHigh
        if (this._outlinePrimitive) this._outlinePrimitive.show = isHigh
      }

      this._removeListener = viewer.scene.postRender.addEventListener(updateVisibility)
      updateVisibility() // 初始化状态
      
      const earthUiStore = useEarthUiStore()
      try {
        await this.setColor(earthUiStore.mainRiverColor)
      } catch (e) {}
    }
  },

  async setOpacity(opacity) {
    const a = Math.min(1, Math.max(0, Number(opacity)))
    try {
      if (this._primitive && !this._primitive.isDestroyed?.()) {
        const material = this._primitive.appearance?.material
        if (material && material.uniforms) {
          const b = material.uniforms.baseWaterColor
          const bl = material.uniforms.blendColor
          if (b) {
            const base = (b instanceof Cesium.Cartesian4) ? Cesium.Color.fromCartesian4(b) : Cesium.Color.clone(b)
            material.uniforms.baseWaterColor = base.withAlpha(a)
          }
          if (bl) {
            const blend = (bl instanceof Cesium.Cartesian4) ? Cesium.Color.fromCartesian4(bl) : Cesium.Color.clone(bl)
            material.uniforms.blendColor = blend.withAlpha(a)
          }
        }
      }
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        const outlineMat = this._outlinePrimitive.appearance?.material
        if (outlineMat && outlineMat.uniforms && outlineMat.uniforms.color) {
          const c = outlineMat.uniforms.color
          const base = (c instanceof Cesium.Cartesian4) ? Cesium.Color.fromCartesian4(c) : Cesium.Color.clone(c)
          outlineMat.uniforms.color = base.withAlpha(a)
        }
      }
    } catch (e) {}
  },

  async setColor(hex) {
    try {
      const color = Cesium.Color.fromCssColorString(hex)
      const baseColor = color.withAlpha(0.7)
      const blendColor = color.withAlpha(0.22)
      if (this._primitive && !this._primitive.isDestroyed?.()) {
        const material = this._primitive.appearance?.material
        if (material && material.uniforms) {
          if (material.uniforms.baseWaterColor) material.uniforms.baseWaterColor = baseColor
          if (material.uniforms.blendColor) material.uniforms.blendColor = blendColor
        }
      }
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        const outlineMat = this._outlinePrimitive.appearance?.material
        if (outlineMat && outlineMat.uniforms) {
          if (outlineMat.uniforms.color) outlineMat.uniforms.color = color
        }
      }
    } catch (e) {}
  },

  // async showShp() {
  //   const viewer = await EarthManager.getViewer()
    
  //   // 清理旧资源
  //   if (this._primitive) {
  //     viewer.scene.primitives.remove(this._primitive)
  //     this._primitive = null
  //   }
  //   if (this._outlinePrimitive) {
  //     viewer.scene.primitives.remove(this._outlinePrimitive)
  //     this._outlinePrimitive = null
  //   }
  //   if (this._removeListener) {
  //     this._removeListener()
  //     this._removeListener = null
  //   }

  //   const instances = []
  //   const outlineInstances = []

  //   const fetchShp = async (url) => {
  //     try {
  //       const response = await fetch(url)
  //       if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  //       const buffer = await response.arrayBuffer()
  //       // shapefile.open accepts ArrayBuffer
  //       const source = await shapefile.open(buffer)
  //       const features = []
  //       let result = await source.read()
  //       while (!result.done) {
  //         features.push(result.value)
  //         result = await source.read()
  //       }
  //       return features
  //     } catch (e) {
  //       console.error(`Failed to fetch/parse SHP from ${url}:`, e)
  //       return []
  //     }
  //   }
    
  //   const features = await fetchShp(长江主干流域SHP)

  //   const processRings = (rings) => {
  //     if (!rings || !rings.length) return
  //     const outerCoords = (rings[0] || []).flat(Infinity)
  //     const outer = Cesium.Cartesian3.fromDegreesArray(outerCoords)
  //     const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
      
  //     const geom = new Cesium.PolygonGeometry({
  //       polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
  //       vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
  //     })
  //     instances.push(new Cesium.GeometryInstance({ geometry: geom }))

  //     // 收集轮廓线数据
  //     if (outerCoords.length >= 6) {
  //       // 去除相邻重复点
  //       const uniquePositions = []
  //       if (outer.length > 0) {
  //         uniquePositions.push(outer[0])
  //         for (let i = 1; i < outer.length; i++) {
  //           if (!Cesium.Cartesian3.equalsEpsilon(outer[i], uniquePositions[uniquePositions.length - 1], Cesium.Math.EPSILON6)) {
  //             uniquePositions.push(outer[i])
  //           }
  //         }
  //       }
        
  //       // 如果去重后点数量不足，跳过
  //       if (uniquePositions.length < 2) return

  //       // 如果首尾点相同（闭合），移除最后一个点，避免 loop: true 时重复计算
  //       if (Cesium.Cartesian3.equalsEpsilon(uniquePositions[0], uniquePositions[uniquePositions.length - 1], Cesium.Math.EPSILON6)) {
  //           uniquePositions.pop()
  //       }
        
  //       // 再次检查点数量
  //       if (uniquePositions.length < 2) return

  //       const outlineGeom = new Cesium.GroundPolylineGeometry({
  //         positions: uniquePositions,
  //         width: 2.0,
  //         loop: true
  //       })
  //       outlineInstances.push(new Cesium.GeometryInstance({ geometry: outlineGeom }))
  //     }
  //   }

  //   features.forEach(f => {
  //     const g = f && f.geometry
  //     if (!g) return
  //     if (g.type === 'Polygon') {
  //       processRings(g.coordinates)
  //     } else if (g.type === 'MultiPolygon') {
  //       const polys = g.coordinates || []
  //       polys.forEach(processRings)
  //     }
  //   })

  //   if (instances.length > 0) {
  //     // 1. 低空显示的水面
  //     const primitive = new Cesium.GroundPrimitive({
  //       geometryInstances: instances,
  //       appearance: new Cesium.MaterialAppearance({
  //         material: new Cesium.Material({
  //           fabric: {
  //             type: 'Water',
  //             uniforms: {
  //               normalMap: waterNormals,
  //               frequency: 1000.0,
  //               animationSpeed: 0.01,
  //               amplitude: 10,
  //               baseWaterColor: Cesium.Color.fromCssColorString('#1e5fbf').withAlpha(0.7),
  //               blendColor: Cesium.Color.fromCssColorString('#0b3d79').withAlpha(0.22),
  //               specularIntensity: 0.22,
  //             },
  //           },
  //         }),
  //       }),
  //       show: true,
  //       asynchronous: true,
  //     })
  //     viewer.scene.primitives.add(primitive)
  //     this._primitive = primitive

  //     // 2. 高空显示的蓝色轮廓
  //     if (outlineInstances.length > 0) {
  //       const outlinePrimitive = new Cesium.GroundPolylinePrimitive({
  //         geometryInstances: outlineInstances,
  //         appearance: new Cesium.PolylineMaterialAppearance({
  //           material: Cesium.Material.fromType('Color', {
  //             color: Cesium.Color.fromCssColorString('#09bbff')
  //           })
  //         }),
  //         show: false,
  //         asynchronous: true
  //       })
  //       viewer.scene.primitives.add(outlinePrimitive)
  //       this._outlinePrimitive = outlinePrimitive
  //     }

  //     // 3. 监听高度变化切换显示
  //     const updateVisibility = () => {
  //       if (!this._primitive && !this._outlinePrimitive) return
        
  //       const height = viewer.camera.positionCartographic.height
  //       // 高空阈值 500km
  //       const isHigh = height > 500000.0
        
  //       if (this._primitive) this._primitive.show = !isHigh
  //       if (this._outlinePrimitive) this._outlinePrimitive.show = isHigh
  //     }

  //     this._removeListener = viewer.scene.postRender.addEventListener(updateVisibility)
  //     updateVisibility() // 初始化状态
  //   }
  // }
}

const MainRiverWaterShiny = {
  _primitive: null,
  _outlinePrimitive: null,
  _updateCallback: null,
  _removeListener: null,
  _isInitialized: false,
  _isLoading: false,
  _readyPromise: null,
  _speed: 1.0,
  _destroyed: false,
  _lifecycleId: 0,

  async init() {
    if (this._isInitialized || this._isLoading) return
    this._isLoading = true
    this._destroyed = false
    const lifecycleId = ++this._lifecycleId
    
    const viewer = await EarthManager.getViewer()
    const instances = []
    const outlineInstances = []
    
    // Helper to process ring and add outline instances
    const addOutlineInstances = (ring) => {
         if (!ring || ring.length < 3) return;
         
         let minLonIdx = 0, maxLonIdx = 0, minLon = 180, maxLon = -180;
         for (let i = 0; i < ring.length; i++) {
             const lon = ring[i][0];
             if (lon < minLon) { minLon = lon; minLonIdx = i; }
             if (lon > maxLon) { maxLon = lon; maxLonIdx = i; }
         }

         const rotatedRing = [];
         for (let i = 0; i < ring.length; i++) {
             rotatedRing.push(ring[(minLonIdx + i) % ring.length]);
         }

         const newMaxIdx = (maxLonIdx - minLonIdx + ring.length) % ring.length;

         const pathA = rotatedRing.slice(0, newMaxIdx + 1);
         const pathB = rotatedRing.slice(newMaxIdx);
         const pathB_reversed = [...pathB].reverse();
         
         if (pathA.length > 1) {
             const positionsA = Cesium.Cartesian3.fromDegreesArray(pathA.flat(Infinity));
             outlineInstances.push(new Cesium.GeometryInstance({
                 geometry: new Cesium.GroundPolylineGeometry({
                     positions: positionsA,
                     width: 3.0
                 })
             }));
         }

         if (pathB_reversed.length > 1) {
             const positionsB = Cesium.Cartesian3.fromDegreesArray(pathB_reversed.flat(Infinity));
             outlineInstances.push(new Cesium.GeometryInstance({
                 geometry: new Cesium.GroundPolylineGeometry({
                     positions: positionsB,
                     width: 3.0
                 })
             }));
         }
    };

    setTimeout(async () => {
        if (this._destroyed || lifecycleId !== this._lifecycleId) return
        try {
            const geo = await fetchJson(长江主干流域_merged);
            const features = geo && geo.features ? geo.features : []

            features.forEach(f => {
              const g = f && f.geometry
              if (!g) return
              if (g.type === 'Polygon') {
                const rings = g.coordinates || []
                if (!rings.length) return
                const outerCoords = (rings[0] || []).flat(Infinity);
                const outer = Cesium.Cartesian3.fromDegreesArray(outerCoords)
                const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
                const geom = new Cesium.PolygonGeometry({
                  polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
                  vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                })
                instances.push(new Cesium.GeometryInstance({ geometry: geom }))
                
                // Add outline geometry
                addOutlineInstances(rings[0]);

              } else if (g.type === 'MultiPolygon') {
                const polys = g.coordinates || []
                polys.forEach(rings => {
                  if (!rings || !rings.length) return
                  const outerCoords = (rings[0] || []).flat(Infinity);
                  const outer = Cesium.Cartesian3.fromDegreesArray(outerCoords)
                  const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
                  const geom = new Cesium.PolygonGeometry({
                    polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
                    vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
                  })
                  instances.push(new Cesium.GeometryInstance({ geometry: geom }))
                  
                  // Add outline geometry
                  addOutlineInstances(rings[0]);
                })
              }
            })

            if (instances.length > 0) {
              // Define material configuration to be reused
              const getMaterialConfig = () => ({
                fabric: {
                  uniforms: {
                    color: Cesium.Color.fromCssColorString('#00ffff').withAlpha(1.0),
                    time: 0.0,
                    height: 0.0 // Add height uniform
                  },
                  source: `
                    uniform vec4 color;
                    uniform float time;
                    uniform float height;
                    czm_material czm_getMaterial(czm_materialInput materialInput)
                    {
                        czm_material material = czm_getDefaultMaterial(materialInput);
                        
                        // --- Flowing Effect ---
                        // Dynamic frequency based on camera height
                        // Low height (zoomed in) -> Higher frequency (more detail)
                        // High height (zoomed out) -> Lower frequency (avoid noise)
                        float baseFreq = 1.0;
                        float freqMultiplier = 1.0 + 1000000.0 / max(height, 1000.0);
                        // Limit the multiplier to avoid excessive noise or aliasing
                        freqMultiplier = clamp(freqMultiplier, 1.0, 10.0);
                        
                        float flowPhase = fract(materialInput.st.s * baseFreq * freqMultiplier - time * 0.5);
                        
                        // Sharper wave for better contrast between base and flow
                        // Adjusted smoothstep for shorter tail (less fade-out time)
                        float flowWave = smoothstep(0.0, 0.15, flowPhase) * (1.0 - smoothstep(0.15, 0.5, flowPhase));
                        
                        // --- Colors ---
                        // Base color #09bbff (converted to 0.0-1.0 range: 0.49, 0.62, 0.86)
                        vec3 baseColor = vec3(0.49, 0.62, 0.86);
                        
                        // Blinding white flow
                        vec3 flowColor = vec3(1.5); 
                        
                        // Pulse for aliveness
                        float pulse = 0.9 + 0.1 * sin(time * 3.0);
                        
                        // Mix: Base is constant, Flow adds on top
                        vec3 finalColor = mix(baseColor, flowColor, flowWave);
                        
                        // Apply pulse to the whole thing
                        finalColor *= pulse;
                        
                        material.diffuse = vec3(0.0);
                        material.emission = finalColor;
                        
                        // Calculate alpha: lower alpha for base color areas, higher for flow areas
                        float baseAlpha = 0.0; // Increased base alpha for better visibility of river body
                        float flowAlpha = 1.0;  // Higher flow alpha
                        float finalAlpha = mix(baseAlpha, flowAlpha, flowWave);
                        
                        material.alpha = finalAlpha;
                        
                        return material;
                    }
                  `
                }
              });

              // Material for Polygon (Surface)
              const material = new Cesium.Material(getMaterialConfig());
              
              const primitive = new Cesium.GroundPrimitive({
                geometryInstances: instances,
                appearance: new Cesium.MaterialAppearance({
                  material: material
                }),
                show: false,
                asynchronous: true,
                zIndex: 1 // Ensure it's rendered on top of other ground primitives if needed
              })
              viewer.scene.primitives.add(primitive)
              this._primitive = primitive;
              
              // Material for Polyline (Outline/Glow)
              const outlineMaterial = new Cesium.Material(getMaterialConfig());
              
              // Add outline primitive if instances exist
              let outlinePrimitive = null;
              if (outlineInstances.length > 0) {
                outlinePrimitive = new Cesium.GroundPolylinePrimitive({
                  geometryInstances: outlineInstances,
                  appearance: new Cesium.PolylineMaterialAppearance({
                    material: outlineMaterial
                  }),
                  asynchronous: true,
                  show: false
                });
                viewer.scene.primitives.add(outlinePrimitive);
                this._outlinePrimitive = outlinePrimitive;
              }

              const ps = []
              if (primitive && primitive.readyPromise) ps.push(primitive.readyPromise)
              if (outlinePrimitive && outlinePrimitive.readyPromise) ps.push(outlinePrimitive.readyPromise)
              this._readyPromise = ps.length > 0 ? Promise.all(ps) : Promise.resolve()
            }
        } catch (e) {
            console.error('MainRiverWaterShiny init error:', e)
        } finally {
            this._isInitialized = true
            this._isLoading = false
        }
    }, 100)
  },

  async show(speed = 1.0) {
    this._speed = speed;
    
    if (!this._isInitialized) {
        if (!this._isLoading) {
            this.init()
        }
        while(!this._isInitialized) {
            await sleep(50)
        }
    }
    
    const viewer = await EarthManager.getViewer()

    if (this._readyPromise) {
      try {
        await this._readyPromise
      } catch (e) {}
    }

    // Update time uniform for animation
    if (!this._removeListener) {
        const startTime = performance.now();
        const updateCallback = () => {
            if (this._primitive && this._primitive.isDestroyed()) return;
            
            const t = ((performance.now() - startTime) / 1000.0) * this._speed;
            const h = viewer.camera.positionCartographic.height;
            
            // Visibility control based on height
            // High altitude (> 500km) -> Show Line, Hide Surface
            // Low altitude (<= 500km) -> Show Surface, Hide Line
            const showLine = h > 500000.0;
            
            if (this._primitive) {
                this._primitive.show = !showLine;
                if (this._primitive.show && this._primitive.appearance.material.uniforms) {
                    this._primitive.appearance.material.uniforms.time = t;
                    this._primitive.appearance.material.uniforms.height = h;
                }
            }
            
            if (this._outlinePrimitive) {
                this._outlinePrimitive.show = showLine;
                if (this._outlinePrimitive.show && !this._outlinePrimitive.isDestroyed() && this._outlinePrimitive.appearance.material.uniforms) {
                   this._outlinePrimitive.appearance.material.uniforms.time = t;
                   this._outlinePrimitive.appearance.material.uniforms.height = h;
                }
            }
        }
        this._removeListener = viewer.scene.preUpdate.addEventListener(updateCallback);
        this._updateCallback = updateCallback;
        
        // Trigger one update immediately to set correct initial state
        updateCallback();
    }

    if (this._updateCallback) {
      try {
        this._updateCallback()
      } catch (e) {}
    }
    if (viewer.scene && viewer.scene.requestRender) viewer.scene.requestRender()
    await new Promise(resolve => {
      const remove = viewer.scene.postRender.addEventListener(() => {
        remove()
        resolve()
      })
    })
  },

  async hide() {
    if (this._primitive) {
        this._primitive.show = false
    }
    if (this._outlinePrimitive) {
        this._outlinePrimitive.show = false
    }
    
    if (this._removeListener) {
        this._removeListener();
        this._removeListener = null;
    }
    this._updateCallback = null;
  },

  async destroy() {
    this._destroyed = true
    this._lifecycleId++

    try {
      await this.hide()
    } catch (e) {}

    let viewer = null
    try {
      viewer = await EarthManager.getViewer()
    } catch (e) {}

    const removeAndDestroy = (primitive) => {
      if (!primitive) return
      try {
        if (viewer && viewer.scene && viewer.scene.primitives) {
          viewer.scene.primitives.remove(primitive)
        }
      } catch (e) {}
      try {
        if (primitive && typeof primitive.isDestroyed === 'function' && !primitive.isDestroyed()) {
          primitive.destroy()
        } else if (primitive && typeof primitive.destroy === 'function' && typeof primitive.isDestroyed !== 'function') {
          primitive.destroy()
        }
      } catch (e) {}
    }

    removeAndDestroy(this._primitive)
    removeAndDestroy(this._outlinePrimitive)

    this._primitive = null
    this._outlinePrimitive = null
    this._updateCallback = null
    this._removeListener = null
    this._readyPromise = null
    this._isInitialized = false
    this._isLoading = false
  }
}

const AdditionalRiversWater = {
  _primitive: null,
  _outlinePrimitive: null,
  _destroyed: false,
  _lifecycleId: 0,
  async show() {
    const viewer = await EarthManager.getViewer()
    const earthUiStore = useEarthUiStore()
    const a = Math.min(1, Math.max(0, Number(earthUiStore.additionalRiversOpacity)))
    const hex = earthUiStore.additionalRiversColor
    const baseColor = Cesium.Color.fromCssColorString(hex).withAlpha(a)
    this._destroyed = false
    const lifecycleId = ++this._lifecycleId

    if (this._primitive && !this._primitive.isDestroyed?.()) {
      this._primitive.show = true
      const material = this._primitive.appearance?.material
      if (material && material.uniforms && material.uniforms.color) {
        material.uniforms.color = baseColor
      }
      
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        this._outlinePrimitive.show = true
        const outlineMaterial = this._outlinePrimitive.appearance?.material
        if (outlineMaterial && outlineMaterial.uniforms && outlineMaterial.uniforms.color) {
          outlineMaterial.uniforms.color = baseColor
        }
      }
      if (this._labelCollection && !this._labelCollection.isDestroyed?.()) {
        this._labelCollection.show = true
      }
      
      if (viewer.scene && viewer.scene.requestRender) viewer.scene.requestRender()
      return
    }

    const instances = []
    const outlineInstances = []
    const labelList = []
    
    // 静态 Label 数据
    const staticLabels = [
      { "name": "雅砻江", "lng": 101.59, "lat": 28.14 },
      { "name": "岷江", "lng": 103.68, "lat": 29.55 },
      { "name": "嘉陵江", "lng": 106.36, "lat": 31.01 },
      { "name": "乌江", "lng": 108.06, "lat": 27.74 },
      { "name": "汉江", "lng": 111.5, "lat": 32.54 },
      // { "name": "沅江", "lng": 111.9, "lat": 28.97 },
      { "name": "湘江", "lng": 112.95, "lat": 27.3 },
      { "name": "赣江", "lng": 115.39, "lat": 27.77 },
      { "name": "江淮运河", "lng": 117.56, "lat": 31.45 },
      { "name": "京杭运河", "lng": 117.2, "lat": 34.53 },
      // 新增河流
      { "name": "藕池河", "lng": 112.43046888335526, "lat": 29.36576548719283 },
      { "name": "华容河", "lng": 112.5686680375035, "lat": 29.5241615431796 },
      { "name": "沱江", "lng": 105.004, "lat": 29.6633 },
      { "name": "荆汉运河", "lng": 113.095, "lat": 30.147 },
    ]

    staticLabels.forEach(item => {
      labelList.push({
        text: item.name,
        position: Cesium.Cartesian3.fromDegrees(item.lng, item.lat, 500)
      })
    })
    
    // const sources = [引江济淮, 运河, 支流]
    const g1 = await fetchJson(引江济淮);
    const g2 = await fetchJson(运河);
    const g3 = await fetchJson(支流);
    const g4 = await fetchJson(荆汉运河);
    const g5 = await fetchJson(沱江);
    const g6 = await fetchJson(藕池河);
    const g7 = await fetchJson(华容河);
    const sources = [g1, g2, g3, g4, g5, g6, g7];
    if (this._destroyed || lifecycleId !== this._lifecycleId) return

    sources.forEach(source => {
      const features = source && source.features ? source.features : []
      features.forEach(f => {
        const g = f && f.geometry
        if (!g) return
        if (g.type === 'Polygon') {
          const rings = g.coordinates || []
          if (!rings.length) return
          const outer = Cesium.Cartesian3.fromDegreesArray((rings[0] || []).flat(Infinity))
          const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
          const geom = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
          })
          instances.push(new Cesium.GeometryInstance({ geometry: geom }))

          // Outlines
          rings.forEach(ring => {
            const positions = (ring || []).flat(Infinity)
            if (positions.length >= 6) {
              const allCartesians = Cesium.Cartesian3.fromDegreesArray(positions)
              const uniqueCartesians = []
              if (allCartesians.length > 0) {
                uniqueCartesians.push(allCartesians[0])
                for (let i = 1; i < allCartesians.length; i++) {
                  if (!Cesium.Cartesian3.equalsEpsilon(allCartesians[i], uniqueCartesians[uniqueCartesians.length - 1], Cesium.Math.EPSILON6)) {
                    uniqueCartesians.push(allCartesians[i])
                  }
                }
              }
              
              if (uniqueCartesians.length >= 2) {
                const isClosed = Cesium.Cartesian3.equalsEpsilon(uniqueCartesians[0], uniqueCartesians[uniqueCartesians.length - 1], Cesium.Math.EPSILON6);
                const outlineGeom = new Cesium.GroundPolylineGeometry({
                  positions: uniqueCartesians,
                  width: 3.0,
                  loop: !isClosed
                })
                outlineInstances.push(new Cesium.GeometryInstance({ geometry: outlineGeom }))
              }
            }
          })
        } else if (g.type === 'MultiPolygon') {
          const polys = g.coordinates || []
          polys.forEach(rings => {
            if (!rings || !rings.length) return
            const outer = Cesium.Cartesian3.fromDegreesArray((rings[0] || []).flat(Infinity))
            const holes = (rings.slice(1) || []).map(h => new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(h.flat(Infinity))))
            const geom = new Cesium.PolygonGeometry({
              polygonHierarchy: new Cesium.PolygonHierarchy(outer, holes),
              vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
            })
            instances.push(new Cesium.GeometryInstance({ geometry: geom }))

            // Outlines
            rings.forEach(ring => {
              const positions = (ring || []).flat(Infinity)
              if (positions.length >= 6) {
                const allCartesians = Cesium.Cartesian3.fromDegreesArray(positions)
                const uniqueCartesians = []
                if (allCartesians.length > 0) {
                  uniqueCartesians.push(allCartesians[0])
                  for (let i = 1; i < allCartesians.length; i++) {
                    if (!Cesium.Cartesian3.equalsEpsilon(allCartesians[i], uniqueCartesians[uniqueCartesians.length - 1], Cesium.Math.EPSILON6)) {
                      uniqueCartesians.push(allCartesians[i])
                    }
                  }
                }
                
                if (uniqueCartesians.length >= 2) {
                  const isClosed = Cesium.Cartesian3.equalsEpsilon(uniqueCartesians[0], uniqueCartesians[uniqueCartesians.length - 1], Cesium.Math.EPSILON6);
                  const outlineGeom = new Cesium.GroundPolylineGeometry({
                    positions: uniqueCartesians,
                    width: 1.0,
                    loop: !isClosed
                  })
                  outlineInstances.push(new Cesium.GeometryInstance({ geometry: outlineGeom }))
                }
              }
            })
          })
        } else if (g.type === 'LineString') {
          // 荆汉运河
          const positions = (g.coordinates || []).flat(Infinity)
          if (positions.length >= 4) {  // 至少需要两个点（经纬度对）
            const cartesians = Cesium.Cartesian3.fromDegreesArray(positions)
            const uniqueCartesians = []
            if (cartesians.length > 0) {
              uniqueCartesians.push(cartesians[0])
              for (let i = 1; i < cartesians.length; i++) {
                if (!Cesium.Cartesian3.equalsEpsilon(cartesians[i], uniqueCartesians[uniqueCartesians.length - 1], Cesium.Math.EPSILON6)) {
                  uniqueCartesians.push(cartesians[i])
                }
              }
            }
            
            if (uniqueCartesians.length >= 2) {
              const lineGeom = new Cesium.GroundPolylineGeometry({
                positions: uniqueCartesians,
                width: 2.0  // 可以根据需要调整线宽
              })
              outlineInstances.push(new Cesium.GeometryInstance({ geometry: lineGeom }))
            }
          }
        }
      })
    })

    if (this._destroyed || lifecycleId !== this._lifecycleId) return

    if (instances.length > 0) {
      const primitive = new Cesium.GroundPrimitive({
        geometryInstances: instances,
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: baseColor,
          }),
        }),
        show: true,
        asynchronous: true,
      })
      viewer.scene.primitives.add(primitive)
      this._primitive = primitive
    }

    if (outlineInstances.length > 0) {
      const outlinePrimitive = new Cesium.GroundPolylinePrimitive({
        geometryInstances: outlineInstances,
        appearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: baseColor,
          }),
        }),
        show: true,
        asynchronous: true,
      })
      viewer.scene.primitives.add(outlinePrimitive)
      this._outlinePrimitive = outlinePrimitive
    }

    if (labelList.length > 0) {
      const labelCollection = new Cesium.LabelCollection({
        scene: viewer.scene
      })
      labelList.forEach(l => {
        let font = 'bold 14px sans-serif'
        let showBg = true
        let hieghtShowNum = 5000000
        if(['华容河','藕池河'].includes(l.text)) {
          font = 'bold 12px sans-serif'
          showBg = false
          hieghtShowNum = 900000
        }
        labelCollection.add({
          text: l.text,
          position: l.position,
          font,
          fillColor: Cesium.Color.WHITE,
          showBackground: showBg,
          backgroundColor: Cesium.Color.BLACK.withAlpha(0.5),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 0,
          scale: 1.0,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          disableDepthTestDistance: 0,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, hieghtShowNum),
          scaleByDistance: new Cesium.NearFarScalar(50000.0, 2.0, 100000.0,1),
        })
      })
      viewer.scene.primitives.add(labelCollection)
      this._labelCollection = labelCollection
    }
  },

  async hide() {
    if (this._primitive && !this._primitive.isDestroyed?.()) {
      this._primitive.show = false
    }
    if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
      this._outlinePrimitive.show = false
    }
    if (this._labelCollection && !this._labelCollection.isDestroyed?.()) {
      this._labelCollection.show = false
    }
  },

  async destroy() {
    this._destroyed = true
    this._lifecycleId++

    try {
      await this.hide()
    } catch (e) {}

    let viewer = null
    try {
      viewer = await EarthManager.getViewer()
    } catch (e) {}

    const removeAndDestroy = (primitive) => {
      if (!primitive) return
      try {
        if (viewer && viewer.scene && viewer.scene.primitives) {
          viewer.scene.primitives.remove(primitive)
        }
      } catch (e) {}
      try {
        if (primitive && typeof primitive.isDestroyed === 'function' && !primitive.isDestroyed()) {
          primitive.destroy()
        } else if (primitive && typeof primitive.destroy === 'function' && typeof primitive.isDestroyed !== 'function') {
          primitive.destroy()
        }
      } catch (e) {}
    }

    removeAndDestroy(this._primitive)
    removeAndDestroy(this._outlinePrimitive)
    removeAndDestroy(this._labelCollection)
    this._primitive = null
    this._outlinePrimitive = null
    this._labelCollection = null
  },
  
  async setColor(hex) {
    try {
      const color = Cesium.Color.fromCssColorString(hex)
      if (this._primitive && !this._primitive.isDestroyed?.()) {
        const material = this._primitive.appearance?.material
        if (material && material.uniforms && material.uniforms.color) {
          const a = material.uniforms.color?.alpha ?? 0.3
          material.uniforms.color = color.withAlpha(a)
        }
      }
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        const outlineMat = this._outlinePrimitive.appearance?.material
        if (outlineMat && outlineMat.uniforms && outlineMat.uniforms.color) {
          const a = outlineMat.uniforms.color?.alpha ?? 0.3
          outlineMat.uniforms.color = color.withAlpha(a)
        }
      }
    } catch (e) {}
  },
  
  async setOpacity(opacity) {
    const a = Math.min(1, Math.max(0, Number(opacity)))
    try {
      if (this._primitive && !this._primitive.isDestroyed?.()) {
        const material = this._primitive.appearance?.material
        if (material && material.uniforms && material.uniforms.color) {
          const c = material.uniforms.color
          const base = (c instanceof Cesium.Cartesian4) ? Cesium.Color.fromCartesian4(c) : Cesium.Color.clone(c)
          material.uniforms.color = base.withAlpha(a)
        }
      }
      if (this._outlinePrimitive && !this._outlinePrimitive.isDestroyed?.()) {
        const outlineMat = this._outlinePrimitive.appearance?.material
        if (outlineMat && outlineMat.uniforms && outlineMat.uniforms.color) {
          const c = outlineMat.uniforms.color
          const base = (c instanceof Cesium.Cartesian4) ? Cesium.Color.fromCartesian4(c) : Cesium.Color.clone(c)
          outlineMat.uniforms.color = base.withAlpha(a)
        }
      }
    } catch (e) {}
  }
}

const MainRiverBorderFlow = {
  _primitive: null,
  _removeListener: null,
  _updateCallback: null,
  _isInitialized: false,
  _isLoading: false,
  _duration: 3000,
  _destroyed: false,
  _lifecycleId: 0,

  async init() {
    if (this._isInitialized || this._isLoading) return
    this._isLoading = true
    this._destroyed = false
    const lifecycleId = ++this._lifecycleId
    
    const viewer = await EarthManager.getViewer()

    setTimeout(async () => {
      if (this._destroyed || lifecycleId !== this._lifecycleId) return
      try {
        const geo = await fetchJson(长江主干流域_merged);
        const features = geo && geo.features ? geo.features : []
        const instances = []

        features.forEach(f => {
          const g = f && f.geometry
          if (!g) return

          const processRing = (ring) => {
            if (!ring || ring.length < 2) return

            let minLonIdx = 0, maxLonIdx = 0, minLon = 180, maxLon = -180

            for (let i = 0; i < ring.length; i++) {
              const lon = ring[i][0]
              if (lon < minLon) { minLon = lon; minLonIdx = i }
              if (lon > maxLon) { maxLon = lon; maxLonIdx = i }
            }

            const rotatedRing = []
            for (let i = 0; i < ring.length; i++) {
              rotatedRing.push(ring[(minLonIdx + i) % ring.length])
            }

            const newMaxIdx = (maxLonIdx - minLonIdx + ring.length) % ring.length

            const pathA = rotatedRing.slice(0, newMaxIdx + 1)
            const pathB = rotatedRing.slice(newMaxIdx)
            const pathB_reversed = [...pathB].reverse()

            if (pathA.length > 1) {
              const positionsA = Cesium.Cartesian3.fromDegreesArray(pathA.flat(Infinity))
              instances.push(new Cesium.GeometryInstance({
                geometry: new Cesium.GroundPolylineGeometry({
                  positions: positionsA,
                  width: 3.0
                })
              }))
            }

            if (pathB_reversed.length > 1) {
              const positionsB = Cesium.Cartesian3.fromDegreesArray(pathB_reversed.flat(Infinity))
              instances.push(new Cesium.GeometryInstance({
                geometry: new Cesium.GroundPolylineGeometry({
                  positions: positionsB,
                  width: 3.0
                })
              }))
            }
          }

          if (g.type === 'Polygon') {
            const rings = g.coordinates || []
            if (rings.length > 0) {
              processRing(rings[0])
            }
          } else if (g.type === 'MultiPolygon') {
            const polys = g.coordinates || []
            polys.forEach(rings => {
              if (rings && rings.length > 0) {
                processRing(rings[0])
              }
            })
          }
        })

        if (instances.length > 0) {
          if (this._primitive) {
            viewer.scene.primitives.remove(this._primitive)
            this._primitive = null
          }
          if (this._removeListener) {
            this._removeListener()
            this._removeListener = null
          }

          const material = Cesium.Material.fromType('TripleSpriteline', {
            image: w,
            color: new Cesium.Color(0.5, 0.8, 1.0, 1.0), // Light Blue
            duration: this._duration
          })
          
          material.uniforms.time = 0.0

          const primitive = new Cesium.GroundPolylinePrimitive({
            geometryInstances: instances,
            appearance: new Cesium.PolylineMaterialAppearance({
              material: material
            }),
            asynchronous: true,
            show: false
          })
          
          viewer.scene.primitives.add(primitive)
          this._primitive = primitive

          const startTime = performance.now()
          const self = this
          this._updateCallback = function() {
            if (primitive.isDestroyed()) return
            if (material && material.uniforms) {
               material.uniforms.time = ((performance.now() - startTime) % self._duration) / self._duration
            }
          }
          
          console.log('MainRiverBorderFlow init finished')
        }
      } catch (e) {
        console.error('MainRiverBorderFlow init error:', e)
      } finally {
        this._isInitialized = true
        this._isLoading = false
      }
    }, 100)
  },

  async show(duration) {
    if (duration && typeof duration === 'number') {
        this._duration = duration
    }

    if (!this._isInitialized) {
        if (!this._isLoading) {
            await this.init()
        }
        while(!this._isInitialized) {
            await sleep(50)
        }
    }

    const viewer = await EarthManager.getViewer()
    
    if (this._primitive) {
      this._primitive.show = true
      
      if (!this._removeListener && this._updateCallback) {
        this._removeListener = viewer.scene.preUpdate.addEventListener(this._updateCallback)
      }
    }
    
    viewer.scene.requestRender()
    await sleep(600)
    return Promise.resolve()
  },

  async hide() {
    if (this._primitive) {
      this._primitive.show = false
      
      if (this._removeListener) {
        this._removeListener()
        this._removeListener = null
      }
    }
  },

  async destroy() {
    this._destroyed = true
    this._lifecycleId++

    try {
      await this.hide()
    } catch (e) {}

    let viewer = null
    try {
      viewer = await EarthManager.getViewer()
    } catch (e) {}

    const primitive = this._primitive
    this._primitive = null

    if (primitive) {
      try {
        if (viewer && viewer.scene && viewer.scene.primitives) {
          viewer.scene.primitives.remove(primitive)
        }
      } catch (e) {}
      try {
        if (primitive && typeof primitive.isDestroyed === 'function' && !primitive.isDestroyed()) {
          primitive.destroy()
        } else if (primitive && typeof primitive.destroy === 'function' && typeof primitive.isDestroyed !== 'function') {
          primitive.destroy()
        }
      } catch (e) {}
    }

    this._updateCallback = null
    this._removeListener = null
    this._isInitialized = false
    this._isLoading = false
  }
}

const AdditionalRiversBorderFlow = {
  _primitive: null,
  _removeListener: null,
  _updateCallback: null,
  _isInitialized: false,
  _isLoading: false,
  _duration: 3000,
  _destroyed: false,
  _lifecycleId: 0,

  // 初始化方法：加载数据并创建 Primitive，但默认隐藏
  async init() {
    if (this._isInitialized || this._isLoading) return
    this._isLoading = true
    this._destroyed = false
    const lifecycleId = ++this._lifecycleId
    
    const viewer = await EarthManager.getViewer()

    // 异步延迟执行，避免阻塞主线程
    setTimeout(async () => {
      if (this._destroyed || lifecycleId !== this._lifecycleId) return
      try {
        const g1 = await fetchJson(引江济淮_merged);
        const g2 = await fetchJson(运河_merged);
        const g3 = await fetchJson(支流_merged);
        const sources = [g1, g2, g3]
        const instances = []

        sources.forEach((source, index) => {
          const features = source && source.features ? source.features : []
          features.forEach(f => {
            const g = f && f.geometry
            if (!g) return

            const processRing = (ring) => {
              if (!ring || ring.length < 2) return

              // 计算边界和极值点索引
              let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90
              let minLonIdx = 0, maxLonIdx = 0, minLatIdx = 0, maxLatIdx = 0

              for (let i = 0; i < ring.length; i++) {
                const lon = ring[i][0]
                const lat = ring[i][1]
                if (lon < minLon) { minLon = lon; minLonIdx = i }
                if (lon > maxLon) { maxLon = lon; maxLonIdx = i }
                if (lat < minLat) { minLat = lat; minLatIdx = i }
                if (lat > maxLat) { maxLat = lat; maxLatIdx = i }
              }

              // 判断河流主要走向
              const width = maxLon - minLon
              const height = maxLat - minLat
              const isHorizontal = width >= height

              let startIdx, endIdx

              if (index === 0 || index === 1) {
                startIdx = maxLatIdx // 北
                endIdx = minLatIdx   // 南
              } else {
                if (isHorizontal) {
                  startIdx = minLonIdx
                  endIdx = maxLonIdx
                } else {
                  const centerLat = (minLat + maxLat) / 2
                  const THRESHOLD_LAT = 30.5
                  
                  if (centerLat > THRESHOLD_LAT) {
                    startIdx = minLatIdx
                    endIdx = maxLatIdx
                  } else {
                    startIdx = maxLatIdx
                    endIdx = minLatIdx
                  }
                }
              }

              // 重排环
              const rotatedRing = []
              for (let i = 0; i < ring.length; i++) {
                rotatedRing.push(ring[(startIdx + i) % ring.length])
              }

              const newEndIdx = (endIdx - startIdx + ring.length) % ring.length

              const pathA = rotatedRing.slice(0, newEndIdx + 1)
              const pathB = rotatedRing.slice(newEndIdx)
              const pathB_reversed = [...pathB].reverse()

              // 收集 Path A
              if (pathA.length > 1) {
                const positionsA = Cesium.Cartesian3.fromDegreesArray(pathA.flat(Infinity))
                instances.push(new Cesium.GeometryInstance({
                  geometry: new Cesium.GroundPolylineGeometry({
                    positions: positionsA,
                    width: 3.0
                  })
                }))
              }

              // 收集 Path B (Reversed)
              if (pathB_reversed.length > 1) {
                const positionsB = Cesium.Cartesian3.fromDegreesArray(pathB_reversed.flat(Infinity))
                instances.push(new Cesium.GeometryInstance({
                  geometry: new Cesium.GroundPolylineGeometry({
                    positions: positionsB,
                    width: 3.0
                  })
                }))
              }
            }

            if (g.type === 'Polygon') {
              const rings = g.coordinates || []
              if (rings.length > 0) {
                processRing(rings[0])
              }
            } else if (g.type === 'MultiPolygon') {
              const polys = g.coordinates || []
              polys.forEach(rings => {
                if (rings && rings.length > 0) {
                  processRing(rings[0])
                }
              })
            }
          })
        })

        if (instances.length > 0) {
          // 清理旧资源
          if (this._primitive) {
            viewer.scene.primitives.remove(this._primitive)
            this._primitive = null
          }
          if (this._removeListener) {
            this._removeListener()
            this._removeListener = null
          }

          const material = Cesium.Material.fromType('DoubleSpriteline', {
            image: w,
            color: Cesium.Color.fromCssColorString('#81f0ff').withAlpha(1),
            duration: this._duration
          })
          
          material.uniforms.time = 0.0

          const primitive = new Cesium.GroundPolylinePrimitive({
            geometryInstances: instances,
            appearance: new Cesium.PolylineMaterialAppearance({
              material: material
            }),
            asynchronous: true,
            show: false // 默认隐藏，实现预加载但不显示
          })
          
          viewer.scene.primitives.add(primitive)
          this._primitive = primitive

          // 设置更新逻辑，但先不启动
          const startTime = performance.now()
          const self = this
          this._updateCallback = function() {
            if (primitive.isDestroyed()) return
            if (material && material.uniforms) {
               material.uniforms.time = ((performance.now() - startTime) % self._duration) / self._duration
            }
          }
          
          console.log('AdditionalRiversBorderFlow init finished')
        }
      } catch (e) {
        console.error('AdditionalRiversBorderFlow init error:', e)
      } finally {
        this._isInitialized = true
        this._isLoading = false
      }
    }, 100)
  },

  async show(enableFlow = false) {
    // 确保初始化完成
    if (!this._isInitialized) {
        if (!this._isLoading) {
            await this.init()
        }
        // 简单轮询等待初始化
        while(!this._isInitialized) {
            await sleep(50)
        }
    }

    const viewer = await EarthManager.getViewer()
    
    if (this._primitive) {
      this._primitive.show = true
      
      // 只有传递 true 才开启流动效果
      if (enableFlow === true) {
        if (!this._removeListener && this._updateCallback) {
          this._removeListener = viewer.scene.preUpdate.addEventListener(this._updateCallback)
        }
      } else {
        if (this._removeListener) {
            this._removeListener()
            this._removeListener = null
        }
      }
    }

    viewer.scene.requestRender()
  },

  async hide() {
    if (this._primitive) {
      this._primitive.show = false
      
      // 停止动画监听以节省性能
      if (this._removeListener) {
        this._removeListener()
        this._removeListener = null
      }
    }
  },

  async destroy() {
    this._destroyed = true
    this._lifecycleId++

    try {
      await this.hide()
    } catch (e) {}

    let viewer = null
    try {
      viewer = await EarthManager.getViewer()
    } catch (e) {}

    const primitive = this._primitive
    this._primitive = null

    if (primitive) {
      try {
        if (viewer && viewer.scene && viewer.scene.primitives) {
          viewer.scene.primitives.remove(primitive)
        }
      } catch (e) {}
      try {
        if (primitive && typeof primitive.isDestroyed === 'function' && !primitive.isDestroyed()) {
          primitive.destroy()
        } else if (primitive && typeof primitive.destroy === 'function' && typeof primitive.isDestroyed !== 'function') {
          primitive.destroy()
        }
      } catch (e) {}
    }

    this._updateCallback = null
    this._removeListener = null
    this._isInitialized = false
    this._isLoading = false
  }
}

export default { river, boundary, allCity, allWater, TextWater, MainRiverWater, MainRiverWaterShiny, AdditionalRiversWater, MainRiverBorderFlow, AdditionalRiversBorderFlow, createAnimatedLine, removeAnimatedLine }
