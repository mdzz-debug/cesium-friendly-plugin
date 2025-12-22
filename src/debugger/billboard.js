import { createControlRow, colorToHex, createButton, styleInput, t } from './utils.js';

export function renderBillboardDebugger(container, point, lang = 'zh') {
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

  // Color (Tint)
  const colorRow = createControlRow(t('tintColor', lang));
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

  // Rotation
  const rotationRow = createControlRow(`${t('rotation', lang)} (${t('deg', lang)})`);
  const rotationContainer = document.createElement('div');
  rotationContainer.style.display = 'flex';
  rotationContainer.style.alignItems = 'center';
  rotationContainer.style.gap = '8px';

  const rotationInput = document.createElement('input');
  rotationInput.type = 'range';
  rotationInput.min = '0';
  rotationInput.max = '360';
  rotationInput.step = '1';
  rotationInput.value = point.rotation || 0;
  rotationInput.style.width = '120px';
  rotationInput.style.cursor = 'pointer';

  const rotationValue = document.createElement('span');
  rotationValue.textContent = `${point.rotation || 0}°`;
  rotationValue.style.fontSize = '12px';
  rotationValue.style.color = '#ccc';
  rotationValue.style.minWidth = '30px';
  rotationValue.style.textAlign = 'right';

  rotationInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    point.setRotation(val);
    rotationValue.textContent = `${val}°`;
  });

  rotationContainer.appendChild(rotationInput);
  rotationContainer.appendChild(rotationValue);
  rotationRow.appendChild(rotationContainer);
  container.appendChild(rotationRow);

  // Scale
  const scaleRow = createControlRow(t('scale', lang));
  const scaleInput = document.createElement('input');
  scaleInput.type = 'number';
  scaleInput.min = '0.1';
  scaleInput.max = '10.0';
  scaleInput.step = '0.1';
  scaleInput.value = point.scale || 1.0;
  scaleInput.style.width = '80px';
  styleInput(scaleInput);
  scaleInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      point.setScale(val);
    }
  });
  scaleRow.appendChild(scaleInput);
  container.appendChild(scaleRow);

  // Copy Config Buttons
  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '10px';
  btnRow.style.marginTop = '20px';

  const copyConfigBtn = createButton(t('copyConfig', lang), () => {
    const config = {
      type: 'billboard',
      group: point.group,
      position: point.position,
      heightReference: point.heightReference,
      heightOffset: point.heightOffset,
      color: point.color,
      opacity: point.opacity,
      rotation: point.rotation,
      scale: point.scale,
      imageUrl: point.imageUrl,
      pixelSize: point.pixelSize
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
    let chain = `pointsManager.add({\\n` +
      `  type: 'billboard',\\n` +
      `  group: '${point.group || ''}',\\n` +
      `  position: [${point.position.join(', ')}],\\n` +
      `  color: '${point.color}',\\n` +
      `  opacity: ${point.opacity},\\n` +
      `  scale: ${point.scale || 1.0},\\n` +
      `  rotation: ${point.rotation || 0},\\n` +
      `  imageUrl: '${point.imageUrl || ''}'\\n` +
      `})`;

    if (point.heightReference === 'clampToGround') {
      chain += `.setClampToGround(true)`;
    }
    if (point.heightOffset !== 0) {
      chain += `.setHeight(${point.heightOffset})`;
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
