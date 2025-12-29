import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const shouldMinify = !process.env.ROLLUP_WATCH;

export default [
  // Main entry
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        name: 'CesiumFriendlyPlugin',
        exports: 'named'
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
        name: 'CesiumFriendlyPlugin'
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'CesiumFriendlyPlugin'
        // UMD will expose named exports under the global name
      }
    ],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      shouldMinify ? terser({
        keep_classnames: true,
        keep_fnames: true
      }) : null
    ].filter(Boolean),
    external: ['cesium']
  },
  // Vue entry
  {
    input: 'src/vue.js',
    output: [
      {
        file: 'dist/vue.js',
        format: 'cjs',
        exports: 'named'
      },
      {
        file: 'dist/vue.esm.js',
        format: 'es',
        exports: 'named'
      }
    ],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      shouldMinify ? terser({
        keep_classnames: true,
        keep_fnames: true
      }) : null
    ].filter(Boolean),
    external: ['cesium']
  }
];
