
import { createControlRow, createButton, styleInput, t } from '../debugger/utils.js';
import flyManager from '../earth/fly.js';

export function renderEarthDebugger(container, target, lang) {
  // 1. Header / Info Box (Match Point style)
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
  container.appendChild(infoBox);

  // Header Row
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  
  // Title Badge
  const titleBadge = document.createElement('div');
  titleBadge.textContent = t('earthControl', lang).toUpperCase();
  titleBadge.style.cssText = `
    padding: 2px 6px;
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  `;
  headerRow.appendChild(titleBadge);
  infoBox.appendChild(headerRow);

  // Description/ID
  const descRow = document.createElement('div');
  if (target && target.position) {
      descRow.textContent = `Target: ${target.position.lng.toFixed(4)}, ${target.position.lat.toFixed(4)}`;
  } else {
      descRow.textContent = 'Global Settings';
  }
  descRow.style.cssText = `
    color: #94a3b8;
    font-size: 11px;
    font-family: monospace;
  `;
  infoBox.appendChild(descRow);


  // 2. FlyTo Controls
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  container.appendChild(wrapper);

  // Inputs
  const inputs = {};
  const posRow = document.createElement('div');
  posRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;';
  
  ['lng', 'lat', 'alt'].forEach(key => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = t(key, lang);
    input.style.width = '120px';
    styleInput(input);
    inputs[key] = input;
    posRow.appendChild(input);
  });
  wrapper.appendChild(posRow);

  const orientRow = document.createElement('div');
  orientRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;';
  ['heading', 'pitch', 'roll'].forEach(key => {
    const input = document.createElement('input');
    input.type = 'number';
    input.placeholder = t(key, lang);
    input.style.width = '120px';
    styleInput(input);
    inputs[key] = input;
    orientRow.appendChild(input);
  });
  wrapper.appendChild(orientRow);

  // Buttons Row 1: Get View & Fly To
  const actionRow = document.createElement('div');
  actionRow.style.display = 'flex';
  actionRow.style.gap = '8px';

  const getBtn = createButton(t('currentView', lang), () => {
    const cam = flyManager.getCurrentCamera();
    if (cam) {
      inputs.lng.value = cam.position.lng.toFixed(6);
      inputs.lat.value = cam.position.lat.toFixed(6);
      inputs.alt.value = cam.position.alt.toFixed(2);
      inputs.heading.value = cam.orientation.heading.toFixed(2);
      inputs.pitch.value = cam.orientation.pitch.toFixed(2);
      inputs.roll.value = cam.orientation.roll.toFixed(2);
    }
  }, 'secondary');

  const goBtn = createButton(t('flyTo', lang), () => {
    flyManager.flyTo({
      lng: parseFloat(inputs.lng.value),
      lat: parseFloat(inputs.lat.value),
      alt: parseFloat(inputs.alt.value)
    }, {
      heading: parseFloat(inputs.heading.value),
      pitch: parseFloat(inputs.pitch.value),
      roll: parseFloat(inputs.roll.value)
    });
  });

  actionRow.appendChild(getBtn);
  actionRow.appendChild(goBtn);
  wrapper.appendChild(actionRow);

  // Buttons Row 2: Copy Config & Chain
  const copyRow = document.createElement('div');
  copyRow.style.display = 'flex';
  copyRow.style.gap = '8px';
  
  const copyBtn = createButton(t('copyConfig', lang), () => {
    const config = {
      position: {
        lng: parseFloat(inputs.lng.value),
        lat: parseFloat(inputs.lat.value),
        alt: parseFloat(inputs.alt.value)
      },
      orientation: {
        heading: parseFloat(inputs.heading.value),
        pitch: parseFloat(inputs.pitch.value),
        roll: parseFloat(inputs.roll.value)
      },
      surfaceOpacity: parseFloat(opacityRange.value)
    };
    
    navigator.clipboard.writeText(JSON.stringify(config, null, 2)).then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = t('copied', lang);
      copyBtn.style.background = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#3b82f6';
      }, 2000);
    });
  });

  const copyChainBtn = createButton(t('copyChain', lang), () => {
    const lng = parseFloat(inputs.lng.value);
    const lat = parseFloat(inputs.lat.value);
    const alt = parseFloat(inputs.alt.value);
    const h = parseFloat(inputs.heading.value);
    const p = parseFloat(inputs.pitch.value);
    const r = parseFloat(inputs.roll.value);

    const code = `CesiumFriendlyPlugin.flyTo({\n` +
                 `  lng: ${lng},\n` +
                 `  lat: ${lat},\n` +
                 `  alt: ${alt}\n` +
                 `}, {\n` +
                 `  heading: ${h},\n` +
                 `  pitch: ${p},\n` +
                 `  roll: ${r}\n` +
                 `}).then(() => {\n` +
                 `  console.log('Flight complete!');\n` +
                 `});`;

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
  
  copyRow.appendChild(copyBtn);
  copyRow.appendChild(copyChainBtn);
  wrapper.appendChild(copyRow);

  // Divider
  wrapper.appendChild(document.createElement('hr')).style.cssText = 'border:0; border-top:1px solid rgba(255,255,255,0.1); width:100%; margin:4px 0;';

  // 3. Function Area
  const funcSection = document.createElement('div');
  
  // Title
  const funcTitle = document.createElement('div');
  funcTitle.textContent = t('functionArea', lang);
  funcTitle.style.cssText = 'font-weight:600; margin-bottom:8px; color:#fff; font-size:12px;';
  funcSection.appendChild(funcTitle);

  // Orbit Earth Button
  const funcRow = document.createElement('div');
  funcRow.style.display = 'flex';
  funcRow.style.gap = '8px';

  const orbitBtn = createButton(t('orbitEarth', lang), () => {
    flyManager.flyAndOrbit({
      lng: parseFloat(inputs.lng.value),
      lat: parseFloat(inputs.lat.value),
      alt: parseFloat(inputs.alt.value)
    }, {
      heading: parseFloat(inputs.heading.value),
      pitch: parseFloat(inputs.pitch.value),
      roll: parseFloat(inputs.roll.value)
    });
  }, 'secondary');
  orbitBtn.style.flex = '1';
  
  const copyOrbitBtn = createButton(t('copyChain', lang), () => {
    const lng = parseFloat(inputs.lng.value);
    const lat = parseFloat(inputs.lat.value);
    const alt = parseFloat(inputs.alt.value);
    const h = parseFloat(inputs.heading.value);
    const p = parseFloat(inputs.pitch.value);
    const r = parseFloat(inputs.roll.value);

    const code = `CesiumFriendlyPlugin.flyAndOrbit({\n` +
                 `  lng: ${lng},\n` +
                 `  lat: ${lat},\n` +
                 `  alt: ${alt}\n` +
                 `}, {\n` +
                 `  heading: ${h},\n` +
                 `  pitch: ${p},\n` +
                 `  roll: ${r}\n` +
                 `}, 1.0, 3).then(() => {\n` +
                 `  console.log('Orbit complete!');\n` +
                 `});`;

    navigator.clipboard.writeText(code).then(() => {
      const originalText = copyOrbitBtn.textContent;
      copyOrbitBtn.textContent = t('copied', lang);
      copyOrbitBtn.style.background = '#10b981';
      setTimeout(() => {
        copyOrbitBtn.textContent = originalText;
        copyOrbitBtn.style.background = 'rgba(255,255,255,0.1)';
      }, 2000);
    });
  }, 'secondary');

  funcRow.appendChild(orbitBtn);
  funcRow.appendChild(copyOrbitBtn);
  funcSection.appendChild(funcRow);
  wrapper.appendChild(funcSection);

  // Divider 2
  wrapper.appendChild(document.createElement('hr')).style.cssText = 'border:0; border-top:1px solid rgba(255,255,255,0.1); width:100%; margin:4px 0;';

  // 4. Settings Section
  const settingsSection = document.createElement('div');
  
  const opacityRow = createControlRow(t('surfaceTransparency', lang), '100px');
  const opacityRange = document.createElement('input');
  opacityRange.type = 'range';
  opacityRange.min = '0';
  opacityRange.max = '1';
  opacityRange.step = '0.1';
  opacityRange.value = '1';
  opacityRange.style.flex = '1';
  opacityRange.oninput = (e) => flyManager.setSurfaceOpacity(parseFloat(e.target.value));
  opacityRow.appendChild(opacityRange);
  settingsSection.appendChild(opacityRow);
  
  wrapper.appendChild(settingsSection);

  // Init Values
  if (target && target.position) {
      inputs.lng.value = target.position.lng.toFixed(6);
      inputs.lat.value = target.position.lat.toFixed(6);
      inputs.alt.value = "25000000";
      inputs.heading.value = "0";
      inputs.pitch.value = "-90";
      inputs.roll.value = "0";
  }
}
