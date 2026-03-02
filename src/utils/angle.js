export function toRadians(cesium, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const Cesium = cesium;
  if (!Cesium || !Cesium.Math) return n;
  return Cesium.Math.toRadians(n);
}

export function toDegrees(cesium, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const Cesium = cesium;
  if (!Cesium || !Cesium.Math) return n;
  return Cesium.Math.toDegrees(n);
}

export function normalizeAngleInput(cesium, value, unit = 'auto') {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const mode = (unit || 'auto').toString().toLowerCase();
  if (mode === 'deg' || mode === 'degree' || mode === 'degrees') return toRadians(cesium, n);
  if (mode === 'rad' || mode === 'radian' || mode === 'radians') return n;
  if (Math.abs(n) > Math.PI * 2) return toRadians(cesium, n);
  return n;
}

