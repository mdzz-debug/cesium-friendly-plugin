import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import fs from 'fs';
import path from 'path';

const shouldMinify = !process.env.ROLLUP_WATCH;

const copyAssets = () => ({
  name: 'copy-assets',
  writeBundle() {
    try {
      const srcDir = path.resolve('src/assets/material');
      const distDir = path.resolve('dist/assets/material');
      fs.mkdirSync(distDir, { recursive: true });
      const files = ['waterNormals.jpg', 'material.png'];
      files.forEach((f) => {
        const src = path.join(srcDir, f);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, path.join(distDir, f));
        }
      });
    } catch (_) {}
  }
});

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
      }) : null,
      copyAssets()
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
      }) : null,
      copyAssets()
    ].filter(Boolean),
    external: ['cesium']
  }
];
