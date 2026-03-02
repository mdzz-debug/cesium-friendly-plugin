import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const plugins = [
  resolve({ browser: true }),
  commonjs(),
  terser()
];

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        name: 'CesiumFriendlyPlugin',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
        name: 'CesiumFriendlyPlugin',
        sourcemap: true
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'CesiumFriendlyPlugin',
        exports: 'named',
        globals: {
          cesium: 'Cesium',
          vue: 'Vue'
        },
        sourcemap: true
      }
    ],
    plugins,
    external: ['cesium', 'vue']
  },
  {
    input: 'src/vue.js',
    output: [
      {
        file: 'dist/vue.js',
        format: 'cjs',
        exports: 'named',
        sourcemap: true
      },
      {
        file: 'dist/vue.esm.js',
        format: 'es',
        exports: 'named',
        sourcemap: true
      }
    ],
    plugins,
    external: ['cesium', 'vue']
  }
];
