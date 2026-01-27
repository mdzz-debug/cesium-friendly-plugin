import { createControlRow, colorToHex, getColorAlpha, createButton, styleInput, t } from './utils.js';

export function renderGeometryDebugger(container, entity, lang = 'zh') {
  const pos = entity.position || [0, 0, 0];
  const groupName = entity.group || t('defaultGroup', lang);
  const labelWidth = lang === 'zh' ? '88px' : '120px';
  const inputWidth = '140px';
  const kind = (entity.kind || 'geometry').toLowerCase();
  const modeDim = entity.modeDim || '2d';

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

  const headerRow = document.createElement('div');
  headerRow.style.cssText = `display: flex; align-items: center; justify-content: space-between;`;

  const typeBadge = document.createElement('div');
  typeBadge.textContent = (kind || '').toUpperCase();
  typeBadge.style.cssText = `
    padding: 2px 6px;
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, 0.3);
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

  const idRow = document.createElement('div');
  idRow.textContent = entity.id;
  idRow.title = entity.id;
  idRow.style.cssText = `
    color: #94a3b8;
    font-size: 11px;
    font-family: monospace;
    word-break: break-all;
    line-height: 1.4;
  `;
  infoBox.appendChild(idRow);

  if (pos && pos.length >= 2) {
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

    const alt = pos[2] || 0;
    coordsGrid.appendChild(createCoordItem(t('lng', lang), (pos[0] || 0).toFixed(6)));
    coordsGrid.appendChild(createCoordItem(t('lat', lang), (pos[1] || 0).toFixed(6)));
    coordsGrid.appendChild(createCoordItem(t('alt', lang), alt.toFixed(2)));
    infoBox.appendChild(coordsGrid);
  }
  container.appendChild(infoBox);

  const geoSection = createSection(t('posAndGeo', lang));
  container.appendChild(geoSection);

  const isSphereLike = (kind === 'circle' && modeDim === '3d') || kind === 'ellipsoid';

  if (!isSphereLike) {
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
    clampCheck.checked = entity.heightReference === 'clampToGround';
    clampCheck.style.cursor = 'pointer';

    clampLabel.appendChild(clampCheck);
    clampLabel.appendChild(document.createTextNode(t('clamp', lang)));
    heightContainer.appendChild(clampLabel);

    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.step = '1';
    heightInput.value = entity.heightOffset || 0;
    heightInput.placeholder = t('offset', lang);
    tuneNumberInput(heightInput, '120px');
    styleInput(heightInput);

    clampCheck.addEventListener('change', (e) => {
      if (typeof entity.setClampToGround === 'function') {
        entity.setClampToGround(e.target.checked).update();
      } else {
        entity.heightReference = e.target.checked ? 'clampToGround' : 'none';
        if (e.target.checked) entity.heightOffset = 0;
        if (typeof entity.update === 'function') entity.update();
      }
      if (e.target.checked) {
        heightInput.value = 0;
      }
    });

    heightInput.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        if (typeof entity.setHeight === 'function') {
          entity.setHeight(val).update();
        } else {
          entity.heightOffset = val;
          if (typeof entity.update === 'function') entity.update();
        }
      }
    });

    heightContainer.appendChild(heightInput);
    heightRow.appendChild(heightContainer);
    geoSection.appendChild(heightRow);
  }

  if (kind === 'ellipsoid') {
    const radiiRow = tuneRow(createControlRow(t('radius', lang) + ' (X/Y/Z)', labelWidth));
    const radiiContainer = document.createElement('div');
    tuneControl(radiiContainer);
    radiiContainer.style.gap = '4px';

    const createRadiusInput = (val, onChange) => {
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.value = val;
      inp.style.width = '32%';
      styleInput(inp);
      inp.addEventListener('input', onChange);
      return inp;
    };

    const rx = createRadiusInput(entity.radiiX || entity.radiusValue || 1000, (e) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        entity.radiiX = v;
        if (typeof entity.update === 'function') entity.update();
      }
    });
    const ry = createRadiusInput(entity.radiiY || entity.radiusValue || 1000, (e) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        entity.radiiY = v;
        if (typeof entity.update === 'function') entity.update();
      }
    });
    const rz = createRadiusInput(entity.radiiZ || entity.radiusValue || 1000, (e) => {
      const v = parseFloat(e.target.value);
      if (!isNaN(v)) {
        entity.radiiZ = v;
        if (typeof entity.update === 'function') entity.update();
      }
    });

    radiiContainer.appendChild(rx);
    radiiContainer.appendChild(ry);
    radiiContainer.appendChild(rz);
    radiiRow.appendChild(radiiContainer);
    geoSection.appendChild(radiiRow);
  } else if (kind === 'ellipse') {
    const radiusRow = tuneRow(createControlRow(t('radius', lang), labelWidth));
    const majorInput = document.createElement('input');
    const minorInput = document.createElement('input');
    majorInput.type = 'number';
    minorInput.type = 'number';
    const major = entity.semiMajorAxis || entity.radiusValue || 1000;
    const minor = entity.semiMinorAxis || entity.semiMajorAxis || major;
    majorInput.value = major;
    minorInput.value = minor;
    tuneNumberInput(majorInput, '100px');
    tuneNumberInput(minorInput, '100px');
    styleInput(majorInput);
    styleInput(minorInput);

    const applySemiAxes = () => {
      const a = parseFloat(majorInput.value);
      const b = parseFloat(minorInput.value);
      if (isNaN(a) || isNaN(b)) return;
      if (typeof entity.semiAxes === 'function') {
        entity.semiAxes(a, b);
      } else {
        entity.semiMajorAxis = a;
        entity.semiMinorAxis = b;
      }
      if (typeof entity.update === 'function') entity.update();
    };

    majorInput.addEventListener('input', applySemiAxes);
    minorInput.addEventListener('input', applySemiAxes);

    const containerSemi = document.createElement('div');
    tuneControl(containerSemi);
    containerSemi.appendChild(majorInput);
    containerSemi.appendChild(minorInput);
    radiusRow.appendChild(containerSemi);
    geoSection.appendChild(radiusRow);
  } else if (kind === 'circle') {
    const radiusRow = tuneRow(createControlRow(t('radius', lang), labelWidth));
    const radiusInput = document.createElement('input');
    radiusInput.type = 'number';
    radiusInput.value = entity.radiusValue || entity.semiMajorAxis || 1000;
    tuneNumberInput(radiusInput);
    styleInput(radiusInput);
    radiusInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (typeof entity.radius === 'function') {
        entity.radius(v);
      } else {
        entity.radiusValue = v;
      }
      if (typeof entity.update === 'function') entity.update();
    });
    radiusRow.appendChild(radiusInput);
    geoSection.appendChild(radiusRow);
  } else if (kind === 'cylinder' || kind === 'cone') {
    const lengthRow = tuneRow(createControlRow(t('height', lang), labelWidth));
    const lengthInput = document.createElement('input');
    lengthInput.type = 'number';
    lengthInput.value = entity.lengthValue || 1000;
    tuneNumberInput(lengthInput);
    styleInput(lengthInput);
    lengthInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (typeof entity.length === 'function') {
        entity.length(v);
      } else {
        entity.lengthValue = v;
      }
      if (typeof entity.update === 'function') entity.update();
    });
    lengthRow.appendChild(lengthInput);
    geoSection.appendChild(lengthRow);

    const bottomRow = tuneRow(createControlRow(t('bottomRadius', lang), labelWidth));
    const bottomInput = document.createElement('input');
    bottomInput.type = 'number';
    bottomInput.value = entity.bottomRadiusValue || entity.radiusValue || 1000;
    tuneNumberInput(bottomInput);
    styleInput(bottomInput);
    bottomInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (typeof entity.bottomRadius === 'function') {
        entity.bottomRadius(v);
      } else {
        entity.bottomRadiusValue = v;
      }
      if (typeof entity.update === 'function') entity.update();
    });
    bottomRow.appendChild(bottomInput);
    geoSection.appendChild(bottomRow);

    const topRow = tuneRow(createControlRow(t('topRadius', lang), labelWidth));
    const topInput = document.createElement('input');
    topInput.type = 'number';
    topInput.value = entity.topRadiusValue != null ? entity.topRadiusValue : bottomInput.value;
    tuneNumberInput(topInput);
    styleInput(topInput);
    topInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (typeof entity.topRadius === 'function') {
        entity.topRadius(v);
      } else {
        entity.topRadiusValue = v;
      }
      if (typeof entity.update === 'function') entity.update();
    });
    topRow.appendChild(topInput);
    geoSection.appendChild(topRow);
  }

  if (['circle', 'ellipse', 'polygon', 'rectangle', 'corridor'].includes(kind) && !isSphereLike) {
    const extRow = tuneRow(createControlRow(t('extrudedHeight', lang), labelWidth));
    const extInput = document.createElement('input');
    extInput.type = 'number';
    extInput.value = entity.extrudedHeight || 0;
    tuneNumberInput(extInput);
    styleInput(extInput);
    extInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      
      // Auto-set extrudedHeightReference if using ground clamping
      if (entity.heightReference === 'clampToGround' || entity.heightReference === 'relativeToGround') {
         entity.extrudedHeightReference = 'relativeToGround';
      }

      if (typeof entity.extrude === 'function') {
        entity.extrude(v);
      } else {
        entity.extrudedHeight = v;
      }
      if (typeof entity.update === 'function') entity.update();
    });
    extRow.appendChild(extInput);
    geoSection.appendChild(extRow);
  }

  if (kind === 'polyline' || kind === 'corridor') {
    const widthRow = tuneRow(createControlRow(t('width', lang), labelWidth));
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    const initialWidth = kind === 'polyline' ? (entity.polylineWidth || 1) : (entity.corridorWidth || 1);
    widthInput.value = initialWidth;
    tuneNumberInput(widthInput);
    styleInput(widthInput);
    widthInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (isNaN(v)) return;
      if (kind === 'polyline') {
        if (typeof entity.width === 'function') {
          entity.width(v);
        } else {
          entity.polylineWidth = v;
        }
      } else if (kind === 'corridor') {
        if (typeof entity.corridorWidthSet === 'function') {
          entity.corridorWidthSet(v);
        } else {
          entity.corridorWidth = v;
        }
      }
      if (typeof entity.update === 'function') entity.update();
    });
    widthRow.appendChild(widthInput);
    geoSection.appendChild(widthRow);
  }

  const rotRow = tuneRow(createControlRow(t('rotation', lang), labelWidth));
  const rotInput = document.createElement('input');
  rotInput.type = 'number';
  rotInput.value = (entity.rotationAngle || 0) * 180 / Math.PI;
  tuneNumberInput(rotInput);
  styleInput(rotInput);
  rotInput.addEventListener('input', (e) => {
    const deg = parseFloat(e.target.value);
    if (isNaN(deg)) return;
    if (typeof entity.rotationDeg === 'function') {
      entity.rotationDeg(deg, entity.rotationAxis || 'Z');
    } else {
      entity.rotationAngle = deg * Math.PI / 180;
      if (typeof entity.update === 'function') entity.update();
    }
  });
  rotRow.appendChild(rotInput);
  geoSection.appendChild(rotRow);

  const styleSection = createSection(t('style', lang));
  container.appendChild(styleSection);

  const fillRow = tuneRow(createControlRow(t('fill', lang), labelWidth));
  const fillCheck = document.createElement('input');
  fillCheck.type = 'checkbox';
  fillCheck.checked = entity.fill !== false;
  fillCheck.style.cursor = 'pointer';
  fillCheck.addEventListener('change', (e) => {
    entity.fill = e.target.checked;
    if (typeof entity.update === 'function') entity.update();
  });
  fillRow.appendChild(fillCheck);
  styleSection.appendChild(fillRow);

  const colorRow = tuneRow(createControlRow(t('color', lang), labelWidth));
  const colorContainer = document.createElement('div');
  tuneControl(colorContainer);

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  let defaultColor = '#3b82f6';
  if (typeof entity._material === 'string') {
    defaultColor = colorToHex(entity._material);
  }
  colorInput.value = defaultColor;
  colorInput.style.cursor = 'pointer';
  colorInput.style.width = '40px';
  colorInput.style.height = '24px';
  colorInput.style.border = 'none';
  colorInput.style.padding = '0';
  colorInput.style.background = 'transparent';

  const opacityInput = document.createElement('input');
  opacityInput.type = 'range';
  opacityInput.min = '0';
  opacityInput.max = '1';
  opacityInput.step = '0.1';
  
  let initialOpacity = 1;
  if (entity.materialOpacity !== undefined) {
    initialOpacity = entity.materialOpacity;
  } else {
    initialOpacity = getColorAlpha(entity._material);
  }
  opacityInput.value = initialOpacity;
  
  opacityInput.style.width = '80px';
  opacityInput.style.cursor = 'pointer';

  const applyColor = () => {
    if (typeof entity.material === 'function') {
      entity.material(colorInput.value);
    } else {
      entity._material = colorInput.value;
    }
    const alpha = parseFloat(opacityInput.value);
    if (!isNaN(alpha)) {
      if (typeof entity.setOpacity === 'function') {
        entity.setOpacity(alpha);
      } else {
        entity.materialOpacity = alpha;
      }
    }
    if (typeof entity.update === 'function') entity.update();
  };

  colorInput.addEventListener('input', applyColor);
  opacityInput.addEventListener('input', applyColor);

  colorContainer.appendChild(colorInput);
  colorContainer.appendChild(opacityInput);
  colorRow.appendChild(colorContainer);
  styleSection.appendChild(colorRow);

  if (kind !== 'polyline' && kind !== 'polylinevolume' && kind !== 'polylineVolume') {
    const outlineRow = tuneRow(createControlRow(t('outline', lang), labelWidth));
    const outlineContainer = document.createElement('div');
    tuneControl(outlineContainer);

    const outlineCheck = document.createElement('input');
    outlineCheck.type = 'checkbox';
    outlineCheck.checked = !!entity._outlineEnabled;
    outlineCheck.style.cursor = 'pointer';

    const outlineColorInput = document.createElement('input');
    outlineColorInput.type = 'color';
    outlineColorInput.value = colorToHex(entity._outlineColor || '#FFFFFF');
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
    outlineWidthInput.value = entity._outlineWidth || 1;
    outlineWidthInput.style.width = '50px';
    styleInput(outlineWidthInput);

    const applyOutline = () => {
      const enabled = outlineCheck.checked;
      const color = outlineColorInput.value;
      const width = parseInt(outlineWidthInput.value, 10) || 1;
      if (typeof entity.outline === 'function') {
        entity.outline(enabled, color, width);
      } else {
        entity._outlineEnabled = enabled;
        entity._outlineColor = color;
        entity._outlineWidth = width;
      }
      if (typeof entity.update === 'function') entity.update();
    };

    outlineCheck.addEventListener('change', applyOutline);
    outlineColorInput.addEventListener('input', applyOutline);
    outlineWidthInput.addEventListener('input', applyOutline);

    outlineContainer.appendChild(outlineCheck);
    outlineContainer.appendChild(outlineColorInput);
    outlineContainer.appendChild(outlineWidthInput);
    outlineRow.appendChild(outlineContainer);
    styleSection.appendChild(outlineRow);
  }

  const copySection = createSection(t('functionArea', lang));
  container.appendChild(copySection);

  const copyBtn = createButton(t('copyChain', lang), () => {
    let code = `const entity = cesium.geometry('${entity.id}')\n`;
    code += `  .shape('${kind}')\n`;
    if (pos && pos.length >= 2) {
      code += `  .position([${(pos[0] || 0).toFixed(6)}, ${(pos[1] || 0).toFixed(6)}, ${pos[2] || 0}])\n`;
    }

    if (kind === 'ellipsoid') {
      if (entity.radiiX !== undefined) {
        code += `  .radii(${entity.radiiX}, ${entity.radiiY}, ${entity.radiiZ})\n`;
      }
    } else if (kind === 'circle') {
      if (entity.radiusValue) {
        code += `  .radius(${entity.radiusValue})\n`;
      }
    } else if (kind === 'ellipse') {
      if (entity.semiMajorAxis) {
        code += `  .semiAxes(${entity.semiMajorAxis}, ${entity.semiMinorAxis})\n`;
      }
    } else if (kind === 'cylinder' || kind === 'cone') {
      if (entity.lengthValue) {
        code += `  .length(${entity.lengthValue})\n`;
      }
      if (entity.bottomRadiusValue !== undefined) {
        code += `  .bottomRadius(${entity.bottomRadiusValue})\n`;
      }
      if (entity.topRadiusValue !== undefined) {
        code += `  .topRadius(${entity.topRadiusValue})\n`;
      }
    }

    if (entity.extrudedHeight) {
      code += `  .extrude(${entity.extrudedHeight})\n`;
    }

    if (!isSphereLike && typeof entity.heightOffset === 'number' && entity.heightOffset !== 0) {
      code += `  .setHeight(${entity.heightOffset})\n`;
    }

    if (entity.rotationAngle) {
      const deg = (entity.rotationAngle * 180 / Math.PI).toFixed(2);
      code += `  .rotationDeg(${deg})\n`;
    }

    if (entity.fill === false) {
      code += `  .fill(false)\n`;
    }

    if (entity._material) {
      code += `  .material('${entity._material}')\n`;
    }

    if (entity.materialOpacity !== undefined && entity.materialOpacity !== 1) {
      code += `  .setOpacity(${entity.materialOpacity})\n`;
    }

    if (entity._outlineEnabled) {
      code += `  .outline(true, '${entity._outlineColor}', ${entity._outlineWidth})\n`;
    }

    code += `  .add();`;

    navigator.clipboard.writeText(code).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = t('copied', lang);
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    });
  });

  copySection.appendChild(copyBtn);
}
