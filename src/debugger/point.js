import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderPointDebugger(container, point, lang = 'zh') {
  const pos = point.position || [0, 0, 0];
  const groupName = point.group || t('defaultGroup', lang);
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

  const tuneRangeInput = (input, width = twoColWidth) => {
    input.style.flex = '0 1 auto';
    input.style.width = width;
    input.style.maxWidth = '100%';
    input.style.minWidth = '0';
    return input;
  };
  
  // --- Section Helper ---
  const createSection = (title) => {
    const section = document.createElement('div');
    section.style.marginBottom = '12px';
    section.style.borderTop = '1px solid rgba(255,255,255,0.1)';
    section.style.paddingTop = '8px';
    
    const header = document.createElement('div');
    header.textContent = title;
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';
    header.style.color = '#94a3b8';
    header.style.marginBottom = '8px';
    header.style.paddingLeft = '4px';
    
    section.appendChild(header);
    return section;
  };

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
      <div><span style="color:#cbd5e1;">距离显示</span>：按相机到点的距离控制显示（近/远）。</div>
      <div><span style="color:#cbd5e1;">可见高度</span>：按相机高度范围控制显示（最小/最大）。</div>
      <div style="margin-top:6px; opacity:0.9;">两者效果都可能表现为“看不见”，但触发条件不同，可叠加使用。</div>
    `
    : `
      <div style="color:#e2e8f0; font-weight:600; margin-bottom:6px;">Notes</div>
      <div><span style="color:#cbd5e1;">Dist Display</span>: show/hide by camera-to-point distance (near/far).</div>
      <div><span style="color:#cbd5e1;">Visible Ht</span>: show/hide by camera height range (min/max).</div>
      <div style="margin-top:6px; opacity:0.9;">Both may “hide” the entity, but the conditions differ and can be combined.</div>
    `;
  infoBox.appendChild(helpBox);

  container.appendChild(infoBox);

  // --- Position & Geometry Section ---
  const posSection = createSection(t('posAndGeo', lang));
  container.appendChild(posSection);

  // Height Control (Clamp & Offset)
  const heightRow = tuneRow(createControlRow(t('height', lang), labelWidth));
  const heightContainer = document.createElement('div');
  tuneControl(heightContainer);

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
  tuneNumberInput(heightInput, '120px');
  styleInput(heightInput);

  // Events
  clampCheck.addEventListener('change', (e) => {
    point.setClampToGround(e.target.checked).update();
    if (e.target.checked) {
      heightInput.value = 0;
    }
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      point.setHeight(val).update();
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  posSection.appendChild(heightRow);





  // --- Style Section ---
  const styleSection = createSection(t('style', lang));
  container.appendChild(styleSection);

  // Color
  const colorRow = tuneRow(createControlRow(t('color', lang), labelWidth));
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(point.color);
  colorInput.style.cursor = 'pointer';
  colorInput.style.marginLeft = 'auto';
  colorInput.style.width = '40px';
  colorInput.style.height = '24px';
  colorInput.style.border = 'none';
  colorInput.style.padding = '0';
  colorInput.style.background = 'transparent';
  colorInput.addEventListener('input', (e) => {
    point.setColor(e.target.value).update();
  });
  colorRow.appendChild(colorInput);
  styleSection.appendChild(colorRow);

  // Pixel Size
  const sizeRow = tuneRow(createControlRow(`${t('pixelSize', lang)} (px)`, labelWidth));
  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.min = '1';
  sizeInput.max = '100';
  sizeInput.value = point.pixelSize;
  tuneNumberInput(sizeInput);
  sizeInput.style.marginLeft = 'auto';
  styleInput(sizeInput);
  sizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      point.setPixelSize(val).update();
    }
  });
  sizeRow.appendChild(sizeInput);
  styleSection.appendChild(sizeRow);

  // Opacity
  const opacityRow = tuneRow(createControlRow(t('opacity', lang), labelWidth));
  const opacityInput = document.createElement('input');
  opacityInput.type = 'range';
  opacityInput.min = '0';
  opacityInput.max = '1';
  opacityInput.step = '0.1';
  opacityInput.value = point.opacity;
  tuneRangeInput(opacityInput);
  opacityInput.style.marginLeft = 'auto';
  opacityInput.style.cursor = 'pointer';
  opacityInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    point.setOpacity(val).update();
  });
  opacityRow.appendChild(opacityInput);
  styleSection.appendChild(opacityRow);

  // Outline Control
  const outlineRow = tuneRow(createControlRow(t('outline', lang), labelWidth));
  const outlineContainer = document.createElement('div');
  tuneControl(outlineContainer);

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
    ).update();
  };

  outlineCheck.addEventListener('change', updateOutline);
  outlineColorInput.addEventListener('input', updateOutline);
  outlineWidthInput.addEventListener('input', updateOutline);

  outlineContainer.appendChild(outlineCheck);
  outlineContainer.appendChild(outlineColorInput);
  outlineContainer.appendChild(outlineWidthInput);
  outlineRow.appendChild(outlineContainer);
  styleSection.appendChild(outlineRow);

  // Flash
  const flashRow = tuneRow(createControlRow(t('flash', lang), labelWidth));
  const flashContainer = document.createElement('div');
  tuneControl(flashContainer);
  flashContainer.style.gap = '6px';

  const flashCheck = document.createElement('input');
  flashCheck.type = 'checkbox';
  flashCheck.checked = !!point._flashing;
  flashCheck.style.cursor = 'pointer';

  const flashDurationInput = document.createElement('input');
  flashDurationInput.type = 'number';
  flashDurationInput.min = '50';
  flashDurationInput.step = '50';
  flashDurationInput.placeholder = t('flashDuration', lang);
  flashDurationInput.value = Number.isFinite(point._debugFlashDuration) ? point._debugFlashDuration : 1000;
  tuneNumberInput(flashDurationInput, '120px');
  styleInput(flashDurationInput);

  const applyFlash = () => {
    const duration = Math.max(50, parseInt(flashDurationInput.value || '1000', 10) || 1000);
    point._debugFlashDuration = duration;
    point.flash(!!flashCheck.checked, duration);
  };

  flashCheck.addEventListener('change', applyFlash);
  flashDurationInput.addEventListener('input', () => {
    if (!flashCheck.checked) return;
    applyFlash();
  });

  flashContainer.appendChild(flashCheck);
  flashContainer.appendChild(flashDurationInput);
  flashRow.appendChild(flashContainer);
  styleSection.appendChild(flashRow);

  // --- Display Control Section ---
  const displaySection = createSection(t('displayControl', lang));
  container.appendChild(displaySection);

  // Distance Display
  const distanceRow = tuneRow(createControlRow(t('distanceDisplay', lang), labelWidth));
  const distanceContainer = document.createElement('div');
  tuneControl(distanceContainer);
  distanceContainer.style.gap = '6px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.near : 0;
  tuneNumberInput(nearInput, '110px');
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.far : '';
  tuneNumberInput(farInput, '110px');
  styleInput(farInput);

  const updateDistance = () => {
    const n = parseFloat(nearInput.value) || 0;
    const f = parseFloat(farInput.value);
    point.setDistanceDisplayCondition({ near: n, far: isNaN(f) ? undefined : f }).update();
  };
  nearInput.addEventListener('input', updateDistance);
  farInput.addEventListener('input', updateDistance);

  distanceContainer.appendChild(nearInput);
  distanceContainer.appendChild(farInput);
  distanceRow.appendChild(distanceContainer);
  displaySection.appendChild(distanceRow);

  // Display Height
  const displayHeightRow = tuneRow(createControlRow(t('displayHeight', lang), labelWidth));
  const displayHeightContainer = document.createElement('div');
  tuneControl(displayHeightContainer);
  displayHeightContainer.style.gap = '6px';

  const minHeightInput = document.createElement('input');
  minHeightInput.type = 'number';
  minHeightInput.placeholder = t('min', lang);
  minHeightInput.value = point.minDisplayHeight || 0;
  tuneNumberInput(minHeightInput, '110px');
  styleInput(minHeightInput);

  const maxHeightInput = document.createElement('input');
  maxHeightInput.type = 'number';
  maxHeightInput.placeholder = t('max', lang);
  maxHeightInput.value = Number.isFinite(point.maxDisplayHeight) ? point.maxDisplayHeight : '';
  tuneNumberInput(maxHeightInput, '110px');
  styleInput(maxHeightInput);

  const updateDisplayHeight = () => {
    const minVal = parseFloat(minHeightInput.value);
    const maxVal = parseFloat(maxHeightInput.value);
    
    // We can use point.setDisplayCondition for cleaner API usage if available
    if (typeof point.setDisplayCondition === 'function') {
      point.setDisplayCondition({
          min: isNaN(minVal) ? 0 : minVal,
          max: isNaN(maxVal) ? undefined : maxVal
      }).update();
    } else {
      // Fallback manual update
      point.minDisplayHeight = isNaN(minVal) ? 0 : minVal;
      point.maxDisplayHeight = isNaN(maxVal) ? Infinity : maxVal;
      if (point._disableHeightCheck) point._disableHeightCheck();
      if (point._enableHeightCheck) point._enableHeightCheck();
    }
  };

  minHeightInput.addEventListener('input', updateDisplayHeight);
  maxHeightInput.addEventListener('input', updateDisplayHeight);

  displayHeightContainer.appendChild(minHeightInput);
  displayHeightContainer.appendChild(maxHeightInput);
  displayHeightRow.appendChild(displayHeightContainer);
  displaySection.appendChild(displayHeightRow);

  // Scale By Distance
  const scaleDistRow = tuneRow(createControlRow(t('scaleByDistance', lang), labelWidth));
  const scaleDistContainer = document.createElement('div');
  scaleDistContainer.style.display = 'grid';
  scaleDistContainer.style.gridTemplateColumns = 'minmax(0, 110px) minmax(0, 110px)';
  scaleDistContainer.style.gap = '6px';
  scaleDistContainer.style.width = twoColWidth;
  scaleDistContainer.style.maxWidth = '100%';
  scaleDistContainer.style.justifyContent = 'end';
  scaleDistContainer.style.marginLeft = 'auto';

  const snInput = document.createElement('input');
  snInput.type = 'number';
  snInput.placeholder = t('near', lang);
  snInput.value = point.scaleByDistance ? point.scaleByDistance.near : '';
  snInput.style.width = '100%';
  snInput.style.minWidth = '0';
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = point.scaleByDistance ? point.scaleByDistance.nearValue : '';
  snvInput.style.width = '100%';
  snvInput.style.minWidth = '0';
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = point.scaleByDistance ? point.scaleByDistance.far : '';
  sfInput.style.width = '100%';
  sfInput.style.minWidth = '0';
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = point.scaleByDistance ? point.scaleByDistance.farValue : '';
  sfvInput.style.width = '100%';
  sfvInput.style.minWidth = '0';
  styleInput(sfvInput);

  const updateScaleByDist = () => {
    const n = parseFloat(snInput.value);
    const nv = parseFloat(snvInput.value);
    const f = parseFloat(sfInput.value);
    const fv = parseFloat(sfvInput.value);
    
    point.setScaleByDistance({ 
        near: isNaN(n) ? undefined : n, 
        nearValue: isNaN(nv) ? undefined : nv, 
        far: isNaN(f) ? undefined : f, 
        farValue: isNaN(fv) ? undefined : fv 
    }).update();
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
  displaySection.appendChild(scaleDistRow);

  // Translucency By Distance
  const transDistRow = tuneRow(createControlRow(t('translucencyByDistance', lang), labelWidth));
  const transDistContainer = document.createElement('div');
  transDistContainer.style.display = 'grid';
  transDistContainer.style.gridTemplateColumns = 'minmax(0, 110px) minmax(0, 110px)';
  transDistContainer.style.gap = '6px';
  transDistContainer.style.width = twoColWidth;
  transDistContainer.style.maxWidth = '100%';
  transDistContainer.style.justifyContent = 'end';
  transDistContainer.style.marginLeft = 'auto';

  const tnInput = document.createElement('input');
  tnInput.type = 'number';
  tnInput.placeholder = t('near', lang);
  tnInput.value = point.translucencyByDistance ? point.translucencyByDistance.near : '';
  tnInput.style.width = '100%';
  tnInput.style.minWidth = '0';
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = point.translucencyByDistance ? point.translucencyByDistance.nearValue : '';
  tnvInput.style.width = '100%';
  tnvInput.style.minWidth = '0';
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = point.translucencyByDistance ? point.translucencyByDistance.far : '';
  tfInput.style.width = '100%';
  tfInput.style.minWidth = '0';
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = point.translucencyByDistance ? point.translucencyByDistance.farValue : '';
  tfvInput.style.width = '100%';
  tfvInput.style.minWidth = '0';
  styleInput(tfvInput);

  const updateTransByDist = () => {
    const n = parseFloat(tnInput.value);
    const nv = parseFloat(tnvInput.value);
    const f = parseFloat(tfInput.value);
    const fv = parseFloat(tfvInput.value);

    point.setTranslucencyByDistance({ 
        near: isNaN(n) ? undefined : n, 
        nearValue: isNaN(nv) ? undefined : nv, 
        far: isNaN(f) ? undefined : f, 
        farValue: isNaN(fv) ? undefined : fv 
    }).update();
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
  displaySection.appendChild(transDistRow);



  // Disable Depth Test Distance
  const depthTestRow = tuneRow(createControlRow(t('depthTest', lang), labelWidth));
  const depthTestContainer = document.createElement('div');
  tuneControl(depthTestContainer);
  depthTestContainer.style.justifyContent = 'flex-end';

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
    point.setDisableDepthTestDistance(e.target.checked ? Number.POSITIVE_INFINITY : undefined).update();
  });

  depthTestContainer.appendChild(depthTestCheck);
  depthTestContainer.appendChild(depthTestLabel);
  depthTestRow.appendChild(depthTestContainer);
  displaySection.appendChild(depthTestRow);

  // --- Action Buttons ---
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '8px';
  btnRow.style.marginTop = '16px';
  btnRow.style.paddingTop = '16px';
  btnRow.style.borderTop = '1px solid rgba(255,255,255,0.1)';

  const saveBtn = createButton(t('saveState', lang), () => {
    point.saveState();
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'OK!';
    saveBtn.style.background = '#10b981';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '#3b82f6';
    }, 1500);
  });

  const restoreBtn = createButton(t('restoreState', lang), () => {
    point.restoreState();
    
    // Refresh UI
    heightInput.value = point.heightOffset || 0;
    clampCheck.checked = point.heightReference === 'clampToGround';
    
    colorInput.value = colorToHex(point.color);
    sizeInput.value = point.pixelSize;
    opacityInput.value = point.opacity;
    
    outlineCheck.checked = point.outline;
    outlineColorInput.value = colorToHex(point.outlineColor || '#FFFFFF');
    outlineWidthInput.value = point.outlineWidth || 2;
    
    flashCheck.checked = !!point._flashing;
    flashDurationInput.value = Number.isFinite(point._debugFlashDuration) ? point._debugFlashDuration : 1000;
    
    nearInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.near : 0;
    farInput.value = point.distanceDisplayCondition ? point.distanceDisplayCondition.far : '';
    
    minHeightInput.value = point.minDisplayHeight || 0;
    maxHeightInput.value = Number.isFinite(point.maxDisplayHeight) ? point.maxDisplayHeight : '';
    
    snInput.value = point.scaleByDistance ? point.scaleByDistance.near : '';
    snvInput.value = point.scaleByDistance ? point.scaleByDistance.nearValue : '';
    sfInput.value = point.scaleByDistance ? point.scaleByDistance.far : '';
    sfvInput.value = point.scaleByDistance ? point.scaleByDistance.farValue : '';
    
    tnInput.value = point.translucencyByDistance ? point.translucencyByDistance.near : '';
    tnvInput.value = point.translucencyByDistance ? point.translucencyByDistance.nearValue : '';
    tfInput.value = point.translucencyByDistance ? point.translucencyByDistance.far : '';
    tfvInput.value = point.translucencyByDistance ? point.translucencyByDistance.farValue : '';
    
    depthTestCheck.checked = point.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  }, 'secondary');

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(restoreBtn);
  container.appendChild(btnRow);
  
  // --- Copy Buttons ---
  const copyRow = document.createElement('div');
  copyRow.style.display = 'flex';
  copyRow.style.gap = '8px';
  copyRow.style.marginTop = '8px';

  const copyNativeBtn = createButton(t('copyNative', lang), () => {
    const isRelative = point.heightReference === 'relativeToGround';
    const h = isRelative ? (point.heightOffset || 0) : (point.position[2] || 0);
    
    let code = `viewer.entities.add({\n` +
      `  position: Cesium.Cartesian3.fromDegrees(${point.position[0]}, ${point.position[1]}, ${h}),\n` +
      `  point: {\n` +
      `    color: Cesium.Color.fromCssColorString('${point.color}').withAlpha(${point.opacity}),\n` +
      `    pixelSize: ${point.pixelSize},\n` +
      `    outlineWidth: ${point.outline ? point.outlineWidth : 0},\n` +
      `    outlineColor: Cesium.Color.fromCssColorString('${point.outlineColor}').withAlpha(${point.opacity}),\n`;

    if (point.heightReference === 'clampToGround') {
        code += `    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,\n`;
    } else if (point.heightReference === 'relativeToGround') {
        code += `    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,\n`;
    }

    if (point.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        code += `    disableDepthTestDistance: Number.POSITIVE_INFINITY,\n`;
    }

    if (point.distanceDisplayCondition) {
        code += `    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(${point.distanceDisplayCondition.near}, ${point.distanceDisplayCondition.far}),\n`;
    }
    
    if (point.scaleByDistance) {
        code += `    scaleByDistance: new Cesium.NearFarScalar(${point.scaleByDistance.near}, ${point.scaleByDistance.nearValue}, ${point.scaleByDistance.far}, ${point.scaleByDistance.farValue}),\n`;
    }

    if (point.translucencyByDistance) {
        code += `    translucencyByDistance: new Cesium.NearFarScalar(${point.translucencyByDistance.near}, ${point.translucencyByDistance.nearValue}, ${point.translucencyByDistance.far}, ${point.translucencyByDistance.farValue}),\n`;
    }

    code += `  }\n});`;

    navigator.clipboard.writeText(code).then(() => {
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
    let code = `entity.point({\n` +
      `  color: '${point.color}',\n` +
      `  pixelSize: ${point.pixelSize},\n` +
      `  opacity: ${point.opacity},\n` +
      `  outline: ${point.outline},\n` +
      `  outlineColor: '${point.outlineColor}',\n` +
      `  outlineWidth: ${point.outlineWidth}`;

    if (point.heightReference === 'clampToGround') {
        code += `,\n  heightReference: 'clampToGround'`;
    } else if (point.heightReference === 'relativeToGround') {
        code += `,\n  heightReference: 'relativeToGround'`;
    }
    
    if (point.heightOffset !== 0) {
        code += `,\n  heightOffset: ${point.heightOffset}`;
    }

    if (point.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        code += `,\n  disableDepthTestDistance: true`;
    }

    if (point.distanceDisplayCondition) {
        code += `,\n  distanceDisplayCondition: { near: ${point.distanceDisplayCondition.near}, far: ${point.distanceDisplayCondition.far} }`;
    }
    
    if (point.scaleByDistance) {
        code += `,\n  scaleByDistance: { near: ${point.scaleByDistance.near}, nearValue: ${point.scaleByDistance.nearValue}, far: ${point.scaleByDistance.far}, farValue: ${point.scaleByDistance.farValue} }`;
    }



    if (point.translucencyByDistance) {
        code += `,\n  translucencyByDistance: { near: ${point.translucencyByDistance.near}, nearValue: ${point.translucencyByDistance.nearValue}, far: ${point.translucencyByDistance.far}, farValue: ${point.translucencyByDistance.farValue} }`;
    }

    code += `\n})`;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = copyChainBtn.textContent;
        copyChainBtn.textContent = t('copied', lang);
        copyChainBtn.style.background = '#10b981';
        setTimeout(() => {
          copyChainBtn.textContent = originalText;
          copyChainBtn.style.background = 'rgba(255,255,255,0.1)';
        }, 2000);
    });
  }, 'secondary');

  copyRow.appendChild(copyNativeBtn);
  copyRow.appendChild(copyChainBtn);
  container.appendChild(copyRow);
}
