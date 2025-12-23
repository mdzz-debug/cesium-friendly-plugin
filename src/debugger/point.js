import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderPointDebugger(container, point, lang = 'zh') {
  const pos = point.position || [0, 0, 0];
  const groupName = point.group || t('defaultGroup', lang);

  // Info Box (ID, Type, Group, Coords)
  const infoBox = document.createElement('div');
  infoBox.style.cssText = `
    margin-bottom: 20px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    padding: 12px;
    border: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  
  // Header: Type + Group
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;

  // Type Badge
  const typeBadge = document.createElement('div');
  typeBadge.textContent = point.type.toUpperCase();
  typeBadge.style.cssText = `
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  `;
  headerRow.appendChild(typeBadge);

  // Group Badge
  const groupBadge = document.createElement('div');
  groupBadge.textContent = groupName;
  groupBadge.title = t('group', lang);
  groupBadge.style.cssText = `
    padding: 2px 8px;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  `;
  headerRow.appendChild(groupBadge);
  infoBox.appendChild(headerRow);

  // ID Row
  const idRow = document.createElement('div');
  idRow.textContent = point.id;
  idRow.title = point.id;
  idRow.style.cssText = `
    color: #94a3b8;
    font-size: 11px;
    font-family: monospace;
    word-break: break-all;
    line-height: 1.4;
  `;
  infoBox.appendChild(idRow);

  // Coords Grid
  const coordsGrid = document.createElement('div');
  coordsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    font-size: 11px;
    color: #e0e0e0;
    font-family: monospace;
    background: rgba(0,0,0,0.2);
    padding: 8px;
    border-radius: 4px;
  `;

  const createCoordItem = (label, value) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '2px';
    item.innerHTML = `
      <span style="color:#64748b; font-size: 10px;">${label}</span>
      <span style="color:#e2e8f0;">${value}</span>
    `;
    return item;
  };

  let alt = pos[2] || 0;
  if (point.heightReference !== 'none') {
    alt = point.heightOffset || 0;
  }

  coordsGrid.appendChild(createCoordItem(t('lng', lang), pos[0].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('lat', lang), pos[1].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('alt', lang), alt.toFixed(2)));
  infoBox.appendChild(coordsGrid);

  container.appendChild(infoBox);

  // Height Control (Clamp & Offset)
  const heightRow = createControlRow(t('height', lang));
  const heightContainer = document.createElement('div');
  heightContainer.style.display = 'flex';
  heightContainer.style.gap = '8px';
  heightContainer.style.alignItems = 'center';

  // Clamp Checkbox
  const clampLabel = document.createElement('label');
  clampLabel.style.display = 'flex';
  clampLabel.style.alignItems = 'center';
  clampLabel.style.fontSize = '11px';
  clampLabel.style.color = '#ccc';
  clampLabel.style.gap = '4px';
  
  const clampCheck = document.createElement('input');
  clampCheck.type = 'checkbox';
  clampCheck.checked = point.heightReference === 'clampToGround';
  clampCheck.style.cursor = 'pointer';
  
  clampLabel.appendChild(clampCheck);
  clampLabel.appendChild(document.createTextNode(t('clamp', lang)));
  heightContainer.appendChild(clampLabel);

  // Height Offset Input
  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.step = '1';
  heightInput.value = point.heightOffset || 0;
  heightInput.placeholder = t('offset', lang);
  heightInput.style.flex = '1';
  heightInput.style.minWidth = '0';
  styleInput(heightInput);

  // Events
  clampCheck.addEventListener('change', (e) => {
    point.setClampToGround(e.target.checked);
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      point.setHeight(val);
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  container.appendChild(heightRow);

  // Color
  const colorRow = createControlRow(t('color', lang));
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(point.color);
  colorInput.style.cursor = 'pointer';
  colorInput.style.width = '40px';
  colorInput.style.height = '24px';
  colorInput.style.border = 'none';
  colorInput.style.padding = '0';
  colorInput.style.background = 'transparent';
  colorInput.addEventListener('input', (e) => {
    point.setColor(e.target.value);
  });
  colorRow.appendChild(colorInput);
  container.appendChild(colorRow);

  // Pixel Size
  const sizeRow = createControlRow(`${t('pixelSize', lang)} (px)`);
  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = '1';
  sizeInput.max = '100';
  sizeInput.value = point.pixelSize;
  sizeInput.style.flex = '1';
  sizeInput.style.minWidth = '0';
  styleInput(sizeInput);
  sizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      point.setPixelSize(val);
    }
  });
  sizeRow.appendChild(sizeInput);
  container.appendChild(sizeRow);

  // Opacity
  const opacityRow = createControlRow(t('opacity', lang));
  const opacityInput = document.createElement('input');
  opacityInput.type = 'range';
  opacityInput.min = '0';
  opacityInput.max = '1';
  opacityInput.step = '0.1';
  opacityInput.value = point.opacity;
  opacityInput.style.flex = '1';
  opacityInput.style.minWidth = '0';
  opacityInput.style.cursor = 'pointer';
  opacityInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    point.setOpacity(val);
  });
  opacityRow.appendChild(opacityInput);
  container.appendChild(opacityRow);

  // Outline Control
  const outlineRow = createControlRow(t('outline', lang));
  const outlineContainer = document.createElement('div');
  outlineContainer.style.display = 'flex';
  outlineContainer.style.gap = '8px';
  outlineContainer.style.alignItems = 'center';

  const outlineCheck = document.createElement('input');
  outlineCheck.type = 'checkbox';
  outlineCheck.checked = point.outline;
  outlineCheck.style.cursor = 'pointer';

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  outlineColorInput.value = colorToHex(point.outlineColor || '#FFFFFF');
  outlineColorInput.style.width = '30px';
  outlineColorInput.style.height = '20px';
  outlineColorInput.style.border = 'none';
  outlineColorInput.style.padding = '0';
  outlineColorInput.style.background = 'transparent';
  outlineColorInput.style.cursor = 'pointer';

  const outlineWidthInput = document.createElement('input');
  outlineWidthInput.type = 'number';
  outlineWidthInput.min = '1';
  outlineWidthInput.max = '10';
  outlineWidthInput.value = point.outlineWidth || 2;
  outlineWidthInput.style.width = '50px';
  styleInput(outlineWidthInput);

  const updateOutline = () => {
    point.setOutline(
      outlineCheck.checked,
      outlineColorInput.value,
      parseInt(outlineWidthInput.value)
    );
  };

  outlineCheck.addEventListener('change', updateOutline);
  outlineColorInput.addEventListener('input', updateOutline);
  outlineWidthInput.addEventListener('input', updateOutline);

  outlineContainer.appendChild(outlineCheck);
  outlineContainer.appendChild(outlineColorInput);
  outlineContainer.appendChild(outlineWidthInput);
  outlineRow.appendChild(outlineContainer);
  container.appendChild(outlineRow);

  // Distance Display
  const distanceRow = createControlRow(t('distanceDisplay', lang));
  const distanceContainer = document.createElement('div');
  distanceContainer.style.display = 'flex';
  distanceContainer.style.gap = '4px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.near : 0;
  nearInput.style.flex = '1';
  nearInput.style.minWidth = '0';
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.far : '';
  farInput.style.flex = '1';
  farInput.style.minWidth = '0';
  styleInput(farInput);

  const updateDistance = () => {
    const n = parseFloat(nearInput.value) || 0;
    const f = parseFloat(farInput.value);
    point.setDistanceDisplayCondition(n, isNaN(f) ? undefined : f);
  };
  nearInput.addEventListener('input', updateDistance);
  farInput.addEventListener('input', updateDistance);

  distanceContainer.appendChild(nearInput);
  distanceContainer.appendChild(farInput);
  distanceRow.appendChild(distanceContainer);
  container.appendChild(distanceRow);

  // Scale By Distance
  const scaleDistRow = createControlRow(t('scaleByDistance', lang));
  const scaleDistContainer = document.createElement('div');
  scaleDistContainer.style.display = 'grid';
  scaleDistContainer.style.gridTemplateColumns = '1fr 1fr';
  scaleDistContainer.style.gap = '4px';

  const snInput = document.createElement('input');
  snInput.type = 'number';
  snInput.placeholder = t('near', lang);
  snInput.value = point.scaleByDistance ? point.scaleByDistance.near : '';
  snInput.style.flex = '1';
  snInput.style.minWidth = '0';
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = point.scaleByDistance ? point.scaleByDistance.nearValue : '';
  snvInput.style.flex = '1';
  snvInput.style.minWidth = '0';
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = point.scaleByDistance ? point.scaleByDistance.far : '';
  sfInput.style.flex = '1';
  sfInput.style.minWidth = '0';
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = point.scaleByDistance ? point.scaleByDistance.farValue : '';
  sfvInput.style.flex = '1';
  sfvInput.style.minWidth = '0';
  styleInput(sfvInput);

  const updateScaleByDist = () => {
    const n = parseFloat(snInput.value);
    const nv = parseFloat(snvInput.value);
    const f = parseFloat(sfInput.value);
    const fv = parseFloat(sfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        point.setScaleByDistance(n, nv, f, fv);
    }
  };
  snInput.addEventListener('input', updateScaleByDist);
  snvInput.addEventListener('input', updateScaleByDist);
  sfInput.addEventListener('input', updateScaleByDist);
  sfvInput.addEventListener('input', updateScaleByDist);

  scaleDistContainer.appendChild(snInput);
  scaleDistContainer.appendChild(snvInput);
  scaleDistContainer.appendChild(sfInput);
  scaleDistContainer.appendChild(sfvInput);
  scaleDistRow.appendChild(scaleDistContainer);
  container.appendChild(scaleDistRow);

  // Translucency By Distance
  const transDistRow = createControlRow(t('translucencyByDistance', lang));
  const transDistContainer = document.createElement('div');
  transDistContainer.style.display = 'grid';
  transDistContainer.style.gridTemplateColumns = '1fr 1fr';
  transDistContainer.style.gap = '4px';

  const tnInput = document.createElement('input');
  tnInput.type = 'number';
  tnInput.placeholder = t('near', lang);
  tnInput.value = point.translucencyByDistance ? point.translucencyByDistance.near : '';
  tnInput.style.flex = '1';
  tnInput.style.minWidth = '0';
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = point.translucencyByDistance ? point.translucencyByDistance.nearValue : '';
  tnvInput.style.flex = '1';
  tnvInput.style.minWidth = '0';
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = point.translucencyByDistance ? point.translucencyByDistance.far : '';
  tfInput.style.flex = '1';
  tfInput.style.minWidth = '0';
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = point.translucencyByDistance ? point.translucencyByDistance.farValue : '';
  tfvInput.style.flex = '1';
  tfvInput.style.minWidth = '0';
  styleInput(tfvInput);

  const updateTransByDist = () => {
    const n = parseFloat(tnInput.value);
    const nv = parseFloat(tnvInput.value);
    const f = parseFloat(tfInput.value);
    const fv = parseFloat(tfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        point.setTranslucencyByDistance(n, nv, f, fv);
    }
  };
  tnInput.addEventListener('input', updateTransByDist);
  tnvInput.addEventListener('input', updateTransByDist);
  tfInput.addEventListener('input', updateTransByDist);
  tfvInput.addEventListener('input', updateTransByDist);

  transDistContainer.appendChild(tnInput);
  transDistContainer.appendChild(tnvInput);
  transDistContainer.appendChild(tfInput);
  transDistContainer.appendChild(tfvInput);
  transDistRow.appendChild(transDistContainer);
  container.appendChild(transDistRow);

  // Disable Depth Test Distance
  const depthTestRow = createControlRow(t('depthTest', lang));
  const depthTestContainer = document.createElement('div');
  depthTestContainer.style.display = 'flex';
  depthTestContainer.style.gap = '8px';
  depthTestContainer.style.alignItems = 'center';

  const depthTestCheck = document.createElement('input');
  depthTestCheck.type = 'checkbox';
  depthTestCheck.checked = point.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  depthTestCheck.style.cursor = 'pointer';

  const depthTestLabel = document.createElement('span');
  depthTestLabel.textContent = t('alwaysOnTop', lang);
  depthTestLabel.style.fontSize = '12px';
  depthTestLabel.style.color = '#ccc';

  depthTestCheck.addEventListener('change', (e) => {
    // If checked (Always On Top), we set to Infinity. Otherwise undefined (default depth test)
    point.setDisableDepthTestDistance(e.target.checked ? Number.POSITIVE_INFINITY : undefined);
  });

  depthTestContainer.appendChild(depthTestCheck);
  depthTestContainer.appendChild(depthTestLabel);
  depthTestRow.appendChild(depthTestContainer);
  container.appendChild(depthTestRow);

  // Copy Config Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '10px';
  btnRow.style.marginTop = '20px';

  const copyNativeBtn = createButton(t('copyNative', lang), () => {
    const isRelative = point.heightReference === 'relativeToGround';
    const h = isRelative ? (point.heightOffset || 0) : (point.position[2] || 0) + (point.heightOffset || 0);
    
    let nativeCode = `viewer.entities.add({\n` +
      `  position: Cesium.Cartesian3.fromDegrees(${point.position[0]}, ${point.position[1]}, ${h}),\n` +
      `  point: {\n` +
      `    pixelSize: ${point.pixelSize},\n` +
      `    color: Cesium.Color.fromCssColorString('${point.color}').withAlpha(${point.opacity}),\n` +
      `    outlineWidth: ${point.outline ? point.outlineWidth : 0},\n` +
      `    outlineColor: ${point.outline ? `Cesium.Color.fromCssColorString('${point.outlineColor}').withAlpha(${point.opacity})` : 'Cesium.Color.TRANSPARENT'},\n`;

    if (point.heightReference === 'clampToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,\n`;
    } else if (point.heightReference === 'relativeToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,\n`;
    }

    if (point.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        nativeCode += `    disableDepthTestDistance: Number.POSITIVE_INFINITY,\n`;
    }

    if (point.distanceDisplayCondition) {
        nativeCode += `    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(${point.distanceDisplayCondition.near}, ${point.distanceDisplayCondition.far}),\n`;
    }

    if (point.scaleByDistance) {
        nativeCode += `    scaleByDistance: new Cesium.NearFarScalar(${point.scaleByDistance.near}, ${point.scaleByDistance.nearValue}, ${point.scaleByDistance.far}, ${point.scaleByDistance.farValue}),\n`;
    }
    
    if (point.translucencyByDistance) {
        nativeCode += `    translucencyByDistance: new Cesium.NearFarScalar(${point.translucencyByDistance.near}, ${point.translucencyByDistance.nearValue}, ${point.translucencyByDistance.far}, ${point.translucencyByDistance.farValue}),\n`;
    }

    nativeCode += `  }\n});`;

    navigator.clipboard.writeText(nativeCode)
      .then(() => {
        const originalText = copyNativeBtn.textContent;
        copyNativeBtn.textContent = t('copied', lang);
        copyNativeBtn.style.background = '#10b981';
        setTimeout(() => {
          copyNativeBtn.textContent = originalText;
          copyNativeBtn.style.background = '#3b82f6';
        }, 2000);
      });
  });

  const copyChainBtn = createButton(t('copyChain', lang), () => {
    let chain = `entity.point({\n` +
      `  color: '${point.color}',\n` +
      `  pixelSize: ${point.pixelSize},\n` +
      `  opacity: ${point.opacity},\n` +
      `  outline: ${point.outline},\n` +
      `  outlineColor: '${point.outlineColor}',\n` +
      `  outlineWidth: ${point.outlineWidth}`;

    if (point.heightReference === 'clampToGround') {
      chain += `,\n  heightReference: 'clampToGround'`;
    } else if (point.heightReference === 'relativeToGround') {
      chain += `,\n  heightReference: 'relativeToGround'`;
    }

    if (point.heightOffset !== 0) {
      chain += `,\n  heightOffset: ${point.heightOffset}`;
    }
    
    if (point.distanceDisplayCondition) {
        chain += `,\n  distanceDisplayCondition: { near: ${point.distanceDisplayCondition.near}, far: ${point.distanceDisplayCondition.far} }`;
    }
    if (point.scaleByDistance) {
        chain += `,\n  scaleByDistance: { near: ${point.scaleByDistance.near}, nearValue: ${point.scaleByDistance.nearValue}, far: ${point.scaleByDistance.far}, farValue: ${point.scaleByDistance.farValue} }`;
    }
    if (point.translucencyByDistance) {
        chain += `,\n  translucencyByDistance: { near: ${point.translucencyByDistance.near}, nearValue: ${point.translucencyByDistance.nearValue}, far: ${point.translucencyByDistance.far}, farValue: ${point.translucencyByDistance.farValue} }`;
    }
    if (point.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        chain += `,\n  disableDepthTestDistance: true`;
    }

    chain += `\n})`;

    navigator.clipboard.writeText(chain)
      .then(() => {
        const originalText = copyChainBtn.textContent;
        copyChainBtn.textContent = t('copied', lang);
        copyChainBtn.style.background = '#10b981';
        setTimeout(() => {
          copyChainBtn.textContent = originalText;
          copyChainBtn.style.background = 'rgba(255,255,255,0.1)';
        }, 2000);
      });
  }, 'secondary');

  btnRow.appendChild(copyNativeBtn);
  btnRow.appendChild(copyChainBtn);
  container.appendChild(btnRow);
}
