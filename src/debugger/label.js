import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderLabelDebugger(container, label, lang = 'zh') {
  const pos = label.position || [0, 0, 0];
  const groupName = label.group || t('defaultGroup', lang);
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
  idRow.textContent = label.id;
  idRow.title = label.id;
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
      <div><span style="color:#cbd5e1;">距离显示</span>：按相机到标签的距离控制显示（近/远）。</div>
      <div><span style="color:#cbd5e1;">可见高度</span>：按相机高度范围控制显示（最小/最大）。</div>
      <div style="margin-top:6px; opacity:0.9;">两者效果都可能表现为“看不见”，但触发条件不同，可叠加使用。</div>
    `
    : `
      <div style="color:#e2e8f0; font-weight:600; margin-bottom:6px;">Notes</div>
      <div><span style="color:#cbd5e1;">Dist Display</span>: show/hide by camera-to-label distance (near/far).</div>
      <div><span style="color:#cbd5e1;">Visible Ht</span>: show/hide by camera height range (min/max).</div>
      <div style="margin-top:6px; opacity:0.9;">Both may “hide” the entity, but the conditions differ and can be combined.</div>
    `;
  infoBox.appendChild(helpBox);

  container.appendChild(infoBox);

  // ====================================================================
  // Section 1: Position & Geometry
  // ====================================================================
  const posSection = createSection(lang === 'zh' ? '位置与几何' : 'Position & Geometry');
  
  // Height Control
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
  tuneNumberInput(heightInput, '120px');
  styleInput(heightInput);

  clampCheck.addEventListener('change', (e) => {
    label.setClampToGround(e.target.checked).update();
    if (e.target.checked) {
      heightInput.value = 0;
    }
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      label.setHeight(val).update();
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  posSection.appendChild(heightRow);

  // Eye Offset
  const eyeOffsetRow = tuneRow(createControlRow(t('eyeOffset', lang), labelWidth));
  const eyeOffsetContainer = createThreeColGrid();

  const exInput = document.createElement('input');
  exInput.type = 'number';
  exInput.placeholder = 'X';
  exInput.value = label.eyeOffset ? label.eyeOffset[0] : 0;
  tuneGridInput(exInput);
  styleInput(exInput);

  const eyInput = document.createElement('input');
  eyInput.type = 'number';
  eyInput.placeholder = 'Y';
  eyInput.value = label.eyeOffset ? label.eyeOffset[1] : 0;
  tuneGridInput(eyInput);
  styleInput(eyInput);

  const ezInput = document.createElement('input');
  ezInput.type = 'number';
  ezInput.placeholder = 'Z';
  ezInput.value = label.eyeOffset ? label.eyeOffset[2] : 0;
  tuneGridInput(ezInput);
  styleInput(ezInput);

  const updateEyeOffset = () => {
    const x = parseFloat(exInput.value) || 0;
    const y = parseFloat(eyInput.value) || 0;
    const z = parseFloat(ezInput.value) || 0;
    label.setEyeOffset(x, y, z).update();
  };
  exInput.addEventListener('input', updateEyeOffset);
  eyInput.addEventListener('input', updateEyeOffset);
  ezInput.addEventListener('input', updateEyeOffset);

  eyeOffsetContainer.appendChild(exInput);
  eyeOffsetContainer.appendChild(eyInput);
  eyeOffsetContainer.appendChild(ezInput);
  eyeOffsetRow.appendChild(eyeOffsetContainer);
  posSection.appendChild(eyeOffsetRow);

  // Pixel Offset
  const pixelOffsetRow = tuneRow(createControlRow(t('pixelOffset', lang), labelWidth));
  const pixelOffsetContainer = createTwoColGrid();

  const pxInput = document.createElement('input');
  pxInput.type = 'number';
  pxInput.placeholder = 'X';
  pxInput.value = label.pixelOffset ? label.pixelOffset[0] : 0;
  tuneGridInput(pxInput);
  styleInput(pxInput);

  const pyInput = document.createElement('input');
  pyInput.type = 'number';
  pyInput.placeholder = 'Y';
  pyInput.value = label.pixelOffset ? label.pixelOffset[1] : 0;
  tuneGridInput(pyInput);
  styleInput(pyInput);

  const updatePixelOffset = () => {
    const x = parseFloat(pxInput.value) || 0;
    const y = parseFloat(pyInput.value) || 0;
    label.setPixelOffset(x, y).update();
  };
  pxInput.addEventListener('input', updatePixelOffset);
  pyInput.addEventListener('input', updatePixelOffset);

  pixelOffsetContainer.appendChild(pxInput);
  pixelOffsetContainer.appendChild(pyInput);
  pixelOffsetRow.appendChild(pixelOffsetContainer);
  posSection.appendChild(pixelOffsetRow);

  // Origins
  const originRow = tuneRow(createControlRow(`${t('horizontalOrigin', lang)} / ${t('verticalOrigin', lang)}`, labelWidth));
  const originContainer = createTwoColGrid();

  const hOriginSel = document.createElement('select');
  ['CENTER', 'LEFT', 'RIGHT'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (label.horizontalOrigin === o) opt.selected = true;
      hOriginSel.appendChild(opt);
  });
  tuneGridInput(hOriginSel);
  styleInput(hOriginSel);
  hOriginSel.addEventListener('change', (e) => label.setHorizontalOrigin(e.target.value).update());

  const vOriginSel = document.createElement('select');
  ['CENTER', 'BOTTOM', 'TOP', 'BASELINE'].forEach(o => {
      const opt = document.createElement('option');
      opt.value = o;
      opt.text = o;
      if (label.verticalOrigin === o) opt.selected = true;
      vOriginSel.appendChild(opt);
  });
  tuneGridInput(vOriginSel);
  styleInput(vOriginSel);
  vOriginSel.addEventListener('change', (e) => label.setVerticalOrigin(e.target.value).update());

  originContainer.appendChild(hOriginSel);
  originContainer.appendChild(vOriginSel);
  originRow.appendChild(originContainer);
  posSection.appendChild(originRow);

  container.appendChild(posSection);

  // ====================================================================
  // Section 2: Style
  // ====================================================================
  const styleSection = createSection(lang === 'zh' ? '样式' : 'Style');

  // Text Content
  const textRow = tuneRow(createControlRow(t('text', lang), labelWidth));
  const textContainer = document.createElement('div');
  tuneControl(textContainer);
  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.value = label.text;
  tuneWideInput(textInput);
  styleInput(textInput);
  textInput.addEventListener('input', (e) => {
    label.setText(e.target.value).update();
  });
  textContainer.appendChild(textInput);
  textRow.appendChild(textContainer);
  styleSection.appendChild(textRow);

  // Font
  const fontRow = tuneRow(createControlRow(t('font', lang), labelWidth));
  const fontContainer = document.createElement('div');
  tuneControl(fontContainer);
  const fontInput = document.createElement('input');
  fontInput.type = 'text';
  fontInput.value = label.font;
  fontInput.placeholder = '30px sans-serif';
  tuneWideInput(fontInput);
  styleInput(fontInput);
  fontInput.addEventListener('change', (e) => {
    label.setFont(e.target.value).update();
  });
  fontContainer.appendChild(fontInput);
  fontRow.appendChild(fontContainer);
  styleSection.appendChild(fontRow);

  // Font Size & Bold
  const fontSizeRow = tuneRow(createControlRow(lang === 'zh' ? '字号 & 粗体' : 'Size & Bold', labelWidth));
  const fontSizeContainer = document.createElement('div');
  tuneControl(fontSizeContainer);
  
  const fontSizeInput = document.createElement('input');
  fontSizeInput.type = 'number';
  fontSizeInput.step = '1';
  fontSizeInput.min = '1';
  fontSizeInput.value = label.fontSize || 14;
  tuneNumberInput(fontSizeInput, '100px');
  styleInput(fontSizeInput);
  fontSizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      label.setFontSize(val).update();
    }
  });

  const boldLabel = document.createElement('label');
  boldLabel.style.display = 'flex';
  boldLabel.style.alignItems = 'center';
  boldLabel.style.fontSize = '11px';
  boldLabel.style.color = '#ccc';
  boldLabel.style.gap = '4px';
  boldLabel.style.marginLeft = '10px';
  
  const boldCheck = document.createElement('input');
  boldCheck.type = 'checkbox';
  boldCheck.checked = !!label.bold;
  boldCheck.style.cursor = 'pointer';
  boldCheck.addEventListener('change', (e) => {
    label.setBold(!!e.target.checked).update();
  });
  
  boldLabel.appendChild(boldCheck);
  boldLabel.appendChild(document.createTextNode(t('bold', lang)));

  fontSizeContainer.appendChild(fontSizeInput);
  fontSizeContainer.appendChild(boldLabel);
  fontSizeRow.appendChild(fontSizeContainer);
  styleSection.appendChild(fontSizeRow);

  // Style
  const styleRow = tuneRow(createControlRow(t('style', lang), labelWidth));
  const styleContainer = document.createElement('div');
  tuneControl(styleContainer);
  const styleSel = document.createElement('select');
  ['FILL', 'OUTLINE', 'FILL_AND_OUTLINE'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.text = s;
      if (label.style === s) opt.selected = true;
      styleSel.appendChild(opt);
  });
  tuneWideInput(styleSel);
  styleInput(styleSel);
  styleSel.addEventListener('change', (e) => label.setStyle(e.target.value).update());
  styleContainer.appendChild(styleSel);
  styleRow.appendChild(styleContainer);
  styleSection.appendChild(styleRow);

  // Colors (Fill & Outline)
  const colorRow = tuneRow(createControlRow(t('color', lang), labelWidth));
  const colorContainer = document.createElement('div');
  tuneControl(colorContainer);
  colorContainer.style.gap = '6px';

  const fillColorInput = document.createElement('input');
  fillColorInput.type = 'color';
  fillColorInput.value = colorToHex(label.color || label.fillColor);
  fillColorInput.style.width = '30px';
  fillColorInput.style.height = '20px';
  fillColorInput.style.border = 'none';
  fillColorInput.style.padding = '0';
  fillColorInput.style.background = 'transparent';
  fillColorInput.title = 'Fill Color';
  fillColorInput.style.cursor = 'pointer';
  fillColorInput.addEventListener('input', (e) => label.setColor(e.target.value).update());

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  outlineColorInput.value = colorToHex(label.outlineColor || '#000000');
  outlineColorInput.style.width = '30px';
  outlineColorInput.style.height = '20px';
  outlineColorInput.style.border = 'none';
  outlineColorInput.style.padding = '0';
  outlineColorInput.style.background = 'transparent';
  outlineColorInput.title = 'Outline Color';
  outlineColorInput.style.cursor = 'pointer';
  outlineColorInput.addEventListener('input', (e) => label.setOutlineColor(e.target.value).update());

  const outlineWidthInput = document.createElement('input');
  outlineWidthInput.type = 'number';
  outlineWidthInput.min = '1';
  outlineWidthInput.value = label.outlineWidth || 2;
  tuneNumberInput(outlineWidthInput, '110px');
  styleInput(outlineWidthInput);
  outlineWidthInput.addEventListener('input', (e) => label.setOutlineWidth(parseFloat(e.target.value)).update());

  colorContainer.appendChild(fillColorInput);
  colorContainer.appendChild(outlineColorInput);
  colorContainer.appendChild(outlineWidthInput);
  colorRow.appendChild(colorContainer);
  styleSection.appendChild(colorRow);

  // Background
  const bgRow = tuneRow(createControlRow(t('background', lang), labelWidth));
  const bgContainer = document.createElement('div');
  tuneControl(bgContainer);
  bgContainer.style.gap = '6px';

  const bgCheck = document.createElement('input');
  bgCheck.type = 'checkbox';
  bgCheck.checked = label.showBackground;
  bgCheck.style.cursor = 'pointer';
  bgCheck.addEventListener('change', (e) => {
    label.setBackgroundColor(e.target.checked ? bgColorInput.value : null).update();
  });

  const bgColorInput = document.createElement('input');
  bgColorInput.type = 'color';
  bgColorInput.value = colorToHex(label.backgroundColor);
  bgColorInput.style.width = '30px';
  bgColorInput.style.height = '20px';
  bgColorInput.style.border = 'none';
  bgColorInput.style.padding = '0';
  bgColorInput.style.background = 'transparent';
  bgColorInput.style.cursor = 'pointer';
  bgColorInput.addEventListener('input', (e) => {
    if (!bgCheck.checked) return;
    label.setBackgroundColor(e.target.value).update();
  });

  bgContainer.appendChild(bgCheck);
  bgContainer.appendChild(bgColorInput);
  bgRow.appendChild(bgContainer);
  styleSection.appendChild(bgRow);

  // Scale
  const scaleRow = tuneRow(createControlRow(t('scale', lang), labelWidth));
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.step = '0.1';
  scaleInput.min = '0.1';
  scaleInput.value = label.scale || 1.0;
  tuneNumberInput(scaleInput, '120px');
  scaleInput.style.marginLeft = 'auto';
  styleInput(scaleInput);
  scaleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      label.setScale(val).update();
    }
  });
  scaleRow.appendChild(scaleInput);
  styleSection.appendChild(scaleRow);

  container.appendChild(styleSection);

  // ====================================================================
  // Section 3: Display Control
  // ====================================================================
  const displaySection = createSection(lang === 'zh' ? '显示控制' : 'Display Control');

  // Distance Display
  const distanceRow = tuneRow(createControlRow(t('distanceDisplay', lang), labelWidth));
  const distanceContainer = document.createElement('div');
  tuneControl(distanceContainer);
  distanceContainer.style.gap = '6px';

  const nearInput = document.createElement('input');
  nearInput.type = 'number';
  nearInput.placeholder = t('near', lang);
  nearInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.near : 0;
  tuneNumberInput(nearInput, '110px');
  styleInput(nearInput);

  const farInput = document.createElement('input');
  farInput.type = 'number';
  farInput.placeholder = t('far', lang);
  farInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.far : '';
  tuneNumberInput(farInput, '110px');
  styleInput(farInput);

  const updateDistance = () => {
    const n = parseFloat(nearInput.value) || 0;
    const f = parseFloat(farInput.value);
    label.setDistanceDisplayCondition({ near: n, far: isNaN(f) ? undefined : f }).update();
  };
  nearInput.addEventListener('input', updateDistance);
  farInput.addEventListener('input', updateDistance);

  distanceContainer.appendChild(nearInput);
  distanceContainer.appendChild(farInput);
  distanceRow.appendChild(distanceContainer);
  displaySection.appendChild(distanceRow);

  // Scale By Distance
  const scaleDistRow = tuneRow(createControlRow(t('scaleByDistance', lang), labelWidth));
  const scaleDistContainer = createTwoColGrid();
  const snInput = document.createElement('input');
  snInput.type = 'number';
  snInput.placeholder = t('near', lang);
  snInput.value = label.scaleByDistance ? label.scaleByDistance.near : '';
  tuneGridInput(snInput);
  styleInput(snInput);

  const snvInput = document.createElement('input');
  snvInput.type = 'number';
  snvInput.placeholder = t('nearValue', lang);
  snvInput.value = label.scaleByDistance ? label.scaleByDistance.nearValue : '';
  tuneGridInput(snvInput);
  styleInput(snvInput);

  const sfInput = document.createElement('input');
  sfInput.type = 'number';
  sfInput.placeholder = t('far', lang);
  sfInput.value = label.scaleByDistance ? label.scaleByDistance.far : '';
  tuneGridInput(sfInput);
  styleInput(sfInput);

  const sfvInput = document.createElement('input');
  sfvInput.type = 'number';
  sfvInput.placeholder = t('farValue', lang);
  sfvInput.value = label.scaleByDistance ? label.scaleByDistance.farValue : '';
  tuneGridInput(sfvInput);
  styleInput(sfvInput);

  const updateScaleDist = () => {
    const n = parseFloat(snInput.value);
    const nv = parseFloat(snvInput.value);
    const f = parseFloat(sfInput.value);
    const fv = parseFloat(sfvInput.value);

    label.setScaleByDistance({
      near: isNaN(n) ? undefined : n,
      nearValue: isNaN(nv) ? undefined : nv,
      far: isNaN(f) ? undefined : f,
      farValue: isNaN(fv) ? undefined : fv
    }).update();
  };
  snInput.addEventListener('input', updateScaleDist);
  snvInput.addEventListener('input', updateScaleDist);
  sfInput.addEventListener('input', updateScaleDist);
  sfvInput.addEventListener('input', updateScaleDist);

  scaleDistContainer.appendChild(snInput);
  scaleDistContainer.appendChild(snvInput);
  scaleDistContainer.appendChild(sfInput);
  scaleDistContainer.appendChild(sfvInput);
  scaleDistRow.appendChild(scaleDistContainer);
  displaySection.appendChild(scaleDistRow);

  // Translucency By Distance
  const transDistRow = tuneRow(createControlRow(t('translucencyByDistance', lang), labelWidth));
  const transDistContainer = createTwoColGrid();

  const tnInput = document.createElement('input');
  tnInput.type = 'number';
  tnInput.placeholder = t('near', lang);
  tnInput.value = label.translucencyByDistance ? label.translucencyByDistance.near : '';
  tuneGridInput(tnInput);
  styleInput(tnInput);

  const tnvInput = document.createElement('input');
  tnvInput.type = 'number';
  tnvInput.placeholder = t('nearValue', lang);
  tnvInput.value = label.translucencyByDistance ? label.translucencyByDistance.nearValue : '';
  tuneGridInput(tnvInput);
  styleInput(tnvInput);

  const tfInput = document.createElement('input');
  tfInput.type = 'number';
  tfInput.placeholder = t('far', lang);
  tfInput.value = label.translucencyByDistance ? label.translucencyByDistance.far : '';
  tuneGridInput(tfInput);
  styleInput(tfInput);

  const tfvInput = document.createElement('input');
  tfvInput.type = 'number';
  tfvInput.placeholder = t('farValue', lang);
  tfvInput.value = label.translucencyByDistance ? label.translucencyByDistance.farValue : '';
  tuneGridInput(tfvInput);
  styleInput(tfvInput);

  const updateTransByDist = () => {
    const n = parseFloat(tnInput.value);
    const nv = parseFloat(tnvInput.value);
    const f = parseFloat(tfInput.value);
    const fv = parseFloat(tfvInput.value);
    
    label.setTranslucencyByDistance({ 
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

  // Pixel Offset Scale By Distance
  const posDistRow = tuneRow(createControlRow(t('pixelOffsetScaleByDistance', lang), labelWidth));
  const posDistContainer = createTwoColGrid();

  const posnInput = document.createElement('input');
  posnInput.type = 'number';
  posnInput.placeholder = t('near', lang);
  posnInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.near : '';
  tuneGridInput(posnInput);
  styleInput(posnInput);

  const posnvInput = document.createElement('input');
  posnvInput.type = 'number';
  posnvInput.placeholder = t('nearValue', lang);
  posnvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.nearValue : '';
  tuneGridInput(posnvInput);
  styleInput(posnvInput);

  const posfInput = document.createElement('input');
  posfInput.type = 'number';
  posfInput.placeholder = t('far', lang);
  posfInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.far : '';
  tuneGridInput(posfInput);
  styleInput(posfInput);

  const posfvInput = document.createElement('input');
  posfvInput.type = 'number';
  posfvInput.placeholder = t('farValue', lang);
  posfvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.farValue : '';
  tuneGridInput(posfvInput);
  styleInput(posfvInput);

  const updatePosDist = () => {
    const n = parseFloat(posnInput.value);
    const nv = parseFloat(posnvInput.value);
    const f = parseFloat(posfInput.value);
    const fv = parseFloat(posfvInput.value);
    
    label.setPixelOffsetScaleByDistance({ 
        near: isNaN(n) ? undefined : n, 
        nearValue: isNaN(nv) ? undefined : nv, 
        far: isNaN(f) ? undefined : f, 
        farValue: isNaN(fv) ? undefined : fv 
    }).update();
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
  displaySection.appendChild(posDistRow);

  const posHint = document.createElement('div');
  posHint.style.fontSize = '10px';
  posHint.style.color = '#9ca3af';
  posHint.style.textAlign = 'right';
  posHint.style.marginTop = '-4px';
  posHint.style.marginBottom = '8px';
  posHint.textContent = lang === 'zh' ? '* 需设置像素偏移(Pixel Offset)才生效' : '* Requires Pixel Offset to be set';
  displaySection.appendChild(posHint);

  // Visible Height Range
  const visHRow = tuneRow(createControlRow(lang === 'zh' ? '可见高度' : 'Visible Height', labelWidth));
  const visHContainer = createTwoColGrid();
  
  const minHInput = document.createElement('input');
  minHInput.type = 'number';
  minHInput.placeholder = 'Min';
  minHInput.value = label.minDisplayHeight || 0;
  tuneGridInput(minHInput);
  styleInput(minHInput);

  const maxHInput = document.createElement('input');
  maxHInput.type = 'number';
  maxHInput.placeholder = 'Max';
  maxHInput.value = label.maxDisplayHeight === Infinity ? '' : label.maxDisplayHeight;
  tuneGridInput(maxHInput);
  styleInput(maxHInput);

  const updateVisH = () => {
    const min = parseFloat(minHInput.value) || 0;
    const max = parseFloat(maxHInput.value);
    label.setDisplayHeightRange(min, isNaN(max) ? undefined : max).update();
  };
  minHInput.addEventListener('input', updateVisH);
  maxHInput.addEventListener('input', updateVisH);

  visHContainer.appendChild(minHInput);
  visHContainer.appendChild(maxHInput);
  visHRow.appendChild(visHContainer);
  displaySection.appendChild(visHRow);

  // Disable Depth Test
  const depthRow = tuneRow(createControlRow(lang === 'zh' ? '深度检测' : 'Depth Test', labelWidth));
  const depthContainer = document.createElement('div');
  tuneControl(depthContainer);
  
  const depthCheck = document.createElement('input');
  depthCheck.type = 'checkbox';
  depthCheck.checked = label.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  depthCheck.style.cursor = 'pointer';
  
  const depthLabel = document.createElement('span');
  depthLabel.textContent = lang === 'zh' ? '禁用深度检测 (始终置顶)' : 'Disable Depth Test (Always Top)';
  depthLabel.style.fontSize = '11px';
  depthLabel.style.color = '#ccc';
  
  depthCheck.addEventListener('change', (e) => {
    label.setDisableDepthTestDistance(e.target.checked ? Number.POSITIVE_INFINITY : undefined).update();
  });
  
  depthContainer.appendChild(depthCheck);
  depthContainer.appendChild(depthLabel);
  depthRow.appendChild(depthContainer);
  displaySection.appendChild(depthRow);

  container.appendChild(displaySection);

  // ====================================================================
  // Save & Restore
  // ====================================================================
  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.justifyContent = 'flex-end';
  actionRow.style.gap = '10px';
  actionRow.style.marginTop = '16px';
  actionRow.style.paddingTop = '12px';
  actionRow.style.borderTop = '1px solid rgba(255,255,255,0.1)';

  const saveBtn = createButton(t('saveState', lang), () => {
    label.saveState();
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'OK!';
    saveBtn.style.background = '#10b981';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.background = '#3b82f6';
    }, 1500);
  });
  
  const restoreBtn = createButton(t('restoreState', lang), () => {
    label.restoreState();
    
    // Refresh inputs
    heightInput.value = label.heightOffset || 0;
    clampCheck.checked = label.heightReference === 'clampToGround';
    textInput.value = label.text;
    fontInput.value = label.font;
    fontSizeInput.value = label.fontSize || 14;
    boldCheck.checked = !!label.bold;
    styleSel.value = label.style;
    fillColorInput.value = colorToHex(label.color || label.fillColor);
    outlineColorInput.value = colorToHex(label.outlineColor || '#000000');
    outlineWidthInput.value = label.outlineWidth || 2;
    bgCheck.checked = label.showBackground;
    bgColorInput.value = colorToHex(label.backgroundColor);
    scaleInput.value = label.scale;
    pxInput.value = label.pixelOffset ? label.pixelOffset[0] : 0;
    pyInput.value = label.pixelOffset ? label.pixelOffset[1] : 0;
    exInput.value = label.eyeOffset ? label.eyeOffset[0] : 0;
    eyInput.value = label.eyeOffset ? label.eyeOffset[1] : 0;
    ezInput.value = label.eyeOffset ? label.eyeOffset[2] : 0;
    hOriginSel.value = label.horizontalOrigin;
    vOriginSel.value = label.verticalOrigin;
    nearInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.near : 0;
    farInput.value = label.distanceDisplayCondition ? label.distanceDisplayCondition.far : '';
    snInput.value = label.scaleByDistance ? label.scaleByDistance.near : '';
    snvInput.value = label.scaleByDistance ? label.scaleByDistance.nearValue : '';
    sfInput.value = label.scaleByDistance ? label.scaleByDistance.far : '';
    sfvInput.value = label.scaleByDistance ? label.scaleByDistance.farValue : '';
    tnInput.value = label.translucencyByDistance ? label.translucencyByDistance.near : '';
    tnvInput.value = label.translucencyByDistance ? label.translucencyByDistance.nearValue : '';
    tfInput.value = label.translucencyByDistance ? label.translucencyByDistance.far : '';
    tfvInput.value = label.translucencyByDistance ? label.translucencyByDistance.farValue : '';
    posnInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.near : '';
    posnvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.nearValue : '';
    posfInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.far : '';
    posfvInput.value = label.pixelOffsetScaleByDistance ? label.pixelOffsetScaleByDistance.farValue : '';
    minHInput.value = label.minDisplayHeight || 0;
    maxHInput.value = label.maxDisplayHeight === Infinity ? '' : label.maxDisplayHeight;
    depthCheck.checked = label.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  }, 'secondary');

  actionRow.appendChild(saveBtn);
  actionRow.appendChild(restoreBtn);
  container.appendChild(actionRow);

  // Copy Config Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '10px';
  btnRow.style.marginTop = '20px';

  const copyNativeBtn = createButton(t('copyNative', lang), () => {
    const isRelative = label.heightReference === 'relativeToGround';
    const h = isRelative ? (label.heightOffset || 0) : (label.position[2] || 0) + (label.heightOffset || 0);

    let nativeCode = `viewer.entities.add({\n` +
      `  position: Cesium.Cartesian3.fromDegrees(${label.position[0]}, ${label.position[1]}, ${h}),\n` +
      `  label: {\n` +
      `    text: '${label.text}',\n` +
      `    font: '${label.font}',\n` +
      `    fillColor: Cesium.Color.fromCssColorString('${label.color || label.fillColor}'),\n` +
      `    outlineColor: Cesium.Color.fromCssColorString('${label.outlineColor}'),\n` +
      `    outlineWidth: ${label.outlineWidth},\n` +
      `    style: Cesium.LabelStyle.${label.style},\n`;

    if (label.showBackground) {
        nativeCode += `    showBackground: true,\n` +
                      `    backgroundColor: Cesium.Color.fromCssColorString('${label.backgroundColor}'),\n`;
    }

    if (label.scale !== 1.0) {
        nativeCode += `    scale: ${label.scale},\n`;
    }

    if (label.heightReference === 'clampToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,\n`;
    } else if (label.heightReference === 'relativeToGround') {
        nativeCode += `    heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,\n`;
    }

    if (label.pixelOffset) {
        nativeCode += `    pixelOffset: new Cesium.Cartesian2(${label.pixelOffset[0]}, ${label.pixelOffset[1]}),\n`;
    }

    if (label.eyeOffset) {
        nativeCode += `    eyeOffset: new Cesium.Cartesian3(${label.eyeOffset[0]}, ${label.eyeOffset[1]}, ${label.eyeOffset[2]}),\n`;
    }

    if (label.horizontalOrigin) {
        nativeCode += `    horizontalOrigin: Cesium.HorizontalOrigin.${label.horizontalOrigin},\n`;
    }
    
    if (label.verticalOrigin) {
        nativeCode += `    verticalOrigin: Cesium.VerticalOrigin.${label.verticalOrigin},\n`;
    }

    if (label.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        nativeCode += `    disableDepthTestDistance: Number.POSITIVE_INFINITY,\n`;
    }

    if (label.minDisplayHeight && label.minDisplayHeight !== 0) {
        nativeCode += `    minDisplayHeight: ${label.minDisplayHeight},\n`;
    }
    if (Number.isFinite(label.maxDisplayHeight) && label.maxDisplayHeight !== Infinity) {
        nativeCode += `    maxDisplayHeight: ${label.maxDisplayHeight},\n`;
    }

    if (label.distanceDisplayCondition) {
        nativeCode += `    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(${label.distanceDisplayCondition.near}, ${label.distanceDisplayCondition.far}),\n`;
    }

    if (label.scaleByDistance) {
        nativeCode += `    scaleByDistance: new Cesium.NearFarScalar(${label.scaleByDistance.near}, ${label.scaleByDistance.nearValue}, ${label.scaleByDistance.far}, ${label.scaleByDistance.farValue}),\n`;
    }
    
    if (label.translucencyByDistance) {
        nativeCode += `    translucencyByDistance: new Cesium.NearFarScalar(${label.translucencyByDistance.near}, ${label.translucencyByDistance.nearValue}, ${label.translucencyByDistance.far}, ${label.translucencyByDistance.farValue}),\n`;
    }
    
    if (label.pixelOffsetScaleByDistance) {
        nativeCode += `    pixelOffsetScaleByDistance: new Cesium.NearFarScalar(${label.pixelOffsetScaleByDistance.near}, ${label.pixelOffsetScaleByDistance.nearValue}, ${label.pixelOffsetScaleByDistance.far}, ${label.pixelOffsetScaleByDistance.farValue}),\n`;
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
    let chain = `entity.label({\n` +
      `  text: '${label.text}',\n` +
      `  font: '${label.font}',\n` +
      `  fillColor: '${label.color || label.fillColor}',\n` +
      `  outlineColor: '${label.outlineColor}',\n` +
      `  outlineWidth: ${label.outlineWidth},\n` +
      `  style: '${label.style}'`;

    if (label.showBackground) {
        chain += `,\n  showBackground: true,\n  backgroundColor: '${label.backgroundColor}'`;
    }

    if (label.scale !== 1.0) {
        chain += `,\n  scale: ${label.scale}`;
    }

    if (label.heightReference === 'clampToGround') {
      chain += `,\n  heightReference: 'clampToGround'`;
    } else if (label.heightReference === 'relativeToGround') {
      chain += `,\n  heightReference: 'relativeToGround'`;
    }

    if (label.heightOffset !== 0) {
      chain += `,\n  heightOffset: ${label.heightOffset}`;
    }

    if (label.pixelOffset && (label.pixelOffset[0] !== 0 || label.pixelOffset[1] !== 0)) {
        chain += `,\n  pixelOffset: [${label.pixelOffset[0]}, ${label.pixelOffset[1]}]`;
    }
    if (label.eyeOffset && (label.eyeOffset[0] !== 0 || label.eyeOffset[1] !== 0 || label.eyeOffset[2] !== 0)) {
        chain += `,\n  eyeOffset: [${label.eyeOffset[0]}, ${label.eyeOffset[1]}, ${label.eyeOffset[2]}]`;
    }
    if (label.horizontalOrigin) {
        chain += `,\n  horizontalOrigin: '${label.horizontalOrigin}'`;
    }
    if (label.verticalOrigin) {
        chain += `,\n  verticalOrigin: '${label.verticalOrigin}'`;
    }
    if (label.distanceDisplayCondition) {
        chain += `,\n  distanceDisplayCondition: { near: ${label.distanceDisplayCondition.near}, far: ${label.distanceDisplayCondition.far} }`;
    }
    if (label.scaleByDistance) {
        chain += `,\n  scaleByDistance: { near: ${label.scaleByDistance.near}, nearValue: ${label.scaleByDistance.nearValue}, far: ${label.scaleByDistance.far}, farValue: ${label.scaleByDistance.farValue} }`;
    }
    if (label.translucencyByDistance) {
        chain += `,\n  translucencyByDistance: { near: ${label.translucencyByDistance.near}, nearValue: ${label.translucencyByDistance.nearValue}, far: ${label.translucencyByDistance.far}, farValue: ${label.translucencyByDistance.farValue} }`;
    }
    if (label.pixelOffsetScaleByDistance) {
        chain += `,\n  pixelOffsetScaleByDistance: { near: ${label.pixelOffsetScaleByDistance.near}, nearValue: ${label.pixelOffsetScaleByDistance.nearValue}, far: ${label.pixelOffsetScaleByDistance.far}, farValue: ${label.pixelOffsetScaleByDistance.farValue} }`;
    }
    if (label.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        chain += `,\n  disableDepthTestDistance: true`;
    }

    if (label.minDisplayHeight && label.minDisplayHeight !== 0) {
        chain += `,\n  minDisplayHeight: ${label.minDisplayHeight}`;
    }
    if (Number.isFinite(label.maxDisplayHeight) && label.maxDisplayHeight !== Infinity) {
        chain += `,\n  maxDisplayHeight: ${label.maxDisplayHeight}`;
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
