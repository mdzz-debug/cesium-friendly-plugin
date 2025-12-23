import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderBillboardDebugger(container, billboard, lang = 'zh') {
  const pos = billboard.position || [0, 0, 0];
  const groupName = billboard.group || t('defaultGroup', lang);

  // Info Box
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

  // Header
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;

  const typeBadge = document.createElement('div');
  typeBadge.textContent = billboard.type.toUpperCase();
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

  const groupBadge = document.createElement('div');
  groupBadge.textContent = groupName;
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
  idRow.textContent = billboard.id;
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
  if (billboard.heightReference !== 'none') {
    alt = billboard.heightOffset || 0;
  }

  coordsGrid.appendChild(createCoordItem(t('lng', lang), pos[0].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('lat', lang), pos[1].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('alt', lang), alt.toFixed(2)));
  infoBox.appendChild(coordsGrid);

  container.appendChild(infoBox);

  // Height Control (Altitude)
  const heightRow = createControlRow(t('height', lang));
  const heightContainer = document.createElement('div');
  heightContainer.style.display = 'flex';
  heightContainer.style.gap = '8px';
  heightContainer.style.alignItems = 'center';

  const clampLabel = document.createElement('label');
  clampLabel.style.display = 'flex';
  clampLabel.style.alignItems = 'center';
  clampLabel.style.fontSize = '11px';
  clampLabel.style.color = '#ccc';
  clampLabel.style.gap = '4px';
  
  const clampCheck = document.createElement('input');
  clampCheck.type = 'checkbox';
  clampCheck.checked = billboard.heightReference === 'clampToGround';
  clampCheck.style.cursor = 'pointer';
  
  clampLabel.appendChild(clampCheck);
  clampLabel.appendChild(document.createTextNode(t('clamp', lang)));
  heightContainer.appendChild(clampLabel);

  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.step = '1';
  heightInput.value = billboard.heightOffset || 0;
  heightInput.placeholder = t('offset', lang);
  heightInput.style.flex = '1';
  heightInput.style.minWidth = '0';
  styleInput(heightInput);

  clampCheck.addEventListener('change', (e) => {
    billboard.setClampToGround(e.target.checked);
    if (e.target.checked) {
      heightInput.value = 0;
    }
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      billboard.setHeight(val); // Inherited from GeometryEntity
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  container.appendChild(heightRow);

  // Dimensions (Width/Height)
  const dimRow = createControlRow(`${t('width', lang)} / ${t('height', lang)}`);
  const dimContainer = document.createElement('div');
  dimContainer.style.display = 'flex';
  dimContainer.style.gap = '4px';

  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.placeholder = 'W';
  wInput.value = billboard.width || '';
  wInput.style.flex = '1';
  wInput.style.minWidth = '0';
  styleInput(wInput);

  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.placeholder = 'H';
  hInput.value = billboard.height || '';
  hInput.style.flex = '1';
  hInput.style.minWidth = '0';
  styleInput(hInput);

  wInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if(!isNaN(v)) billboard.setImageWidth(v);
  });

  hInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if(!isNaN(v)) billboard.setImageHeight(v);
  });

  dimContainer.appendChild(wInput);
  dimContainer.appendChild(hInput);
  dimRow.appendChild(dimContainer);
  container.appendChild(dimRow);

  // Size In Meters
  const metersRow = createControlRow(t('sizeInMeters', lang));
  const metersCheck = document.createElement('input');
  metersCheck.type = 'checkbox';
  metersCheck.checked = !!billboard.sizeInMeters;
  metersCheck.addEventListener('change', (e) => {
      billboard.setSizeInMeters(e.target.checked);
  });
  metersRow.appendChild(metersCheck);
  container.appendChild(metersRow);

  // Scale
  const scaleRow = createControlRow(t('scale', lang));
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.step = '0.1';
  scaleInput.min = '0.1';
  scaleInput.value = billboard.scale || 1.0;
  scaleInput.style.width = '60px';
  styleInput(scaleInput);
  scaleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      billboard.setScale(val);
    }
  });
  scaleRow.appendChild(scaleInput);
  container.appendChild(scaleRow);

  // Rotation
  const rotationRow = createControlRow(t('rotation', lang));
  const rotationInput = document.createElement('input');
  rotationInput.type = 'number';
  rotationInput.step = '1';
  rotationInput.value = billboard.rotation || 0;
  rotationInput.style.width = '60px';
  styleInput(rotationInput);
  rotationInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      billboard.setRotation(val);
    }
  });
  rotationRow.appendChild(rotationInput);
  container.appendChild(rotationRow);

  // Origins
  const originRow = createControlRow(`${t('horizontalOrigin', lang)} / ${t('verticalOrigin', lang)}`);
  const originContainer = document.createElement('div');
  originContainer.style.display = 'flex';
  originContainer.style.gap = '4px';

  const hOriginSel = document.createElement('select');
  ['CENTER', 'LEFT', 'RIGHT'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (billboard.horizontalOrigin === o) opt.selected = true;
      hOriginSel.appendChild(opt);
  });
  hOriginSel.style.flex = '1';
  hOriginSel.style.minWidth = '0';
  styleInput(hOriginSel);
  hOriginSel.addEventListener('change', (e) => billboard.setHorizontalOrigin(e.target.value));

  const vOriginSel = document.createElement('select');
  ['CENTER', 'BOTTOM', 'TOP', 'BASELINE'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (billboard.verticalOrigin === o) opt.selected = true;
      vOriginSel.appendChild(opt);
  });
  vOriginSel.style.flex = '1';
  vOriginSel.style.minWidth = '0';
  styleInput(vOriginSel);
  vOriginSel.addEventListener('change', (e) => billboard.setVerticalOrigin(e.target.value));

  originContainer.appendChild(hOriginSel);
  originContainer.appendChild(vOriginSel);
  originRow.appendChild(originContainer);
  container.appendChild(originRow);

  // Color
  const colorRow = createControlRow(t('color', lang));
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(billboard.color);
  colorInput.style.cursor = 'pointer';
  colorInput.style.width = '40px';
  colorInput.style.height = '24px';
  colorInput.style.border = 'none';
  colorInput.style.padding = '0';
  colorInput.style.background = 'transparent';
  colorInput.addEventListener('input', (e) => {
    billboard.setColor(e.target.value);
  });
  colorRow.appendChild(colorInput);
  container.appendChild(colorRow);

  // Distance Display
  const distanceRow = createControlRow(t('distanceDisplay', lang));
  const distanceContainer = document.createElement('div');
  distanceContainer.style.display = 'flex';
  distanceContainer.style.gap = '4px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = billboard.distanceDisplayCondition ? billboard.distanceDisplayCondition.near : 0;
  nearInput.style.flex = '1';
  nearInput.style.minWidth = '0';
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = billboard.distanceDisplayCondition ? billboard.distanceDisplayCondition.far : '';
  farInput.style.flex = '1';
  farInput.style.minWidth = '0';
  styleInput(farInput);

  const updateDistance = () => {
    const n = parseFloat(nearInput.value) || 0;
    const f = parseFloat(farInput.value);
    billboard.setDistanceDisplayCondition(n, isNaN(f) ? undefined : f);
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
  snInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.near : '';
  snInput.style.flex = '1';
  snInput.style.minWidth = '0';
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.nearValue : '';
  snvInput.style.flex = '1';
  snvInput.style.minWidth = '0';
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.far : '';
  sfInput.style.flex = '1';
  sfInput.style.minWidth = '0';
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.farValue : '';
  sfvInput.style.flex = '1';
  sfvInput.style.minWidth = '0';
  styleInput(sfvInput);

  const updateScaleByDist = () => {
    const n = parseFloat(snInput.value);
    const nv = parseFloat(snvInput.value);
    const f = parseFloat(sfInput.value);
    const fv = parseFloat(sfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        billboard.setScaleByDistance(n, nv, f, fv);
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
  tnInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.near : '';
  tnInput.style.flex = '1';
  tnInput.style.minWidth = '0';
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.nearValue : '';
  tnvInput.style.flex = '1';
  tnvInput.style.minWidth = '0';
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.far : '';
  tfInput.style.flex = '1';
  tfInput.style.minWidth = '0';
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.farValue : '';
  tfvInput.style.flex = '1';
  tfvInput.style.minWidth = '0';
  styleInput(tfvInput);

  const updateTransByDist = () => {
    const n = parseFloat(tnInput.value);
    const nv = parseFloat(tnvInput.value);
    const f = parseFloat(tfInput.value);
    const fv = parseFloat(tfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        billboard.setTranslucencyByDistance(n, nv, f, fv);
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

  // Pixel Offset Scale By Distance
  const posDistRow = createControlRow(t('pixelOffsetScaleByDistance', lang));
  const posDistContainer = document.createElement('div');
  posDistContainer.style.display = 'grid';
  posDistContainer.style.gridTemplateColumns = '1fr 1fr';
  posDistContainer.style.gap = '4px';

  const posnInput = document.createElement('input');
  posnInput.type = 'number';
  posnInput.placeholder = t('near', lang);
  posnInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.near : '';
  posnInput.style.flex = '1';
  posnInput.style.minWidth = '0';
  styleInput(posnInput);

  const posnvInput = document.createElement('input');
  posnvInput.type = 'number';
  posnvInput.placeholder = t('nearValue', lang);
  posnvInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.nearValue : '';
  posnvInput.style.flex = '1';
  posnvInput.style.minWidth = '0';
  styleInput(posnvInput);

  const posfInput = document.createElement('input');
  posfInput.type = 'number';
  posfInput.placeholder = t('far', lang);
  posfInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.far : '';
  posfInput.style.flex = '1';
  posfInput.style.minWidth = '0';
  styleInput(posfInput);

  const posfvInput = document.createElement('input');
  posfvInput.type = 'number';
  posfvInput.placeholder = t('farValue', lang);
  posfvInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.farValue : '';
  posfvInput.style.flex = '1';
  posfvInput.style.minWidth = '0';
  styleInput(posfvInput);

  const updatePosDist = () => {
    const n = parseFloat(posnInput.value);
    const nv = parseFloat(posnvInput.value);
    const f = parseFloat(posfInput.value);
    const fv = parseFloat(posfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        billboard.setPixelOffsetScaleByDistance(n, nv, f, fv);
    }
  };
  posnInput.addEventListener('input', updatePosDist);
  posnvInput.addEventListener('input', updatePosDist);
  posfInput.addEventListener('input', updatePosDist);
  posfvInput.addEventListener('input', updatePosDist);

  posDistContainer.appendChild(posnInput);
  posDistContainer.appendChild(posnvInput);
  posDistContainer.appendChild(posfInput);
  posDistContainer.appendChild(posfvInput);
  posDistRow.appendChild(posDistContainer);
  container.appendChild(posDistRow);

  // Disable Depth Test Distance
  const depthTestRow = createControlRow(t('depthTest', lang));
  const depthTestContainer = document.createElement('div');
  depthTestContainer.style.display = 'flex';
  depthTestContainer.style.gap = '8px';
  depthTestContainer.style.alignItems = 'center';

  const depthTestCheck = document.createElement('input');
  depthTestCheck.type = 'checkbox';
  depthTestCheck.checked = billboard.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  depthTestCheck.style.cursor = 'pointer';

  const depthTestLabel = document.createElement('span');
  depthTestLabel.textContent = t('alwaysOnTop', lang);
  depthTestLabel.style.fontSize = '12px';
  depthTestLabel.style.color = '#ccc';

  depthTestCheck.addEventListener('change', (e) => {
    billboard.setDisableDepthTestDistance(e.target.checked ? Number.POSITIVE_INFINITY : undefined);
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
    const isRelative = billboard.heightReference === 'relativeToGround';
    const h = isRelative ? (billboard.heightOffset || 0) : (billboard.position[2] || 0) + (billboard.heightOffset || 0);

    let nativeCode = `viewer.entities.add({\\n` +
      `  position: Cesium.Cartesian3.fromDegrees(${billboard.position[0]}, ${billboard.position[1]}, ${h}),\\n` +
      `  billboard: {\\n` +
      `    image: '${billboard.imageUrl || billboard.image}',\\n` +
      `    scale: ${billboard.scale || 1.0},\\n` +
      `    color: Cesium.Color.fromCssColorString('${billboard.color}'),\\n` +
      `    rotation: ${billboard.rotation || 0},\\n`;

    if (billboard.width) {
        nativeCode += `    width: ${billboard.width},\\n`;
    }
    if (billboard.height) {
        nativeCode += `    height: ${billboard.height},\\n`;
    }

    if (billboard.heightReference === 'clampToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,\\n`;
    } else if (billboard.heightReference === 'relativeToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,\\n`;
    }

    if (billboard.sizeInMeters) {
        nativeCode += `    sizeInMeters: true,\\n`;
    }

    if (billboard.pixelOffset) {
        nativeCode += `    pixelOffset: new Cesium.Cartesian2(${billboard.pixelOffset[0]}, ${billboard.pixelOffset[1]}),\\n`;
    }

    if (billboard.eyeOffset) {
        nativeCode += `    eyeOffset: new Cesium.Cartesian3(${billboard.eyeOffset[0]}, ${billboard.eyeOffset[1]}, ${billboard.eyeOffset[2]}),\\n`;
    }

    if (billboard.horizontalOrigin) {
        nativeCode += `    horizontalOrigin: Cesium.HorizontalOrigin.${billboard.horizontalOrigin},\\n`;
    }
    
    if (billboard.verticalOrigin) {
        nativeCode += `    verticalOrigin: Cesium.VerticalOrigin.${billboard.verticalOrigin},\\n`;
    }

    if (billboard.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        nativeCode += `    disableDepthTestDistance: Number.POSITIVE_INFINITY,\\n`;
    }

    if (billboard.distanceDisplayCondition) {
        nativeCode += `    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(${billboard.distanceDisplayCondition.near}, ${billboard.distanceDisplayCondition.far}),\\n`;
    }

    if (billboard.scaleByDistance) {
        nativeCode += `    scaleByDistance: new Cesium.NearFarScalar(${billboard.scaleByDistance.near}, ${billboard.scaleByDistance.nearValue}, ${billboard.scaleByDistance.far}, ${billboard.scaleByDistance.farValue}),\\n`;
    }
    
    if (billboard.translucencyByDistance) {
        nativeCode += `    translucencyByDistance: new Cesium.NearFarScalar(${billboard.translucencyByDistance.near}, ${billboard.translucencyByDistance.nearValue}, ${billboard.translucencyByDistance.far}, ${billboard.translucencyByDistance.farValue}),\\n`;
    }
    
    if (billboard.pixelOffsetScaleByDistance) {
        nativeCode += `    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(${billboard.pixelOffsetScaleByDistance.near}, ${billboard.pixelOffsetScaleByDistance.nearValue}, ${billboard.pixelOffsetScaleByDistance.far}, ${billboard.pixelOffsetScaleByDistance.farValue}),\\n`;
    }

    nativeCode += `  }\\n});`;

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
    let chain = `entity.billboard({\\n` +
      `  image: '${billboard.imageUrl || billboard.image}',\\n` +
      `  scale: ${billboard.scale || 1.0},\\n` +
      `  color: '${billboard.color}',\\n` +
      `  rotation: ${billboard.rotation || 0}`;

    if (billboard.heightReference === 'clampToGround') {
      chain += `,\\n  heightReference: 'clampToGround'`;
    } else if (billboard.heightReference === 'relativeToGround') {
      chain += `,\\n  heightReference: 'relativeToGround'`;
    }

    if (billboard.heightOffset !== 0) {
      chain += `,\\n  heightOffset: ${billboard.heightOffset}`;
    }

    if (billboard.width) {
      chain += `,\\n  width: ${billboard.width}`;
    }
    if (billboard.height) {
      chain += `,\\n  height: ${billboard.height}`;
    }
    if (billboard.sizeInMeters) {
        chain += `,\\n  sizeInMeters: true`;
    }
    if (billboard.pixelOffset && (billboard.pixelOffset[0] !== 0 || billboard.pixelOffset[1] !== 0)) {
        chain += `,\\n  pixelOffset: [${billboard.pixelOffset[0]}, ${billboard.pixelOffset[1]}]`;
    }
    if (billboard.eyeOffset && (billboard.eyeOffset[0] !== 0 || billboard.eyeOffset[1] !== 0 || billboard.eyeOffset[2] !== 0)) {
        chain += `,\\n  eyeOffset: [${billboard.eyeOffset[0]}, ${billboard.eyeOffset[1]}, ${billboard.eyeOffset[2]}]`;
    }
    if (billboard.horizontalOrigin) {
        chain += `,\\n  horizontalOrigin: '${billboard.horizontalOrigin}'`;
    }
    if (billboard.verticalOrigin) {
        chain += `,\\n  verticalOrigin: '${billboard.verticalOrigin}'`;
    }
    if (billboard.distanceDisplayCondition) {
        chain += `,\\n  distanceDisplayCondition: { near: ${billboard.distanceDisplayCondition.near}, far: ${billboard.distanceDisplayCondition.far} }`;
    }
    if (billboard.scaleByDistance) {
        chain += `,\\n  scaleByDistance: { near: ${billboard.scaleByDistance.near}, nearValue: ${billboard.scaleByDistance.nearValue}, far: ${billboard.scaleByDistance.far}, farValue: ${billboard.scaleByDistance.farValue} }`;
    }
    if (billboard.translucencyByDistance) {
        chain += `,\\n  translucencyByDistance: { near: ${billboard.translucencyByDistance.near}, nearValue: ${billboard.translucencyByDistance.nearValue}, far: ${billboard.translucencyByDistance.far}, farValue: ${billboard.translucencyByDistance.farValue} }`;
    }
    if (billboard.pixelOffsetScaleByDistance) {
        chain += `,\\n  pixelOffsetScaleByDistance: { near: ${billboard.pixelOffsetScaleByDistance.near}, nearValue: ${billboard.pixelOffsetScaleByDistance.nearValue}, far: ${billboard.pixelOffsetScaleByDistance.far}, farValue: ${billboard.pixelOffsetScaleByDistance.farValue} }`;
    }
    if (billboard.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        chain += `,\\n  disableDepthTestDistance: true`;
    }

    chain += `\\n})`;

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
