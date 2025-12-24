import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderBillboardDebugger(container, billboard, lang = 'zh') {
  const pos = billboard.position || [0, 0, 0];
  const groupName = billboard.group || t('defaultGroup', lang);
  const labelWidth = lang === 'zh' ? '88px' : '120px';
  const inputWidth = '140px';
  const twoColWidth = '240px';

  const tuneRow = (row) => {
    row.style.justifyContent = 'flex-start';
    row.style.gap = '10px';
    return row;
  };

  const tuneControl = (control) => {
    control.style.display = 'flex';
    control.style.gap = '8px';
    control.style.alignItems = 'center';
    control.style.flex = '1';
    control.style.justifyContent = 'flex-end';
    control.style.flexWrap = 'wrap';
    control.style.minWidth = '0';
    control.style.marginLeft = 'auto';
    return control;
  };

  const tuneNumberInput = (input, width = inputWidth) => {
    input.style.flex = `0 1 ${width}`;
    input.style.width = width;
    input.style.maxWidth = width;
    input.style.minWidth = '0';
    return input;
  };

  const tuneWideInput = (input, width = twoColWidth) => {
    input.style.flex = `0 1 ${width}`;
    input.style.width = width;
    input.style.maxWidth = '100%';
    input.style.minWidth = '0';
    return input;
  };

  const tuneRangeInput = (input, width = twoColWidth) => {
    input.style.flex = '0 1 auto';
    input.style.width = width;
    input.style.maxWidth = '100%';
    input.style.minWidth = '0';
    return input;
  };

  const tuneGridInput = (input) => {
    input.style.width = '100%';
    input.style.minWidth = '0';
    return input;
  };

  const createTwoColGrid = () => {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'minmax(0, 110px) minmax(0, 110px)';
    grid.style.gap = '6px';
    grid.style.width = twoColWidth;
    grid.style.maxWidth = '100%';
    grid.style.justifyContent = 'end';
    grid.style.marginLeft = 'auto';
    return grid;
  };

  const createThreeColGrid = () => {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'minmax(0, 74px) minmax(0, 74px) minmax(0, 74px)';
    grid.style.gap = '6px';
    grid.style.width = twoColWidth;
    grid.style.maxWidth = '100%';
    grid.style.justifyContent = 'end';
    grid.style.marginLeft = 'auto';
    return grid;
  };

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
  idRow.textContent = billboard.id;
  idRow.title = billboard.id;
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

  const helpBox = document.createElement('div');
  helpBox.style.cssText = `
    background: rgba(0,0,0,0.16);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 6px;
    padding: 10px 10px;
    color: #94a3b8;
    font-size: 11px;
    line-height: 1.5;
  `;
  helpBox.innerHTML = lang === 'zh'
    ? `
      <div style="color:#e2e8f0; font-weight:600; margin-bottom:6px;">功能说明</div>
      <div><span style="color:#cbd5e1;">距离显示</span>：按相机到图标的距离控制显示（近/远）。</div>
      <div><span style="color:#cbd5e1;">可见高度</span>：按相机高度范围控制显示（最小/最大）。</div>
      <div style="margin-top:6px; opacity:0.9;">两者效果都可能表现为“看不见”，但触发条件不同，可叠加使用。</div>
    `
    : `
      <div style="color:#e2e8f0; font-weight:600; margin-bottom:6px;">Notes</div>
      <div><span style="color:#cbd5e1;">Dist Display</span>: show/hide by camera-to-icon distance (near/far).</div>
      <div><span style="color:#cbd5e1;">Visible Ht</span>: show/hide by camera height range (min/max).</div>
      <div style="margin-top:6px; opacity:0.9;">Both may “hide” the entity, but the conditions differ and can be combined.</div>
    `;
  infoBox.appendChild(helpBox);

  container.appendChild(infoBox);

  // Height Control (Altitude)
  const heightRow = tuneRow(createControlRow(t('height', lang), labelWidth));
  const heightContainer = document.createElement('div');
  tuneControl(heightContainer);

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
  tuneNumberInput(heightInput, '120px');
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

  // Image
  const imageRow = tuneRow(createControlRow(t('image', lang), labelWidth));
  const imageContainer = document.createElement('div');
  tuneControl(imageContainer);

  const imageInput = document.createElement('input');
  imageInput.type = 'text';
  imageInput.placeholder = 'https://...';
  imageInput.value = billboard.imageUrl || billboard.image || '';
  tuneWideInput(imageInput);
  styleInput(imageInput);
  imageInput.addEventListener('change', (e) => {
    billboard.setImage(e.target.value);
  });

  imageContainer.appendChild(imageInput);
  imageRow.appendChild(imageContainer);
  container.appendChild(imageRow);

  // Dimensions (Width/Height)
  const dimRow = tuneRow(createControlRow(`${t('width', lang)} / ${t('height', lang)}`, labelWidth));
  const dimContainer = createTwoColGrid();

  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.placeholder = 'W';
  wInput.value = billboard.width || '';
  tuneGridInput(wInput);
  styleInput(wInput);

  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.placeholder = 'H';
  hInput.value = billboard.height || '';
  tuneGridInput(hInput);
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
  const metersRow = tuneRow(createControlRow(t('sizeInMeters', lang), labelWidth));
  const metersCheck = document.createElement('input');
  metersCheck.type = 'checkbox';
  metersCheck.checked = !!billboard.sizeInMeters;
  metersCheck.style.marginLeft = 'auto';
  metersCheck.style.cursor = 'pointer';
  metersCheck.addEventListener('change', (e) => {
      billboard.setSizeInMeters(e.target.checked);
  });
  metersRow.appendChild(metersCheck);
  container.appendChild(metersRow);

  // Scale
  const scaleRow = tuneRow(createControlRow(t('scale', lang), labelWidth));
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.step = '0.1';
  scaleInput.min = '0.1';
  scaleInput.value = billboard.scale || 1.0;
  tuneNumberInput(scaleInput, '120px');
  scaleInput.style.marginLeft = 'auto';
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
  const rotationRow = tuneRow(createControlRow(t('rotation', lang), labelWidth));
  const rotationInput = document.createElement('input');
  rotationInput.type = 'number';
  rotationInput.step = '1';
  rotationInput.value = billboard.rotation || 0;
  tuneNumberInput(rotationInput, '120px');
  rotationInput.style.marginLeft = 'auto';
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
  const originRow = tuneRow(createControlRow(`${t('horizontalOrigin', lang)} / ${t('verticalOrigin', lang)}`, labelWidth));
  const originContainer = createTwoColGrid();

  const hOriginSel = document.createElement('select');
  ['CENTER', 'LEFT', 'RIGHT'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (billboard.horizontalOrigin === o) opt.selected = true;
      hOriginSel.appendChild(opt);
  });
  tuneGridInput(hOriginSel);
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
  tuneGridInput(vOriginSel);
  styleInput(vOriginSel);
  vOriginSel.addEventListener('change', (e) => billboard.setVerticalOrigin(e.target.value));

  originContainer.appendChild(hOriginSel);
  originContainer.appendChild(vOriginSel);
  originRow.appendChild(originContainer);
  container.appendChild(originRow);

  // Color
  const colorRow = tuneRow(createControlRow(t('color', lang), labelWidth));
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(billboard.color);
  colorInput.style.cursor = 'pointer';
  colorInput.style.marginLeft = 'auto';
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

  // Opacity
  const opacityRow = tuneRow(createControlRow(t('opacity', lang), labelWidth));
  const opacityInput = document.createElement('input');
  opacityInput.type = 'range';
  opacityInput.min = '0';
  opacityInput.max = '1';
  opacityInput.step = '0.1';
  opacityInput.value = billboard.opacity != null ? billboard.opacity : 1;
  tuneRangeInput(opacityInput);
  opacityInput.style.marginLeft = 'auto';
  opacityInput.style.cursor = 'pointer';
  opacityInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    billboard.setOpacity(val);
  });
  opacityRow.appendChild(opacityInput);
  container.appendChild(opacityRow);

  // Pixel Offset
  const pixelOffsetRow = tuneRow(createControlRow(t('pixelOffset', lang), labelWidth));
  const pixelOffsetContainer = createTwoColGrid();

  const pxInput = document.createElement('input');
  pxInput.type = 'number';
  pxInput.placeholder = 'X';
  pxInput.value = billboard.pixelOffset ? billboard.pixelOffset[0] : 0;
  tuneGridInput(pxInput);
  styleInput(pxInput);

  const pyInput = document.createElement('input');
  pyInput.type = 'number';
  pyInput.placeholder = 'Y';
  pyInput.value = billboard.pixelOffset ? billboard.pixelOffset[1] : 0;
  tuneGridInput(pyInput);
  styleInput(pyInput);

  const updatePixelOffset = () => {
    const x = parseFloat(pxInput.value) || 0;
    const y = parseFloat(pyInput.value) || 0;
    billboard.setPixelOffset(x, y);
  };
  pxInput.addEventListener('input', updatePixelOffset);
  pyInput.addEventListener('input', updatePixelOffset);

  pixelOffsetContainer.appendChild(pxInput);
  pixelOffsetContainer.appendChild(pyInput);
  pixelOffsetRow.appendChild(pixelOffsetContainer);
  container.appendChild(pixelOffsetRow);

  // Eye Offset
  const eyeOffsetRow = tuneRow(createControlRow(t('eyeOffset', lang), labelWidth));
  const eyeOffsetContainer = createThreeColGrid();

  const exInput = document.createElement('input');
  exInput.type = 'number';
  exInput.placeholder = 'X';
  exInput.value = billboard.eyeOffset ? billboard.eyeOffset[0] : 0;
  tuneGridInput(exInput);
  styleInput(exInput);

  const eyInput = document.createElement('input');
  eyInput.type = 'number';
  eyInput.placeholder = 'Y';
  eyInput.value = billboard.eyeOffset ? billboard.eyeOffset[1] : 0;
  tuneGridInput(eyInput);
  styleInput(eyInput);

  const ezInput = document.createElement('input');
  ezInput.type = 'number';
  ezInput.placeholder = 'Z';
  ezInput.value = billboard.eyeOffset ? billboard.eyeOffset[2] : 0;
  tuneGridInput(ezInput);
  styleInput(ezInput);

  const updateEyeOffset = () => {
    const x = parseFloat(exInput.value) || 0;
    const y = parseFloat(eyInput.value) || 0;
    const z = parseFloat(ezInput.value) || 0;
    billboard.setEyeOffset(x, y, z);
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
  const distanceRow = tuneRow(createControlRow(t('distanceDisplay', lang), labelWidth));
  const distanceContainer = document.createElement('div');
  tuneControl(distanceContainer);
  distanceContainer.style.gap = '6px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = billboard.distanceDisplayCondition ? billboard.distanceDisplayCondition.near : 0;
  tuneNumberInput(nearInput, '110px');
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = billboard.distanceDisplayCondition ? billboard.distanceDisplayCondition.far : '';
  tuneNumberInput(farInput, '110px');
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
  const scaleDistRow = tuneRow(createControlRow(t('scaleByDistance', lang), labelWidth));
  const scaleDistContainer = createTwoColGrid();

  const snInput = document.createElement('input');
  snInput.type = 'number';
  snInput.placeholder = t('near', lang);
  snInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.near : '';
  tuneGridInput(snInput);
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.nearValue : '';
  tuneGridInput(snvInput);
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.far : '';
  tuneGridInput(sfInput);
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = billboard.scaleByDistance ? billboard.scaleByDistance.farValue : '';
  tuneGridInput(sfvInput);
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
  const transDistRow = tuneRow(createControlRow(t('translucencyByDistance', lang), labelWidth));
  const transDistContainer = createTwoColGrid();

  const tnInput = document.createElement('input');
  tnInput.type = 'number';
  tnInput.placeholder = t('near', lang);
  tnInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.near : '';
  tuneGridInput(tnInput);
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.nearValue : '';
  tuneGridInput(tnvInput);
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.far : '';
  tuneGridInput(tfInput);
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = billboard.translucencyByDistance ? billboard.translucencyByDistance.farValue : '';
  tuneGridInput(tfvInput);
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
  const posDistRow = tuneRow(createControlRow(t('pixelOffsetScaleByDistance', lang), labelWidth));
  const posDistContainer = createTwoColGrid();

  const posnInput = document.createElement('input');
  posnInput.type = 'number';
  posnInput.placeholder = t('near', lang);
  posnInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.near : '';
  tuneGridInput(posnInput);
  styleInput(posnInput);

  const posnvInput = document.createElement('input');
  posnvInput.type = 'number';
  posnvInput.placeholder = t('nearValue', lang);
  posnvInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.nearValue : '';
  tuneGridInput(posnvInput);
  styleInput(posnvInput);

  const posfInput = document.createElement('input');
  posfInput.type = 'number';
  posfInput.placeholder = t('far', lang);
  posfInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.far : '';
  tuneGridInput(posfInput);
  styleInput(posfInput);

  const posfvInput = document.createElement('input');
  posfvInput.type = 'number';
  posfvInput.placeholder = t('farValue', lang);
  posfvInput.value = billboard.pixelOffsetScaleByDistance ? billboard.pixelOffsetScaleByDistance.farValue : '';
  tuneGridInput(posfvInput);
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
  const depthTestRow = tuneRow(createControlRow(t('depthTest', lang), labelWidth));
  const depthTestContainer = document.createElement('div');
  tuneControl(depthTestContainer);
  depthTestContainer.style.justifyContent = 'flex-end';

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

  // Display Height
  const displayHeightRow = tuneRow(createControlRow(t('displayHeight', lang), labelWidth));
  const displayHeightContainer = document.createElement('div');
  tuneControl(displayHeightContainer);
  displayHeightContainer.style.gap = '6px';

  const minHeightInput = document.createElement('input');
  minHeightInput.type = 'number';
  minHeightInput.placeholder = t('min', lang);
  minHeightInput.value = billboard.minDisplayHeight || 0;
  tuneNumberInput(minHeightInput, '110px');
  styleInput(minHeightInput);

  const maxHeightInput = document.createElement('input');
  maxHeightInput.type = 'number';
  maxHeightInput.placeholder = t('max', lang);
  maxHeightInput.value = Number.isFinite(billboard.maxDisplayHeight) ? billboard.maxDisplayHeight : '';
  tuneNumberInput(maxHeightInput, '110px');
  styleInput(maxHeightInput);

  const updateDisplayHeight = () => {
    const minVal = parseFloat(minHeightInput.value);
    const maxVal = parseFloat(maxHeightInput.value);
    billboard.setDisplayCondition(isNaN(minVal) ? 0 : minVal, isNaN(maxVal) ? 0 : maxVal);
  };
  minHeightInput.addEventListener('input', updateDisplayHeight);
  maxHeightInput.addEventListener('input', updateDisplayHeight);

  displayHeightContainer.appendChild(minHeightInput);
  displayHeightContainer.appendChild(maxHeightInput);
  displayHeightRow.appendChild(displayHeightContainer);
  container.appendChild(displayHeightRow);

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
      `    color: Cesium.Color.fromCssColorString('${billboard.color}').withAlpha(${billboard.opacity != null ? billboard.opacity : 1}),\\n` +
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

    if (billboard.minDisplayHeight && billboard.minDisplayHeight !== 0) {
        nativeCode += `    minDisplayHeight: ${billboard.minDisplayHeight},\\n`;
    }
    if (Number.isFinite(billboard.maxDisplayHeight) && billboard.maxDisplayHeight !== Infinity) {
        nativeCode += `    maxDisplayHeight: ${billboard.maxDisplayHeight},\\n`;
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
      `  opacity: ${billboard.opacity != null ? billboard.opacity : 1},\\n` +
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

    if (billboard.minDisplayHeight && billboard.minDisplayHeight !== 0) {
        chain += `,\\n  minDisplayHeight: ${billboard.minDisplayHeight}`;
    }
    if (Number.isFinite(billboard.maxDisplayHeight) && billboard.maxDisplayHeight !== Infinity) {
        chain += `,\\n  maxDisplayHeight: ${billboard.maxDisplayHeight}`;
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
