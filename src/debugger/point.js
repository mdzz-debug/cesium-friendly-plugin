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
  heightInput.style.width = '60px';
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
  sizeInput.style.width = '80px';
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
  opacityInput.style.width = '120px';
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
  outlineCheck.checked = point.entity && point.entity.point && point.entity.point.outlineWidth > 0;
  outlineCheck.style.cursor = 'pointer';

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  
  // Safe color access
  let defaultOutline = '#000000';
  if (point.entity && point.entity.point && point.entity.point.outlineColor) {
      const col = point.entity.point.outlineColor.getValue ? point.entity.point.outlineColor.getValue(new Date()) : point.entity.point.outlineColor;
      if (col && col.toCssColorString) {
          defaultOutline = col.toCssColorString();
      }
  }
  outlineColorInput.value = colorToHex(defaultOutline);
  
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
  outlineWidthInput.value = (point.entity && point.entity.point && point.entity.point.outlineWidth) || 2;
  outlineWidthInput.style.width = '50px';
  styleInput(outlineWidthInput);

  // Events
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

  // Flash Control
  const flashRow = createControlRow(t('flash', lang));
  const flashContainer = document.createElement('div');
  flashContainer.style.display = 'flex';
  flashContainer.style.gap = '8px';
  flashContainer.style.alignItems = 'center';

  const flashCheck = document.createElement('input');
  flashCheck.type = 'checkbox';
  flashCheck.checked = point._flashing;
  flashCheck.style.cursor = 'pointer';

  // Flash Duration Input
  const flashDurationInput = document.createElement('input');
  flashDurationInput.type = 'number';
  flashDurationInput.min = '100';
  flashDurationInput.step = '100';
  flashDurationInput.placeholder = t('ms', lang);
  flashDurationInput.value = 1000;
  flashDurationInput.style.width = '70px';
  styleInput(flashDurationInput);

  const updateFlash = () => {
    point.setFlash(flashCheck.checked, parseInt(flashDurationInput.value));
  };

  flashCheck.addEventListener('change', updateFlash);
  flashDurationInput.addEventListener('change', updateFlash); // update on blur/enter

  flashContainer.appendChild(flashCheck);
  flashContainer.appendChild(flashDurationInput);
  flashRow.appendChild(flashContainer);
  container.appendChild(flashRow);

  // Copy Config Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '10px';
  btnRow.style.marginTop = '20px';

  const copyConfigBtn = createButton(t('copyConfig', lang), () => {
    const config = {
      type: 'point',
      group: point.group,
      position: point.position,
      heightReference: point.heightReference,
      heightOffset: point.heightOffset,
      color: point.color,
      pixelSize: point.pixelSize,
      opacity: point.opacity,
      outline: {
        show: outlineCheck.checked,
        color: outlineColorInput.value,
        width: parseInt(outlineWidthInput.value)
      },
      flash: {
        enabled: flashCheck.checked,
        duration: parseInt(flashDurationInput.value)
      }
    };
    navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      .then(() => {
        const originalText = copyConfigBtn.textContent;
        copyConfigBtn.textContent = t('copied', lang);
        copyConfigBtn.style.background = '#10b981';
        setTimeout(() => {
          copyConfigBtn.textContent = originalText;
          copyConfigBtn.style.background = '#3b82f6';
        }, 2000);
      });
  });

  const copyChainBtn = createButton(t('copyChain', lang), () => {
    let chain = `pointsManager.add({\n` +
      `  position: [${point.position.join(', ')}],\n` +
      `  color: '${point.color}',\n` +
      `  pixelSize: ${point.pixelSize},\n` +
      `  opacity: ${point.opacity}\n` +
      `})`;
    
    if (point.heightReference === 'clampToGround') {
      chain += `.setClampToGround(true)`;
    }
    if (point.heightOffset !== 0) {
      chain += `.setHeight(${point.heightOffset})`;
    }

    if (outlineCheck.checked) {
      chain += `.setOutline(true, '${outlineColorInput.value}', ${outlineWidthInput.value})`;
    }
    if (flashCheck.checked) {
      chain += `.setFlash(true, ${flashDurationInput.value})`;
    }
    chain += ';';
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

  btnRow.appendChild(copyConfigBtn);
  btnRow.appendChild(copyChainBtn);
  container.appendChild(btnRow);
}
