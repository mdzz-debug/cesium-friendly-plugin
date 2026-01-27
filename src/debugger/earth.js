
import { createControlRow, createButton, styleInput, t } from '../debugger/utils.js';
import flyManager from '../earth/fly.js';
import pluginInstance from '../core/instance.js';

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
  
  // --- New Additions: Add Entities (Point, 2D Geo, 3D Geo) ---
  
  // Helper to create a collapsible section or just a row
  const createSectionTitle = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    div.style.cssText = 'font-weight:600; margin:12px 0 8px 0; color:#fff; font-size:12px;';
    return div;
  };

  // 1. Point
  funcSection.appendChild(createSectionTitle(t('addPoint', lang)));
  const pointRow = document.createElement('div');
  pointRow.style.display = 'flex';
  pointRow.style.gap = '8px';
  
  const addPointBtn = createButton(t('addPoint', lang), () => {
    const lng = parseFloat(inputs.lng.value);
    const lat = parseFloat(inputs.lat.value);
    const alt = parseFloat(inputs.alt.value) || 0; // Use current input alt
    
    console.log('[Debugger] Add Point Clicked', { lng, lat, alt, pluginInstance });

    if (isNaN(lng) || isNaN(lat)) {
        alert('Invalid coordinates. Please enter Longitude and Latitude.');
        return;
    }

    // Check if pluginInstance is available
    if (pluginInstance) {
        if (typeof pluginInstance.point !== 'function') {
             console.error('[Debugger] pluginInstance.point is not a function!', pluginInstance);
             alert('Error: pluginInstance.point is missing');
             return;
        }
        try {
            const entity = pluginInstance.point({
                position: [lng, lat, alt],
                color: '#ef4444',
                pixelSize: 20,
                heightReference: 'none'
            });
            console.log('[Debugger] Created entity:', entity);
            entity.add();
            console.log('[Debugger] Entity added');
            
            // Auto fly to the point
            if (entity) {
                flyManager.flyTo(entity, { 
                    duration: 1.5,
                    pitch: -45,
                    range: 10000
                });
            }
        } catch (e) {
            console.error('[Debugger] Error adding point:', e);
            alert('Error adding point: ' + e.message);
        }
    } else {
        console.warn('pluginInstance not found');
        alert('pluginInstance not found');
    }
  }, 'secondary');
  pointRow.appendChild(addPointBtn);
  funcSection.appendChild(pointRow);

  // 2. 2D Geometry
  funcSection.appendChild(createSectionTitle(t('add2DGeo', lang)));
  const geo2dRow = document.createElement('div');
  geo2dRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;';
  
  ['circle', 'ellipse', 'rectangle', 'polygon'].forEach(type => {
      const btn = createButton(t(type, lang), () => {
          const lng = parseFloat(inputs.lng.value);
          const lat = parseFloat(inputs.lat.value);
          const Cesium = pluginInstance.cesium || flyManager.cesium || window.Cesium;
          
          if (!pluginInstance) {
              alert('pluginInstance not found');
              return;
          }
          if (!Cesium) {
              alert('Cesium core not found (pluginInstance.cesium is undefined)');
              return;
          }

          console.log(`[Debugger] Add ${type} clicked`, { lng, lat });
          
          try {
              let entity;
              if (type === 'circle') {
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                  .shape('circle')
                  .radius(100000)
                  .material('rgba(59, 130, 246, 0.5)')
                  .outline(true, '#2563eb', 2)
                  .add();
              } else if (type === 'ellipse') {
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                  .shape('circle')
                  .radius(100000, 50000)
                  .material('rgba(59, 130, 246, 0.5)')
                  .outline(true, '#2563eb', 2)
                  .add();
              } else if (type === 'rectangle') {
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                  .shape('rectangle')
                  .rectangleCoordinatesSet(Cesium.Rectangle.fromDegrees(lng - 1, lat - 1, lng + 1, lat + 1))
                  .material('rgba(16, 185, 129, 0.5)')
                  .outline(true, '#059669', 2)
                  .add();
              } else if (type === 'polygon') {
                   entity = pluginInstance.geometry({
                       position: [lng, lat, 0]
                   })
                   .shape('polygon')
                   .polygonHierarchy(Cesium.Cartesian3.fromDegreesArray([
                       lng - 1, lat - 1,
                       lng + 1, lat - 1,
                       lng, lat + 1
                   ]))
                   .material('rgba(245, 158, 11, 0.5)')
                   .outline(true, '#d97706', 2)
                   .add();
              }
              console.log(`[Debugger] ${type} added`, entity);
              
              // Auto fly to view the 2D shape
              if (entity) {
                  flyManager.flyTo(entity, { 
                      duration: 1.5,
                      pitch: -90,
                      range: 500000
                  });
              }
          } catch (e) {
              console.error(`[Debugger] Error adding ${type}:`, e);
              alert(`Error adding ${type}: ` + e.message);
          }
      }, 'secondary');
      geo2dRow.appendChild(btn);
  });
  funcSection.appendChild(geo2dRow);

  // 2.1 Lines & Walls (New Section)
  funcSection.appendChild(createSectionTitle(t('addLinesAndWalls', lang) || 'Lines & Walls'));
  const linesRow = document.createElement('div');
  linesRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 8px;';
  
  ['polyline', 'corridor', 'wall'].forEach(type => {
      const btn = createButton(t(type, lang), () => {
          const lng = parseFloat(inputs.lng.value);
          const lat = parseFloat(inputs.lat.value);
          const Cesium = pluginInstance.cesium || flyManager.cesium || window.Cesium;
          
          if (!Cesium) {
              alert('Cesium core not found');
              return;
          }

          try {
              let entity;
              // Sample positions: a generic L-shape or zigzag
              const positions = Cesium.Cartesian3.fromDegreesArray([
                  lng - 0.5, lat - 0.5,
                  lng + 0.5, lat - 0.5,
                  lng + 0.5, lat + 0.5
              ]);

              if (type === 'polyline') {
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                      .shape('polyline')
                      .polylinePositions(positions)
                      .material('rgba(255, 255, 0, 0.8)')
                      .width(5) // polylineWidth
                      .add();
              } else if (type === 'corridor') {
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                      .shape('corridor')
                      .corridorPositions(positions)
                      .corridorWidthSet(50000)
                      .material('rgba(139, 92, 246, 0.6)')
                      .outline(true, '#7c3aed', 2)
                      .add();
              } else if (type === 'wall') {
                   // Wall needs [lng, lat, alt, ...] flat array or objects?
                   // SmartGeometryEntity.js logic for wallPositionsData:
                   // It accepts array of arrays [[lng, lat, alt], ...]
                   const wallPos = [
                       [lng - 0.5, lat - 0.5, 50000],
                       [lng + 0.5, lat - 0.5, 80000],
                       [lng + 0.5, lat + 0.5, 40000]
                   ];
                   entity = pluginInstance.geometry({
                       position: [lng, lat, 0]
                   })
                       .shape('wall')
                       .wallPositions(wallPos)
                       .material('rgba(16, 185, 129, 0.6)')
                       .outline(true, '#059669', 2)
                       .add();
              }

              if (entity) {
                  flyManager.flyTo(entity, { 
                      duration: 1.5,
                      pitch: -45,
                      range: 600000
                  });
              }
          } catch (e) {
              console.error(`[Debugger] Error adding ${type}:`, e);
              alert(`Error adding ${type}: ` + e.message);
          }
      }, 'secondary');
      linesRow.appendChild(btn);
  });
  funcSection.appendChild(linesRow);

  // 3. 3D Geometry
  funcSection.appendChild(createSectionTitle(t('add3DGeo', lang)));
  const geo3dRow = document.createElement('div');
  geo3dRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;';
  
  ['box', 'sphere', 'cylinder', 'cone', 'ellipsoid', 'polylineVolume'].forEach(type => {
      const btn = createButton(t(type, lang) || (type.charAt(0).toUpperCase() + type.slice(1)), () => {
          const lng = parseFloat(inputs.lng.value);
          const lat = parseFloat(inputs.lat.value);
          const alt = parseFloat(inputs.alt.value) || 0;
          const Cesium = pluginInstance.cesium || flyManager.cesium || window.Cesium;
          
          if (!Cesium) {
              alert('Cesium core not found');
              return;
          }
          
          if (!pluginInstance) {
              alert('pluginInstance not found');
              return;
          }

          console.log(`[Debugger] Add ${type} clicked`, { lng, lat, alt });
          
          try {
              let entity;
              const pos = [lng, lat, alt + 50000]; // Raise default altitude slightly for visibility

              if (type === 'box') {
                  entity = pluginInstance.geometry({ position: pos })
                  .shape('box')
                  .dimensions(100000, 100000, 100000)
                  .material('rgba(239, 68, 68, 0.8)')
                  .add();
              } else if (type === 'sphere') {
                  entity = pluginInstance.geometry({ position: pos })
                  .shape('circle').mode('3d')
                  .radius(50000) // Sphere radius
                  .material('rgba(59, 130, 246, 0.8)')
                  .add();
              } else if (type === 'cylinder') {
                  entity = pluginInstance.geometry({ position: pos })
                  .shape('cylinder')
                  .length(100000)
                  .topRadius(50000)
                  .bottomRadius(50000)
                  .material('rgba(16, 185, 129, 0.8)')
                  .add();
              } else if (type === 'cone') {
                  entity = pluginInstance.geometry({ position: pos })
                  .shape('cone') // or cylinder
                  .length(100000)
                  .bottomRadius(50000)
                  .topRadius(0) // Cone
                  .material('rgba(245, 158, 11, 0.8)')
                  .add();
              } else if (type === 'ellipsoid') {
                  entity = pluginInstance.geometry({ position: pos })
            .shape('circle').mode('3d')
            .radius(100000, 50000)
            .material('rgba(147, 51, 234, 0.8)')
            .add();
              } else if (type === 'polylineVolume') {
                  // Sample positions for volume
                  const positions = Cesium.Cartesian3.fromDegreesArray([
                      lng - 0.5, lat - 0.5,
                      lng + 0.5, lat - 0.5,
                      lng + 0.5, lat + 0.5
                  ]);
                  
                  // Circle shape for volume
                  const computeCircle = (radius) => {
                      const positions = [];
                      for (let i = 0; i < 360; i += 10) {
                          const radians = Cesium.Math.toRadians(i);
                          positions.push(new Cesium.Cartesian2(
                              radius * Math.cos(radians),
                              radius * Math.sin(radians)
                          ));
                      }
                      return positions;
                  };
                  
                  entity = pluginInstance.geometry({
                      position: [lng, lat, 0]
                  })
                      .shape('polylineVolume')
                      .polylinePositions(positions)
                      .volumeShape(computeCircle(30000))
                      .material('rgba(236, 72, 153, 0.6)')
                      .add();
              }
              console.log(`[Debugger] ${type} added`, entity);
              
              // Auto fly to view the 3D object
              if (entity) {
                  flyManager.flyTo(entity, { 
                      duration: 1.5,
                      pitch: -45,
                      range: 300000
                  });
              }
          } catch (e) {
              console.error(`[Debugger] Error adding ${type}:`, e);
              alert(`Error adding ${type}: ` + e.message);
          }
      }, 'secondary');
      geo3dRow.appendChild(btn);
  });
  funcSection.appendChild(geo3dRow);

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
  opacityRange.oninput = (e) => flyManager.setSurfaceOpacity(parseFloat(e.target.value)).update();
  opacityRow.appendChild(opacityRange);
  settingsSection.appendChild(opacityRow);
  
  wrapper.appendChild(settingsSection);

  // Init Values
  if (target && target.position) {
      inputs.lng.value = target.position.lng.toFixed(6);
      inputs.lat.value = target.position.lat.toFixed(6);
      // Use clicked altitude (default to 0 if missing), do not force 25000km
      inputs.alt.value = target.position.alt ? target.position.alt.toFixed(2) : "0";
      
      inputs.heading.value = "0";
      inputs.pitch.value = "-90";
      inputs.roll.value = "0";
  }
}
