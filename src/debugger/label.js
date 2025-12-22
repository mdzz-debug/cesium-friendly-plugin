import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderLabelDebugger(container, labelObj, lang = 'zh') {
  const pos = labelObj.position || [0, 0, 0];
  const groupName = labelObj.group || t('defaultGroup', lang);

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
  typeBadge.textContent = 'LABEL';
  typeBadge.style.cssText = `
    padding: 2px 6px;
    background: rgba(16, 185, 129, 0.2);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.3);
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
  idRow.textContent = labelObj.id;
  idRow.title = labelObj.id;
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
  if (labelObj.heightReference !== 'none') {
    alt = labelObj.heightOffset || 0;
  }

  coordsGrid.appendChild(createCoordItem(t('lng', lang), pos[0].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('lat', lang), pos[1].toFixed(6)));
  coordsGrid.appendChild(createCoordItem(t('alt', lang), alt.toFixed(1)));
  infoBox.appendChild(coordsGrid);

  container.appendChild(infoBox);

  // --- Controls ---
  const LABEL_WIDTH = 'auto';

  // Text
  const textRow = createControlRow(t('labelText', lang), LABEL_WIDTH);
  const textInput = document.createElement('input');
  styleInput(textInput);
  textInput.value = labelObj.text;
  // textInput.style.width = '100%';
  textInput.oninput = (e) => labelObj.setText(e.target.value);
  textRow.appendChild(textInput);
  container.appendChild(textRow);

  // Font Size & Bold
  const fontRow = createControlRow(t('size', lang), LABEL_WIDTH);
  fontRow.style.display = 'flex';
  fontRow.style.gap = '8px';

  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  styleInput(sizeInput);
  sizeInput.value = labelObj.fontSize;
  sizeInput.style.width = '60px';
  sizeInput.oninput = (e) => labelObj.setFontSize(parseInt(e.target.value) || 14);

  const boldLabel = document.createElement('label');
  boldLabel.style.cssText = 'display:flex;align-items:center;gap:4px;color:#ccc;font-size:12px;cursor:pointer;';
  const boldCheck = document.createElement('input');
  boldCheck.type = 'checkbox';
  boldCheck.checked = labelObj.bold;
  boldCheck.onchange = (e) => labelObj.setBold(e.target.checked);
  boldLabel.appendChild(boldCheck);
  boldLabel.appendChild(document.createTextNode(t('bold', lang)));

  fontRow.appendChild(sizeInput);
  fontRow.appendChild(boldLabel);
  container.appendChild(fontRow);

  // Color & Background
  const colorRow = createControlRow(t('color', lang), LABEL_WIDTH);
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(labelObj.color);
  colorInput.style.cursor = 'pointer';
  colorInput.style.width = '40px';
  colorInput.style.height = '24px';
  colorInput.style.border = 'none';
  colorInput.style.padding = '0';
  colorInput.style.background = 'transparent';
  colorInput.oninput = (e) => labelObj.setColor(e.target.value);

  const bgLabel = document.createElement('label');
  bgLabel.style.cssText = 'display:flex;align-items:center;gap:4px;color:#ccc;font-size:12px;cursor:pointer;margin-left:10px;';
  const bgCheck = document.createElement('input');
  bgCheck.type = 'checkbox';
  bgCheck.checked = !!labelObj.backgroundColor;
  
  const bgColorInput = document.createElement('input');
  bgColorInput.type = 'color';
  bgColorInput.value = colorToHex(labelObj.backgroundColor || '#000000');
  bgColorInput.style.cursor = 'pointer';
  bgColorInput.style.width = '40px';
  bgColorInput.style.height = '24px';
  bgColorInput.style.border = 'none';
  bgColorInput.style.padding = '0';
  bgColorInput.style.background = 'transparent';
  bgColorInput.disabled = !bgCheck.checked;
  if (!bgCheck.checked) bgColorInput.style.opacity = '0.5';

  bgCheck.onchange = (e) => {
      bgColorInput.disabled = !e.target.checked;
      bgColorInput.style.opacity = e.target.checked ? '1' : '0.5';
      labelObj.setBackgroundColor(e.target.checked ? bgColorInput.value : null);
  };
  bgColorInput.oninput = (e) => {
      if (bgCheck.checked) labelObj.setBackgroundColor(e.target.value);
  };

  bgLabel.appendChild(bgCheck);
  bgLabel.appendChild(document.createTextNode(t('bgColor', lang)));

  colorRow.appendChild(colorInput);
  colorRow.appendChild(bgLabel);
  colorRow.appendChild(bgColorInput);
  container.appendChild(colorRow);

  // Scale
  const scaleRow = createControlRow(t('scale', lang), LABEL_WIDTH);
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.step = '0.1';
  styleInput(scaleInput);
  scaleInput.value = labelObj.scale;
  // scaleInput.style.width = '100%';
  scaleInput.oninput = (e) => labelObj.setScale(parseFloat(e.target.value) || 1.0);
  scaleRow.appendChild(scaleInput);
  container.appendChild(scaleRow);

  // Height Control
  const heightRow = createControlRow(t('height', lang), LABEL_WIDTH);
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
  clampCheck.checked = labelObj.heightReference === 'clampToGround' || labelObj.heightReference === 'relativeToGround';
  clampCheck.style.cursor = 'pointer';
  
  clampLabel.appendChild(clampCheck);
  clampLabel.appendChild(document.createTextNode(t('clamp', lang)));
  heightContainer.appendChild(clampLabel);

  // Height Input
  const heightInput = document.createElement('input');
  heightInput.type = 'number';
  heightInput.step = '1';
  // Use labelObj.heightOffset for clamped (offset), or position[2] for absolute
  // But our new logic syncs both to position[2] and heightOffset basically
  // So we can just use position[2] or heightOffset.
  heightInput.value = labelObj.position[2] || 0;
  heightInput.placeholder = t('height', lang);
  heightInput.style.width = '60px';
  styleInput(heightInput);

  // Events
  clampCheck.addEventListener('change', (e) => {
    labelObj.setClampToGround(e.target.checked);
  });

  heightInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      labelObj.setHeight(val);
    }
  });

  heightContainer.appendChild(heightInput);
  heightRow.appendChild(heightContainer);
  container.appendChild(heightRow);

  // Pixel Offset
  const pixelOffsetRow = createControlRow(t('pixelOffset', lang));
  pixelOffsetRow.style.display = 'block';
  
  const pixelOffsetContainer = document.createElement('div');
  pixelOffsetContainer.style.display = 'flex';
  pixelOffsetContainer.style.gap = '8px';
  pixelOffsetContainer.style.width = '100%';
  pixelOffsetContainer.style.marginTop = '4px';

  const pixelOffsetXInput = document.createElement('input');
  pixelOffsetXInput.type = 'number';
  styleInput(pixelOffsetXInput);
  pixelOffsetXInput.placeholder = 'X';
  pixelOffsetXInput.value = labelObj.pixelOffset ? labelObj.pixelOffset[0] : 0;
  pixelOffsetXInput.style.flex = '1';

  const pixelOffsetYInput = document.createElement('input');
  pixelOffsetYInput.type = 'number';
  styleInput(pixelOffsetYInput);
  pixelOffsetYInput.placeholder = 'Y';
  pixelOffsetYInput.value = labelObj.pixelOffset ? labelObj.pixelOffset[1] : 0;
  pixelOffsetYInput.style.flex = '1';

  const updatePixelOffset = () => {
      labelObj.setPixelOffset(
          parseFloat(pixelOffsetXInput.value) || 0,
          parseFloat(pixelOffsetYInput.value) || 0
      );
  };
  pixelOffsetXInput.oninput = updatePixelOffset;
  pixelOffsetYInput.oninput = updatePixelOffset;

  pixelOffsetContainer.appendChild(pixelOffsetXInput);
  pixelOffsetContainer.appendChild(pixelOffsetYInput);
  pixelOffsetRow.appendChild(pixelOffsetContainer);
  container.appendChild(pixelOffsetRow);

  // Eye Offset
  const eyeOffsetRow = createControlRow(t('eyeOffset', lang) || 'Eye Offset');
  eyeOffsetRow.style.display = 'block';

  const eyeOffsetContainer = document.createElement('div');
  eyeOffsetContainer.style.display = 'flex';
  eyeOffsetContainer.style.gap = '8px';
  eyeOffsetContainer.style.width = '100%';
  eyeOffsetContainer.style.marginTop = '4px';

  const eyeOffsetXInput = document.createElement('input');
  eyeOffsetXInput.type = 'number';
  styleInput(eyeOffsetXInput);
  eyeOffsetXInput.placeholder = 'X';
  eyeOffsetXInput.value = labelObj.eyeOffset ? labelObj.eyeOffset[0] : 0;
  eyeOffsetXInput.style.flex = '1';
  eyeOffsetXInput.style.width = '20%';

  const eyeOffsetYInput = document.createElement('input');
  eyeOffsetYInput.type = 'number';
  styleInput(eyeOffsetYInput);
  eyeOffsetYInput.placeholder = 'Y';
  eyeOffsetYInput.value = labelObj.eyeOffset ? labelObj.eyeOffset[1] : 0;
  eyeOffsetYInput.style.flex = '1';
  eyeOffsetYInput.style.width = '20%';

  const eyeOffsetZInput = document.createElement('input');
  eyeOffsetZInput.type = 'number';
  styleInput(eyeOffsetZInput);
  eyeOffsetZInput.placeholder = 'Z';
  eyeOffsetZInput.value = labelObj.eyeOffset ? labelObj.eyeOffset[2] : 0;
  eyeOffsetZInput.style.flex = '1';
  eyeOffsetZInput.style.width = '20%';

  const updateEyeOffset = () => {
      labelObj.setEyeOffset(
          parseFloat(eyeOffsetXInput.value) || 0,
          parseFloat(eyeOffsetYInput.value) || 0,
          parseFloat(eyeOffsetZInput.value) || 0
      );
  };
  eyeOffsetXInput.oninput = updateEyeOffset;
  eyeOffsetYInput.oninput = updateEyeOffset;
  eyeOffsetZInput.oninput = updateEyeOffset;

  eyeOffsetContainer.appendChild(eyeOffsetXInput);
  eyeOffsetContainer.appendChild(eyeOffsetYInput);
  eyeOffsetContainer.appendChild(eyeOffsetZInput);
  eyeOffsetRow.appendChild(eyeOffsetContainer);
  container.appendChild(eyeOffsetRow);

  // Disable Depth Test Distance
  const depthTestRow = createControlRow(t('depthTest', lang) || 'Depth Test', LABEL_WIDTH);
  const depthTestContainer = document.createElement('div');
  depthTestContainer.style.display = 'flex';
  depthTestContainer.style.gap = '8px';
  depthTestContainer.style.alignItems = 'center';

  const depthTestCheck = document.createElement('input');
  depthTestCheck.type = 'checkbox';
  depthTestCheck.checked = labelObj.disableDepthTestDistance === Number.POSITIVE_INFINITY;
  depthTestCheck.style.cursor = 'pointer';

  const depthTestLabel = document.createElement('span');
  depthTestLabel.textContent = t('alwaysOnTop', lang) || 'Always On Top';
  depthTestLabel.style.fontSize = '12px';
  depthTestLabel.style.color = '#ccc';

  depthTestCheck.addEventListener('change', (e) => {
    labelObj.setDisableDepthTestDistance(e.target.checked);
  });

  depthTestContainer.appendChild(depthTestCheck);
  depthTestContainer.appendChild(depthTestLabel);
  depthTestRow.appendChild(depthTestContainer);
  container.appendChild(depthTestRow);

  // Display Height Range
  const displayHeightRow = createControlRow(t('displayHeight', lang));
  displayHeightRow.style.display = 'block';

  const displayHeightContainer = document.createElement('div');
  displayHeightContainer.style.display = 'flex';
  displayHeightContainer.style.gap = '8px';
  displayHeightContainer.style.width = '100%';
  displayHeightContainer.style.marginTop = '4px';

  const minInput = document.createElement('input');
  minInput.type = 'number';
  styleInput(minInput);
  minInput.placeholder = t('min', lang);
  minInput.value = labelObj.minDisplayHeight;
  minInput.style.flex = '1';

  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  styleInput(maxInput);
  maxInput.placeholder = t('max', lang);
  maxInput.value = labelObj.maxDisplayHeight === Infinity ? '' : labelObj.maxDisplayHeight;
  maxInput.style.flex = '1';

  const updateDisplayHeight = () => {
      const min = parseFloat(minInput.value) || 0;
      const max = maxInput.value === '' ? Infinity : parseFloat(maxInput.value);
      labelObj.setDisplayHeightRange(min, max);
  };
  minInput.oninput = updateDisplayHeight;
  maxInput.oninput = updateDisplayHeight;

  displayHeightContainer.appendChild(minInput);
  displayHeightContainer.appendChild(maxInput);
  displayHeightRow.appendChild(displayHeightContainer);
  container.appendChild(displayHeightRow);

  // Copy Buttons
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;margin-top:20px;';
  
  // 1. Copy Config (JSON Options)
  const copyConfigBtn = createButton(t('copyConfig', lang), () => {
    const config = {
      position: labelObj.position,
      text: labelObj.text,
      fontSize: labelObj.fontSize,
      font: labelObj.font,
      bold: labelObj.bold,
      color: labelObj.color,
      backgroundColor: labelObj.backgroundColor,
      scale: labelObj.scale,
      pixelOffset: labelObj.pixelOffset,
      eyeOffset: labelObj.eyeOffset,
      disableDepthTestDistance: labelObj.disableDepthTestDistance === Number.POSITIVE_INFINITY,
      heightReference: labelObj.heightReference,
      heightOffset: labelObj.heightOffset,
      minDisplayHeight: labelObj.minDisplayHeight,
      maxDisplayHeight: labelObj.maxDisplayHeight
    };
    
    const text = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(text);
    
    const originalText = copyConfigBtn.textContent;
    copyConfigBtn.textContent = t('copied', lang);
    copyConfigBtn.style.background = '#10b981';
    setTimeout(() => {
      copyConfigBtn.textContent = originalText;
      copyConfigBtn.style.background = '#3b82f6';
    }, 2000);
  });

  // 2. Copy Code (Chain)
  const copyCodeBtn = createButton(t('copyChain', lang), () => {
     // Generate code string
     let code = `label.add({\n`;
     code += `  position: [${labelObj.position.join(', ')}],\n`;
     code += `  text: '${labelObj.text}',\n`;
     code += `  color: '${labelObj.color}',\n`;
     if (labelObj.backgroundColor) code += `  backgroundColor: '${labelObj.backgroundColor}',\n`;
     code += `  fontSize: ${labelObj.fontSize},\n`;
     code += `  scale: ${labelObj.scale},\n`;
     code += `  pixelOffset: [${labelObj.pixelOffset.join(', ')}],\n`;
     if (labelObj.eyeOffset && (labelObj.eyeOffset[0] !== 0 || labelObj.eyeOffset[1] !== 0 || labelObj.eyeOffset[2] !== 0)) {
        code += `  eyeOffset: [${labelObj.eyeOffset.join(', ')}],\n`;
     }
     if (labelObj.disableDepthTestDistance === Number.POSITIVE_INFINITY) {
        code += `  disableDepthTestDistance: true,\n`;
     } else {
        code += `  disableDepthTestDistance: false,\n`;
     }
     code += `})`; // End add

     // Chain methods
     if (labelObj.heightReference === 'clampToGround' || labelObj.heightReference === 'relativeToGround') {
         if (labelObj.heightOffset !== 0) {
            code += `.setHeight(${labelObj.heightOffset})`;
         }
     } else {
         // Absolute height
         code += `.setHeight(${labelObj.position[2]})`;
     }

     if (labelObj.minDisplayHeight > 0 || labelObj.maxDisplayHeight < Infinity) {
         code += `.setDisplayHeightRange(${labelObj.minDisplayHeight}, ${labelObj.maxDisplayHeight})`;
     }

     code += `;`;

    navigator.clipboard.writeText(code);
    
    const originalText = copyCodeBtn.textContent;
    copyCodeBtn.textContent = t('copied', lang);
    copyCodeBtn.style.background = '#10b981';
    setTimeout(() => {
      copyCodeBtn.textContent = originalText;
      copyCodeBtn.style.background = 'rgba(255,255,255,0.1)';
    }, 2000);
  }, 'secondary');

  btnRow.appendChild(copyConfigBtn);
  btnRow.appendChild(copyCodeBtn);
  container.appendChild(btnRow);
}
