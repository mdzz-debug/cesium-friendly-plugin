export const DEFAULT_COLOR_TOKENS = {
  primary: '#3fa7ff',
  secondary: '#26c6da',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  info: '#00bcd4',
  infoSoft: 'rgba(0, 188, 212, 0.12)',
  light: '#f5f7fa',
  dark: '#1f2937',
  white: '#ffffff',
  black: '#000000'
};

export function resolveColorInput(cesium, value, fallback = '#ffffff', tokens = DEFAULT_COLOR_TOKENS) {
  const Cesium = cesium;
  if (!Cesium || !Cesium.Color) return null;
  if (value instanceof Cesium.Color) return value;

  const parse = (input) => {
    if (!input) return null;
    if (input instanceof Cesium.Color) return input;
    if (typeof input === 'string') {
      const k = input.trim();
      if (!k) return null;
      const token = tokens && tokens[k];
      if (token) {
        const t = Cesium.Color.fromCssColorString(String(token));
        if (t) return t;
      }
      const direct = Cesium.Color.fromCssColorString(k);
      if (direct) return direct;
      return null;
    }
    if (
      typeof input === 'object' &&
      input.red !== undefined &&
      input.green !== undefined &&
      input.blue !== undefined &&
      input.alpha !== undefined
    ) {
      return new Cesium.Color(input.red, input.green, input.blue, input.alpha);
    }
    return null;
  };

  return parse(value) || parse(fallback) || Cesium.Color.WHITE;
}

