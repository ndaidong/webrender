// parseJS

const {normalize} = require('path');

const {rollup} = require('rollup');
const strip = require('@rollup/plugin-strip');

const {nodeResolve} = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const cleanup = require('rollup-plugin-cleanup');
const terser = require('terser');

const {error, info} = require('./logger');

const rollupify = async (input, mode) => {
  try {
    info(' > Rollupifying: load plugins');
    const plugins = [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**',
        sourceMap: false,
      }),
      cleanup({
        comments: 'none',
        maxEmptyLines: 0,
      }),
    ];
    if (mode !== 'dev') {
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

    if (mode === 'dev') {
      return jsCode;
    }

    info(' > Rollupifying: minifying JS code');
    const minOutput = terser.minify(jsCode, {
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

module.exports = async (filePath, mode = 'dev') => {
  const fullPath = normalize(filePath);
  info('Start rollupifying JS content with Rollup...');
  const jsContent = await rollupify(fullPath, mode);
  info(`Rollupified JS file '${fullPath}' in ${mode} mode`);
  return jsContent;
};
