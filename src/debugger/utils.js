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
  
  input.onfocus = () => input.style.borderColor = '#3b82f6';
  input.onblur = () => input.style.borderColor = 'rgba(255, 255, 255, 0.2)';
  
  return input;
}

export function colorToHex(color) {
  if (!color) return '#000000';
  if (color.startsWith('#')) {
    if (color.length === 4) {
      return '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
    }
    return color;
  }
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  return ctx.fillStyle;
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
    flashDuration: '周期(ms)',
    copyConfig: '复制配置',
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
    bgColor: '背景',
    displayHeight: '可见高度',
    min: '最小',
    max: '最大'
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
    bgColor: 'Bg',
    displayHeight: 'Visible Ht',
    min: 'Min',
    max: 'Max'
  }
};

export function t(key, lang = 'zh') {
  return translations[lang][key] || key;
}
