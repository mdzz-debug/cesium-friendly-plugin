import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderLabelDebugger(container, label, lang = 'zh') {
  const pos = label.position || [0, 0, 0];
  const groupName = label.group || t('defaultGroup', lang);

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
  typeBadge.textContent = label.type.toUpperCase();
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
  idRow.textContent = label.id;
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
  if (label.heightReference !== 'none') {
    alt = label.heightOffset || 0;
  }

  coordsGrid.appendChild(createCoordItem(t('lng', lang), pos[0].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('lat', lang), pos[1].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('alt', lang), alt.toFixed(2)));
  infoBox.appendChild(coordsGrid);

  container.appendChild(infoBox);

  // Height Control
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
  clampCheck.checked = label.heightReference === 'clampToGround';
  clampCheck.style.cursor = 'pointer';
  
  clampLabel.appendChild(clampCheck);
  clampLabel.appendChild(document.createTextNode(t('clamp', lang)));
  heightContainer.appendChild(clampLabel);

  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.step = '1';
  heightInput.value = label.heightOffset || 0;
  heightInput.placeholder = t('offset', lang);
  heightInput.style.flex = '1';
  heightInput.style.minWidth = '0';
  styleInput(heightInput);

  clampCheck.addEventListener('change', (e) => {
    label.setClampToGround(e.target.checked);
    if (e.target.checked) {
      heightInput.value = 0;
    }
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      label.setHeight(val);
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  container.appendChild(heightRow);

  // Text Content
  const textRow = createControlRow(t('text', lang));
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.value = label.text;
  textInput.style.width = '100%';
  styleInput(textInput);
  textInput.addEventListener('input', (e) => {
    label.setText(e.target.value);
  });
  textRow.appendChild(textInput);
  container.appendChild(textRow);

  // Font
  const fontRow = createControlRow(t('font', lang));
  const fontInput = document.createElement('input');
  fontInput.type = 'text';
  fontInput.value = label.font;
  fontInput.placeholder = '30px sans-serif';
  fontInput.style.flex = '1';
  fontInput.style.minWidth = '0';
  styleInput(fontInput);
  fontInput.addEventListener('change', (e) => {
    label.setFont(e.target.value);
  });
  fontRow.appendChild(fontInput);
  container.appendChild(fontRow);

  // Style
  const styleRow = createControlRow(t('style', lang));
  const styleSel = document.createElement('select');
  ['FILL', 'OUTLINE', 'FILL_AND_OUTLINE'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.text = s;
      if (label.style === s) opt.selected = true;
      styleSel.appendChild(opt);
  });
  styleSel.style.flex = '1';
  styleSel.style.minWidth = '0';
  styleInput(styleSel);
  styleSel.addEventListener('change', (e) => label.setStyle(e.target.value));
  styleRow.appendChild(styleSel);
  container.appendChild(styleRow);

  // Colors (Fill & Outline)
  const colorRow = createControlRow(t('color', lang));
  const colorContainer = document.createElement('div');
  colorContainer.style.display = 'flex';
  colorContainer.style.gap = '8px';
  colorContainer.style.alignItems = 'center';

  const fillColorInput = document.createElement('input');
  fillColorInput.type = 'color';
  fillColorInput.value = colorToHex(label.fillColor);
  fillColorInput.style.width = '30px';
  fillColorInput.style.height = '20px';
  fillColorInput.style.border = 'none';
  fillColorInput.style.padding = '0';
  fillColorInput.style.background = 'transparent';
  fillColorInput.title = 'Fill Color';
  fillColorInput.addEventListener('input', (e) => label.setFillColor(e.target.value));

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  outlineColorInput.value = colorToHex(label.outlineColor);
  outlineColorInput.style.width = '30px';
  outlineColorInput.style.height = '20px';
  outlineColorInput.style.border = 'none';
  outlineColorInput.style.padding = '0';
  outlineColorInput.style.background = 'transparent';
  outlineColorInput.title = 'Outline Color';
  outlineColorInput.addEventListener('input', (e) => label.setOutlineColor(e.target.value));

  const outlineWidthInput = document.createElement('input');
  outlineWidthInput.type = 'number';
  outlineWidthInput.min = '1';
  outlineWidthInput.value = label.outlineWidth || 1;
  outlineWidthInput.style.flex = '1';
  outlineWidthInput.style.minWidth = '0';
  styleInput(outlineWidthInput);
  outlineWidthInput.addEventListener('input', (e) => label.setOutlineWidth(parseFloat(e.target.value)));

  colorContainer.appendChild(fillColorInput);
  colorContainer.appendChild(outlineColorInput);
  colorContainer.appendChild(outlineWidthInput);
  colorRow.appendChild(colorContainer);
  container.appendChild(colorRow);

  // Background
  const bgRow = createControlRow(t('background', lang));
  const bgContainer = document.createElement('div');
  bgContainer.style.display = 'flex';
  bgContainer.style.gap = '8px';
  bgContainer.style.alignItems = 'center';

  const bgCheck = document.createElement('input');
  bgCheck.type = 'checkbox';
  bgCheck.checked = label.showBackground;
  bgCheck.addEventListener('change', (e) => label.setShowBackground(e.target.checked));

  const bgColorInput = document.createElement('input');
  bgColorInput.type = 'color';
  bgColorInput.value = colorToHex(label.backgroundColor);
  bgColorInput.style.width = '30px';
  bgColorInput.style.height = '20px';
  bgColorInput.style.border = 'none';
  bgColorInput.style.padding = '0';
  bgColorInput.style.background = 'transparent';
  bgColorInput.addEventListener('input', (e) => label.setBackgroundColor(e.target.value));

  bgContainer.appendChild(bgCheck);
  bgContainer.appendChild(bgColorInput);
  bgRow.appendChild(bgContainer);
  container.appendChild(bgRow);

  // Scale
  const scaleRow = createControlRow(t('scale', lang));
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.step = '0.1';
  scaleInput.min = '0.1';
  scaleInput.value = label.scale || 1.0;
  scaleInput.style.flex = '1';
  scaleInput.style.minWidth = '0';
  styleInput(scaleInput);
  scaleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      label.setScale(val);
    }
  });
  scaleRow.appendChild(scaleInput);
  container.appendChild(scaleRow);

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
      if (label.horizontalOrigin === o) opt.selected = true;
      hOriginSel.appendChild(opt);
  });
  hOriginSel.style.flex = '1';
  hOriginSel.style.minWidth = '0';
  styleInput(hOriginSel);
  hOriginSel.addEventListener('change', (e) => label.setHorizontalOrigin(e.target.value));

  const vOriginSel = document.createElement('select');
  ['CENTER', 'BOTTOM', 'TOP', 'BASELINE'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (label.verticalOrigin === o) opt.selected = true;
      vOriginSel.appendChild(opt);
  });
  vOriginSel.style.flex = '1';
  vOriginSel.style.minWidth = '0';
  styleInput(vOriginSel);
  vOriginSel.addEventListener('change', (e) => label.setVerticalOrigin(e.target.value));

  originContainer.appendChild(hOriginSel);
  originContainer.appendChild(vOriginSel);
  originRow.appendChild(originContainer);
  container.appendChild(originRow);

  // Pixel Offset
  const pixelOffsetRow = createControlRow(t('pixelOffset', lang));
  const pixelOffsetContainer = document.createElement('div');
  pixelOffsetContainer.style.display = 'flex';
  pixelOffsetContainer.style.gap = '4px';

  const pxInput = document.createElement('input');
  pxInput.type = 'number';
  pxInput.placeholder = 'X';
  pxInput.value = label.pixelOffset ? label.pixelOffset[0] : 0;
  pxInput.style.flex = '1';
  pxInput.style.maxWidth = '60px';
  styleInput(pxInput);

  const pyInput = document.createElement('input');
  pyInput.type = 'number';
  pyInput.placeholder = 'Y';
  pyInput.value = label.pixelOffset ? label.pixelOffset[1] : 0;
  pyInput.style.flex = '1';
  pyInput.style.maxWidth = '60px';
  styleInput(pyInput);

  const updatePixelOffset = () => {
    const x = parseFloat(pxInput.value) || 0;
    const y = parseFloat(pyInput.value) || 0;
    label.setPixelOffset(x, y);
  };
  pxInput.addEventListener('input', updatePixelOffset);
  pyInput.addEventListener('input', updatePixelOffset);

  pixelOffsetContainer.appendChild(pxInput);
  pixelOffsetContainer.appendChild(pyInput);
  pixelOffsetRow.appendChild(pixelOffsetContainer);
  container.appendChild(pixelOffsetRow);

  // Eye Offset
  const eyeOffsetRow = createControlRow(t('eyeOffset', lang));
  const eyeOffsetContainer = document.createElement('div');
  eyeOffsetContainer.style.display = 'flex';
  eyeOffsetContainer.style.gap = '4px';

  const exInput = document.createElement('input');
  exInput.type = 'number';
  exInput.placeholder = 'X';
  exInput.value = label.eyeOffset ? label.eyeOffset[0] : 0;
  exInput.style.flex = '1';
  exInput.style.maxWidth = '60px';
  styleInput(exInput);

  const eyInput = document.createElement('input');
  eyInput.type = 'number';
  eyInput.placeholder = 'Y';
  eyInput.value = label.eyeOffset ? label.eyeOffset[1] : 0;
  eyInput.style.flex = '1';
  eyInput.style.maxWidth = '60px';
  styleInput(eyInput);

  const ezInput = document.createElement('input');
  ezInput.type = 'number';
  ezInput.placeholder = 'Z';
  ezInput.value = label.eyeOffset ? label.eyeOffset[2] : 0;
  ezInput.style.flex = '1';
  ezInput.style.maxWidth = '60px';
  styleInput(ezInput);

  const updateEyeOffset = () => {
    const x = parseFloat(exInput.value) || 0;
    const y = parseFloat(eyInput.value) || 0;
    const z = parseFloat(ezInput.value) || 0;
    label.setEyeOffset(x, y, z);
  };
  exInput.addEventListener('input', updateEyeOffset);
  eyInput.addEventListener('input', updateEyeOffset);
  ezInput.addEventListener('input', updateEyeOffset);

  eyeOffsetContainer.appendChild(exInput);
  eyeOffsetContainer.appendChild(eyInput);
  eyeOffsetContainer.appendChild(ezInput);
  eyeOffsetRow.appendChild(eyeOffsetContainer);
  container.appendChild(eyeOffsetRow);

  // Distance Display
  const distanceRow = createControlRow(t('distanceDisplay', lang));
  const distanceContainer = document.createElement('div');
  distanceContainer.style.display = 'flex';
  distanceContainer.style.gap = '4px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.near : 0;
  nearInput.style.flex = '1';
  nearInput.style.minWidth = '0';
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.far : '';
  farInput.style.flex = '1';
  farInput.style.minWidth = '0';
  styleInput(farInput);

  const updateDistance = () => {
    const n = parseFloat(nearInput.value) || 0;
    const f = parseFloat(farInput.value);
    label.setDistanceDisplayCondition(n, isNaN(f) ? undefined : f);
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
  scaleDistContainer.style.width = '100%';


  const snInput = document.createElement('input');
  snInput.type = 'number';
  snInput.placeholder = t('near', lang);
  snInput.value = label.scaleByDistance ? label.scaleByDistance.near : '';
  // snInput.style.flex = '1';
  snInput.style.maxWidth = '100%';
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = label.scaleByDistance ? label.scaleByDistance.nearValue : '';
  // snvInput.style.flex = '1';
  snvInput.style.maxWidth = '95%';
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = label.scaleByDistance ? label.scaleByDistance.far : '';
  sfInput.style.flex = '1';
  sfInput.style.maxWidth = '60px';
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = label.scaleByDistance ? label.scaleByDistance.farValue : '';
  styleInput(sfvInput);

  const updateScaleByDist = () => {
    const n = parseFloat(snInput.value);
    const nv = parseFloat(snvInput.value);
    const f = parseFloat(sfInput.value);
    const fv = parseFloat(sfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        label.setScaleByDistance(n, nv, f, fv);
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
  tnInput.value = label.translucencyByDistance ? label.translucencyByDistance.near : '';
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = label.translucencyByDistance ? label.translucencyByDistance.nearValue : '';
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = label.translucencyByDistance ? label.translucencyByDistance.far : '';
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = label.translucencyByDistance ? label.translucencyByDistance.farValue : '';
  styleInput(tfvInput);

  const updateTransByDist = () => {
    const n = parseFloat(tnInput.value);
    const nv = parseFloat(tnvInput.value);
    const f = parseFloat(tfInput.value);
    const fv = parseFloat(tfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        label.setTranslucencyByDistance(n, nv, f, fv);
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
  posnInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.near : '';
  posnInput.style.flex = '1';
  posnInput.style.minWidth = '0';
  styleInput(posnInput);

  const posnvInput = document.createElement('input');
  posnvInput.type = 'number';
  posnvInput.placeholder = t('nearValue', lang);
  posnvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.nearValue : '';
  posnvInput.style.flex = '1';
  posnvInput.style.minWidth = '0';
  styleInput(posnvInput);

  const posfInput = document.createElement('input');
  posfInput.type = 'number';
  posfInput.placeholder = t('far', lang);
  posfInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.far : '';
  posfInput.style.flex = '1';
  posfInput.style.minWidth = '0';
  styleInput(posfInput);

  const posfvInput = document.createElement('input');
  posfvInput.type = 'number';
  posfvInput.placeholder = t('farValue', lang);
  posfvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.farValue : '';
  posfvInput.style.flex = '1';
  posfvInput.style.minWidth = '0';
  styleInput(posfvInput);

  const updatePosDist = () => {
    const n = parseFloat(posnInput.value);
    const nv = parseFloat(posnvInput.value);
    const f = parseFloat(posfInput.value);
    const fv = parseFloat(posfvInput.value);
    if (!isNaN(n) && !isNaN(nv) && !isNaN(f) && !isNaN(fv)) {
        label.setPixelOffsetScaleByDistance(n, nv, f, fv);
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
  depthTestCheck.checked = label.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  depthTestCheck.style.cursor = 'pointer';

  const depthTestLabel = document.createElement('span');
  depthTestLabel.textContent = t('alwaysOnTop', lang);
  depthTestLabel.style.fontSize = '12px';
  depthTestLabel.style.color = '#ccc';

  depthTestCheck.addEventListener('change', (e) => {
    label.setDisableDepthTestDistance(e.target.checked);
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
    const isRelative = label.heightReference === 'relativeToGround';
    const h = isRelative ? (label.heightOffset || 0) : (label.position[2] || 0) + (label.heightOffset || 0);

    let nativeCode = `viewer.entities.add({\\n` +
      `  position: Cesium.Cartesian3.fromDegrees(${label.position[0]}, ${label.position[1]}, ${h}),\\n` +
      `  label: {\\n` +
      `    text: '${label.text}',\\n` +
      `    font: '${label.font}',\\n` +
      `    scale: ${label.scale || 1.0},\\n` +
      `    style: Cesium.LabelStyle.${label.style},\\n` +
      `    fillColor: Cesium.Color.fromCssColorString('${label.fillColor}'),\\n` +
      `    outlineColor: Cesium.Color.fromCssColorString('${label.outlineColor}'),\\n` +
      `    outlineWidth: ${label.outlineWidth},\\n` +
      `    showBackground: ${label.showBackground},\\n` +
      `    backgroundColor: Cesium.Color.fromCssColorString('${label.backgroundColor}'),\\n`;

    if (label.heightReference === 'clampToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,\\n`;
    } else if (label.heightReference === 'relativeToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,\\n`;
    }

    if (label.pixelOffset) {
        nativeCode += `    pixelOffset: new Cesium.Cartesian2(${label.pixelOffset[0]}, ${label.pixelOffset[1]}),\\n`;
    }

    if (label.eyeOffset) {
        nativeCode += `    eyeOffset: new Cesium.Cartesian3(${label.eyeOffset[0]}, ${label.eyeOffset[1]}, ${label.eyeOffset[2]}),\\n`;
    }

    if (label.horizontalOrigin) {
        nativeCode += `    horizontalOrigin: Cesium.HorizontalOrigin.${label.horizontalOrigin},\\n`;
    }
    
    if (label.verticalOrigin) {
        nativeCode += `    verticalOrigin: Cesium.VerticalOrigin.${label.verticalOrigin},\\n`;
    }

    if (label.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        nativeCode += `    disableDepthTestDistance: Number.POSITIVE_INFINITY,\\n`;
    }

    if (label.distanceDisplayCondition) {
        nativeCode += `    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(${label.distanceDisplayCondition.near}, ${label.distanceDisplayCondition.far}),\\n`;
    }

    if (label.scaleByDistance) {
        nativeCode += `    scaleByDistance: new Cesium.NearFarScalar(${label.scaleByDistance.near}, ${label.scaleByDistance.nearValue}, ${label.scaleByDistance.far}, ${label.scaleByDistance.farValue}),\\n`;
    }
    
    if (label.translucencyByDistance) {
        nativeCode += `    translucencyByDistance: new Cesium.NearFarScalar(${label.translucencyByDistance.near}, ${label.translucencyByDistance.nearValue}, ${label.translucencyByDistance.far}, ${label.translucencyByDistance.farValue}),\\n`;
    }
    
    if (label.pixelOffsetScaleByDistance) {
        nativeCode += `    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(${label.pixelOffsetScaleByDistance.near}, ${label.pixelOffsetScaleByDistance.nearValue}, ${label.pixelOffsetScaleByDistance.far}, ${label.pixelOffsetScaleByDistance.farValue}),\\n`;
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
    let chain = `entity.label({\\n` +
      `  text: '${label.text}',\\n` +
      `  font: '${label.font}',\\n` +
      `  fillColor: '${label.fillColor}',\\n` +
      `  scale: ${label.scale || 1.0},\\n` +
      `  style: '${label.style}',\\n` +
      `  outlineColor: '${label.outlineColor}',\\n` +
      `  outlineWidth: ${label.outlineWidth},\\n` +
      `  showBackground: ${label.showBackground},\\n` +
      `  backgroundColor: '${label.backgroundColor}'`;

    if (label.heightReference === 'clampToGround') {
      chain += `,\\n  heightReference: 'clampToGround'`;
    } else if (label.heightReference === 'relativeToGround') {
      chain += `,\\n  heightReference: 'relativeToGround'`;
    }

    if (label.heightOffset !== 0) {
      chain += `,\\n  heightOffset: ${label.heightOffset}`;
    }

    if (label.pixelOffset && (label.pixelOffset[0] !== 0 || label.pixelOffset[1] !== 0)) {
        chain += `,\\n  pixelOffset: [${label.pixelOffset[0]}, ${label.pixelOffset[1]}]`;
    }
    if (label.eyeOffset && (label.eyeOffset[0] !== 0 || label.eyeOffset[1] !== 0 || label.eyeOffset[2] !== 0)) {
        chain += `,\\n  eyeOffset: [${label.eyeOffset[0]}, ${label.eyeOffset[1]}, ${label.eyeOffset[2]}]`;
    }
    if (label.horizontalOrigin) {
        chain += `,\\n  horizontalOrigin: '${label.horizontalOrigin}'`;
    }
    if (label.verticalOrigin) {
        chain += `,\\n  verticalOrigin: '${label.verticalOrigin}'`;
    }
    
    if (label.distanceDisplayCondition) {
        chain += `,\\n  distanceDisplayCondition: { near: ${label.distanceDisplayCondition.near}, far: ${label.distanceDisplayCondition.far} }`;
    }
    if (label.scaleByDistance) {
        chain += `,\\n  scaleByDistance: { near: ${label.scaleByDistance.near}, nearValue: ${label.scaleByDistance.nearValue}, far: ${label.scaleByDistance.far}, farValue: ${label.scaleByDistance.farValue} }`;
    }
    if (label.translucencyByDistance) {
        chain += `,\\n  translucencyByDistance: { near: ${label.translucencyByDistance.near}, nearValue: ${label.translucencyByDistance.nearValue}, far: ${label.translucencyByDistance.far}, farValue: ${label.translucencyByDistance.farValue} }`;
    }
    if (label.pixelOffsetScaleByDistance) {
        chain += `,\\n  pixelOffsetScaleByDistance: { near: ${label.pixelOffsetScaleByDistance.near}, nearValue: ${label.pixelOffsetScaleByDistance.nearValue}, far: ${label.pixelOffsetScaleByDistance.far}, farValue: ${label.pixelOffsetScaleByDistance.farValue} }`;
    }
    if (label.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
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
