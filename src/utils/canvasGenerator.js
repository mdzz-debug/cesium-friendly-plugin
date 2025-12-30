
/**
 * Helper to measure text size
 */
function measureText(ctx, text, font) {
  ctx.font = font;
  return ctx.measureText(text);
}

/**
 * Load image from URL
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/**
 * Calculate bounding box for a set of entities
 */
async function calculateBounds(entities) {
  // Initialize with a small box around 0,0
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  
  // Temporary canvas for measuring text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  for (const entity of entities) {
    const ox = (entity.pixelOffset ? entity.pixelOffset[0] : 0);
    const oy = (entity.pixelOffset ? entity.pixelOffset[1] : 0);
    
    let w = 0, h = 0;
    // Default origins
    let hOrigin = entity.horizontalOrigin || 'CENTER'; // LEFT, CENTER, RIGHT
    let vOrigin = entity.verticalOrigin || 'CENTER';   // TOP, CENTER, BOTTOM, BASELINE

    if (entity.type === 'point') {
        const size = (entity.pixelSize || 10);
        const outline = (entity.outline ? (entity.outlineWidth || 0) : 0);
        w = size + outline;
        h = size + outline;
        // Points are always centered
        hOrigin = 'CENTER';
        vOrigin = 'CENTER';
    } else if (entity.type === 'label') {
        const font = entity.font || '14px sans-serif';
        const metrics = measureText(ctx, entity.text || '', font);
        w = metrics.width;
        // Approximation for height since measureText height support varies
        h = parseInt(font) || 14; 
        
        // Handle background padding if needed
        if (entity.showBackground) {
            w += 10;
            h += 4;
        }
    } else if (entity.type === 'billboard') {
        // We need to know image size... this is tricky without loading.
        // We might have width/height set explicitly.
        if (entity.width && entity.height) {
            w = entity.width;
            h = entity.height;
        } else if (entity.imageUrl) {
            // Best effort or pre-load
            try {
                const img = await loadImage(entity.imageUrl);
                w = entity.width || img.width;
                h = entity.height || img.height;
                // Store loaded image for reuse
                entity._loadedImage = img;
            } catch (e) {
                // console.warn('Failed to measure image', e);
                w = 32; h = 32; // Default fallback
            }
        }
    }

    // Update bounds
    // Calculate top-left corner (dx, dy) relative to anchor point based on origin
    let dx = 0;
    let dy = 0;

    // Horizontal Origin
    if (hOrigin === 'LEFT') {
        dx = 0;
    } else if (hOrigin === 'RIGHT') {
        dx = -w;
    } else { // CENTER
        dx = -w / 2;
    }

    // Vertical Origin
    if (vOrigin === 'TOP') {
        dy = 0;
    } else if (vOrigin === 'BOTTOM' || vOrigin === 'BASELINE') {
        dy = -h;
    } else { // CENTER
        dy = -h / 2;
    }
    
    // For Label with background, the bounds might be slightly larger, but w/h already includes bg padding if computed above
    // However, Label drawing logic handles padding differently (draws bg centered on text usually? or text centered on bg?)
    // Let's refine Label w/h above if needed. 
    // Current Label logic in calculateBounds: w/h includes padding.
    // So dx/dy applying to the whole box is correct.

    minX = Math.min(minX, ox + dx);
    maxX = Math.max(maxX, ox + dx + w);
    minY = Math.min(minY, oy + dy);
    maxY = Math.max(maxY, oy + dy + h);
  }

  // Add some padding
  const padding = 5;
  const boundsResult = {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: (maxX - minX) + padding * 2,
    height: (maxY - minY) + padding * 2
  };
  return boundsResult;
}

/**
 * Render entities to canvas
 * @param {Array} entities - List of entity objects (PointEntity, LabelEntity, etc.)
 * @param {number} canvasScale - Scale factor for high-DPI rendering (default: 1)
 * @returns {Promise<Object>} { dataUrl, width, height, centerX, centerY }
 */
