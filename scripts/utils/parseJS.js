// parseJS

const {normalize} = require('path');

const {rollup} = require('rollup');
const strip = require('@rollup/plugin-strip');

const {nodeResolve} = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');
const cleanup = require('rollup-plugin-cleanup');
const terser = require('terser');

const {error, info} = require('./logger');

const rollupify = async (input, config) => {
  try {
    info(' > Rollupifying: load plugins');
    const {ENV, replacement} = config;
    const plugins = [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**',
        sourceMap: false,
      }),
      replace(replacement),
      cleanup({
        comments: 'none',
        maxEmptyLines: 0,
      }),
    ];
    if (ENV === 'production') {
      plugins.push(strip({
        debugger: false,
        functions: [
          'console.log',
          'assert.*',
          'debug',
          'alert',
        ],
        sourceMap: false,
      }));
    }
    info(' > Rollupifying: create package bundle');
    const bundle = await rollup({
      input,
      plugins,
    });

    info(' > Rollupifying: generating JS code');
    const {output} = await bundle.generate({
      format: 'iife',
      indent: true,
      strict: false,
    });

    const codeParts = [];
    for (const chunkOrAsset of output) {
      if (chunkOrAsset.isAsset) {
        codeParts.push(chunkOrAsset.source);
      } else {
        codeParts.push(chunkOrAsset.code);
      }
    }

    const jsCode = codeParts.join('\n');

    if (ENV !== 'production') {
      return jsCode;
    }

    info(' > Rollupifying: minifying JS code');
    const minOutput = await terser.minify(jsCode, {
      toplevel: true,
      output: {
        beautify: false,
      },
    });
    info(' > Rollupifying: almost done');
    return minOutput.code;
  } catch (err) {
    error(err);
  }
  return '';
};

module.exports = async (filePath, config) => {
  const fullPath = normalize(filePath);
  info('Start rollupifying JS content with Rollup...');
  const jsContent = await rollupify(fullPath, config);
  const {ENV} = config;
  info(`Rollupified JS file '${fullPath}' in ${ENV} mode`);
  return jsContent;
};
