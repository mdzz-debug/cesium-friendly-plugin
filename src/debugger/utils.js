export function createControlRow(label, width) {
  const row = document.createElement('div');
  row.style.marginBottom = '16px';
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.justifyContent = 'space-between';
  
  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.style.fontSize = '13px';
  labelEl.style.color = '#ccc';
  labelEl.style.fontWeight = '500';
  
  if (width) {
    labelEl.style.width = width;
    labelEl.style.flexShrink = '0';
  }

  row.appendChild(labelEl);
  
  return row;
}

export function createButton(text, onClick, variant = 'primary') {
  const btn = document.createElement('button');
  btn.textContent = text;
  
  const bg = variant === 'secondary' ? 'rgba(255,255,255,0.1)' : '#3b82f6';
  const hoverBg = variant === 'secondary' ? 'rgba(255,255,255,0.2)' : '#2563eb';

  btn.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    background: ${bg};
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: background 0.2s;
    white-space: nowrap;
  `;
  btn.onmouseover = () => btn.style.background = hoverBg;
  btn.onmouseout = () => btn.style.background = bg;
  btn.onclick = onClick;
  return btn;
}

export function styleInput(input) {
  input.style.background = 'rgba(255, 255, 255, 0.1)';
  input.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  input.style.color = '#fff';
  input.style.borderRadius = '4px';
  input.style.padding = '4px 8px';
  input.style.outline = 'none';
  input.style.fontSize = '12px';
  input.style.boxSizing = 'border-box';
  
  input.onfocus = () => input.style.borderColor = '#3b82f6';
  input.onblur = () => input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  
  return input;
}

export function getColorAlpha(color) {
  if (!color) return 1;
  
  if (typeof color === 'object' && typeof color.alpha === 'number') {
    return color.alpha;
  }
  
  if (typeof color !== 'string') return 1;

  const lower = color.toLowerCase();
  if (lower.startsWith('rgba')) {
    const match = lower.match(/rgba\s*\(\s*[0-9]+\s*,\s*[0-9]+\s*,\s*[0-9]+\s*,\s*([0-9.]+)\s*\)/);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return 1;
}

export function colorToHex(color) {
  if (!color) return '#000000';
  
  // Handle Cesium.Color object or similar with toCssColorString
  if (typeof color === 'object' && typeof color.toCssColorString === 'function') {
    return colorToHex(color.toCssColorString());
  }
  
  if (typeof color !== 'string') return '#000000';

  if (color.startsWith('#')) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color;
  }
  const lower = color.toLowerCase();
  if (lower.startsWith('rgb')) {
    const match = lower.match(/rgba?\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
    if (match) {
      const r = Math.max(0, Math.min(255, parseInt(match[1], 10)));
      const g = Math.max(0, Math.min(255, parseInt(match[2], 10)));
      const b = Math.max(0, Math.min(255, parseInt(match[3], 10)));
      const toHex = (v) => v.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  }
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  const v = ctx.fillStyle;
  if (typeof v === 'string' && v.toLowerCase().startsWith('rgb')) {
    const m = v.toLowerCase().match(/rgba?\s*\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
    if (m) {
      const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
      const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
      const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
      const toHex = (v2) => v2.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  }
  return v || '#000000';
}

const translations = {
  zh: {
    title: '实体调试',
    group: '分组',
    defaultGroup: '默认',
    location: '坐标',
    color: '颜色',
    pixelSize: '像素大小',
    opacity: '透明度',
    outline: '轮廓',
    flash: '闪烁(毫秒)',
    draggable: '拖拽',
    flashDuration: '周期(ms)',
    copyConfig: '复制配置',
    copyNative: '复制原生',
    copyChain: '复制链式',
    copied: '已复制!',
    rotation: '旋转角度',
    scale: '缩放比例',
    height: '高度控制',
    clamp: '贴地',
    offset: '偏移',
    tintColor: '着色',
    image: '图片',
    lng: '经度',
    lat: '纬度',
    alt: '高度',
    size: '大小',
    ms: '毫秒',
    px: '像素',
    deg: '度',
    label: '标签',
    showLabel: '显示',
    labelText: '内容',
    bold: '加粗',
    labelHeight: '海拔偏移',
    pixelOffset: '像素偏移',
    eyeOffset: '视点偏移',
    depthTest: '深度检测',
    alwaysOnTop: '始终置顶',
    bgColor: '背景',
    displayHeight: '可见高度',
    min: '最小',
    max: '最大',
    earthControl: '地球控制',
    flyTo: '飞行定位',
    autoRotate: '地球自转',
    roaming: '飞行漫游',
    orbit: '绕点飞行',
    surfaceTransparency: '地表透明度',
    speed: '速度',
    radius: '半径',
    start: '开始',
    stop: '停止',
    currentView: '获取当前视角',
    heading: '偏航角',
    pitch: '俯仰角',
    roll: '翻滚角',
    functionArea: '功能区',
    orbitEarth: '围绕地球 (1秒飞行+3圈旋转)',
    width: '宽度',
    height: '高度',
    sizeInMeters: '单位米',
    horizontalOrigin: '水平原点',
    verticalOrigin: '垂直原点',
    distanceDisplay: '距离显示',
    scaleByDistance: '按距离缩放',
    translucencyByDistance: '按距离透明',
    pixelOffsetScaleByDistance: '按距离偏移',
    near: '近距离',
    far: '远距离',
    nearValue: '近值',
    farValue: '远值',
    font: '字体',
    style: '样式',
    posAndGeo: '位置与几何',
    displayControl: '显示控制',
    center: '居中',
    left: '左',
    right: '右',
    top: '上',
    bottom: '下',
    baseline: '基线',
    fill: '填充',
    outline: '轮廓',
    fillAndOutline: '填充和轮廓',
    background: '背景',
    text: '文本',
    saveState: '保存状态',
    restoreState: '恢复状态',
    // New Additions
    addPoint: '添加点',
    add2DGeo: '添加2D几何',
    addLinesAndWalls: '添加线/墙/走廊',
    add3DGeo: '添加3D几何',
    circle: '圆形',
    ellipse: '椭圆',
    rectangle: '矩形',
    polygon: '多边形',
    polyline: '线',
    polylineVolume: '折线体',
    corridor: '走廊',
    wall: '墙',
    box: '盒子',
    sphere: '球体',
    cylinder: '圆柱',
    cone: '圆锥',
    ellipsoid: '椭球',
    extrudedHeight: '挤出高度',
    topRadius: '顶半径',
    bottomRadius: '底半径',
    groundHeight: '离地高度',
    rotationAxis: '旋转轴'
  },
  en: {
    title: 'Debugger',
    group: 'Group',
    defaultGroup: 'Default',
    location: 'Location',
    color: 'Color',
    pixelSize: 'Size (px)',
    opacity: 'Opacity',
    outline: 'Outline',
    flash: 'Flash (ms)',
    flashDuration: 'Period (ms)',
    copyConfig: 'Copy Config',
    copyNative: 'Copy Native',
    copyChain: 'Copy Chain',
    copied: 'Copied!',
    rotation: 'Rotation',
    scale: 'Scale',
    height: 'Height Control',
    clamp: 'Clamp',
    offset: 'Offset',
    tintColor: 'Tint',
    image: 'Image',
    lng: 'Lon',
    lat: 'Lat',
    alt: 'Alt',
    size: 'Size',
    ms: 'ms',
    px: 'px',
    deg: 'deg',
    label: 'Label',
    showLabel: 'Show',
    labelText: 'Text',
    bold: 'Bold',
    labelHeight: 'Alt Offset',
    pixelOffset: 'Px Offset',
    eyeOffset: 'Eye Offset',
    depthTest: 'Depth Test',
    alwaysOnTop: 'Always On Top',
    bgColor: 'Bg',
    displayHeight: 'Visible Ht',
    draggable: 'Draggable',
    min: 'Min',
    max: 'Max',
    earthControl: 'Earth Control',
    flyTo: 'Fly To',
    autoRotate: 'Auto Rotate',
    roaming: 'Roaming',
    orbit: 'Orbit',
    surfaceTransparency: 'Surface Opacity',
    speed: 'Speed',
    radius: 'Radius',
    start: 'Start',
    stop: 'Stop',
    currentView: 'Get Current View',
    heading: 'Heading',
    pitch: 'Pitch',
    roll: 'Roll',
    functionArea: 'Functions',
    orbitEarth: 'Orbit Earth (5s Fly + 3 Cycles)',
    width: 'Width',
    height: 'Height',
    sizeInMeters: 'Size in Meters',
    horizontalOrigin: 'Horiz Origin',
    verticalOrigin: 'Vert Origin',
    distanceDisplay: 'Dist Display',
    scaleByDistance: 'Scale By Dist',
    translucencyByDistance: 'Trans By Dist',
    pixelOffsetScaleByDistance: 'Offset Scale By Dist',
    near: 'Near',
    far: 'Far',
    nearValue: 'Near Val',
    farValue: 'Far Val',
    font: 'Font',
    style: 'Style',
    posAndGeo: 'Position & Geometry',
    displayControl: 'Display Control',
    center: 'Center',
    left: 'Left',
    right: 'Right',
    top: 'Top',
    bottom: 'Bottom',
    baseline: 'Baseline',
    fill: 'Fill',
    outline: 'Outline',
    fillAndOutline: 'Fill & Outline',
    background: 'Background',
    text: 'Text',
    saveState: 'Save State',
    restoreState: 'Restore State',
    // New Additions
    addPoint: 'Add Point',
    add2DGeo: 'Add 2D Geo',
    addLinesAndWalls: 'Add Lines/Walls',
    add3DGeo: 'Add 3D Geo',
    circle: 'Circle',
    ellipse: 'Ellipse',
    rectangle: 'Rectangle',
    polygon: 'Polygon',
    polyline: 'Polyline',
    polylineVolume: 'Polyline Volume',
    corridor: 'Corridor',
    wall: 'Wall',
    box: 'Box',
    sphere: 'Sphere',
    cylinder: 'Cylinder',
    cone: 'Cone',
    ellipsoid: 'Ellipsoid',
    extrudedHeight: 'Extruded Height',
    topRadius: 'Top Radius',
    bottomRadius: 'Bottom Radius',
    groundHeight: 'Ground Height',
    rotationAxis: 'Rotation Axis'
  }
};

export function t(key, lang = 'zh') {
  return translations[lang][key] || key;
}