export async function generateCanvas(entities, canvasScale = 1) {
  const bounds = await calculateBounds(entities);
  
  const canvas = document.createElement('canvas');
  // Apply canvasScale to physical dimensions
  canvas.width = Math.max(bounds.width * canvasScale, 1);
  canvas.height = Math.max(bounds.height * canvasScale, 1);
  const ctx = canvas.getContext('2d');

  // Global scale for high-DPI
  ctx.scale(canvasScale, canvasScale);

  // Move origin to the "center" relative to the bounds
  // The entities are positioned relative to (0,0).
  // If minX is -50, we need to shift +50 to draw at 0.
  const centerX = -bounds.minX;
  const centerY = -bounds.minY;
  
  ctx.translate(centerX, centerY);

  // Sort by type priority (Billboard -> Point -> Label)
  // Re-use logic from BaseEntity if possible, but hardcode here for simplicity
  const priority = { 'billboard': 0, 'point': 1, 'label': 2 };
  const sorted = [...entities].sort((a, b) => (priority[a.type] || 0) - (priority[b.type] || 0));

  for (const entity of sorted) {
    const ox = (entity.pixelOffset ? entity.pixelOffset[0] : 0);
    const oy = (entity.pixelOffset ? entity.pixelOffset[1] : 0);

    ctx.save();
    ctx.translate(ox, oy);
    
    // Determine drawing offset based on origin
    let hOrigin = entity.horizontalOrigin || 'CENTER';
    let vOrigin = entity.verticalOrigin || 'CENTER';
    
    // Point is always CENTER/CENTER
    if (entity.type === 'point') {
        hOrigin = 'CENTER';
        vOrigin = 'CENTER';
    }

    if (entity.type === 'point') {
        // ... Point drawing logic assumes (0,0) is center, which matches CENTER/CENTER
        // No change needed for Point drawing command itself, as arc(0,0) draws around center.
        const size = (entity.pixelSize || 10);
        // ...
        const color = entity.color || 'white';
        const outline = entity.outline;
        const outlineColor = entity.outlineColor || 'black';
        const outlineWidth = entity.outlineWidth || 1;
        const alpha = entity.opacity !== undefined ? entity.opacity : 1;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        
        ctx.fillStyle = color;
        ctx.fill();

        if (outline) {
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = outlineColor;
            ctx.stroke();
        }
    } else if (entity.type === 'billboard') {
        let img = entity._loadedImage;
        if (!img && entity.imageUrl) {
            try {
                img = await loadImage(entity.imageUrl);
            } catch (e) {
                // Ignore
            }
        }
        
        if (img) {
            const w = entity.width || img.width;
            const h = entity.height || img.height;
            const alpha = entity.opacity !== undefined ? entity.opacity : 1;
            const rotation = entity.rotation || 0;
            
            ctx.globalAlpha = alpha;
            if (rotation) ctx.rotate(rotation);
            
            // Calculate draw position
            let dx = 0, dy = 0;
            
            if (hOrigin === 'LEFT') dx = 0;
            else if (hOrigin === 'RIGHT') dx = -w;
            else dx = -w / 2; // CENTER
            
            if (vOrigin === 'TOP') dy = 0;
            else if (vOrigin === 'BOTTOM' || vOrigin === 'BASELINE') dy = -h;
            else dy = -h / 2; // CENTER

            ctx.drawImage(img, dx, dy, w, h);
        }
    } else if (entity.type === 'label') {
        const text = entity.text || '';
        const font = entity.font || '14px sans-serif';
        const style = entity.style || 'FILL'; // FILL, OUTLINE, FILL_AND_OUTLINE
        const color = entity.color || 'white';
        const outlineColor = entity.outlineColor || 'black';
        const outlineWidth = entity.outlineWidth || 1;
        const bgColor = entity.backgroundColor;
        const showBg = entity.showBackground;
        
        ctx.font = font;

        // Map Cesium origin to Canvas alignment
        // Horizontal
        if (hOrigin === 'LEFT') ctx.textAlign = 'left';
        else if (hOrigin === 'RIGHT') ctx.textAlign = 'right';
        else ctx.textAlign = 'center';

        // Vertical
        if (vOrigin === 'TOP') ctx.textBaseline = 'top';
        else if (vOrigin === 'BOTTOM') ctx.textBaseline = 'bottom';
        else if (vOrigin === 'BASELINE') ctx.textBaseline = 'alphabetic';
        else ctx.textBaseline = 'middle'; // CENTER
        
        const metrics = ctx.measureText(text);
        
        // Background logic needs to respect alignment too
        if (showBg && bgColor) {
            const bgW = metrics.width + 8;
            // Approximate height
            const textH = (parseInt(font) || 14); 
            const bgH = textH + 4;
            
            let bgX = 0;
            let bgY = 0;
            
            // Adjust bgX based on alignment
            if (ctx.textAlign === 'left') bgX = -4; // Padding left
            else if (ctx.textAlign === 'right') bgX = -bgW + 4;
            else bgX = -bgW / 2;
            
            // Adjust bgY based on baseline
            if (ctx.textBaseline === 'top') bgY = -2;
            else if (ctx.textBaseline === 'bottom') bgY = -bgH + 2;
            else if (ctx.textBaseline === 'middle') bgY = -bgH / 2;
            else bgY = -bgH + 4; // Alphabetic approximation

            ctx.fillStyle = bgColor;
            ctx.fillRect(bgX, bgY, bgW, bgH);
        }

        // Text
        if (style === 'FILL' || style === 'FILL_AND_OUTLINE') {
            ctx.fillStyle = color;
            ctx.fillText(text, 0, 0);
        }
        if (style === 'OUTLINE' || style === 'FILL_AND_OUTLINE') {
            ctx.lineWidth = outlineWidth;
            ctx.strokeStyle = outlineColor;
            ctx.strokeText(text, 0, 0);
        }
    }

    ctx.restore();
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    centerX: centerX,
    centerY: centerY
  };
}
