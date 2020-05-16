// parseCSS

const {normalize} = require('path');

const postcss = require('postcss');
const CleanCSS = require('clean-css');
const stripCssComments = require('strip-css-comments');

const {error, info} = require('./logger');
const {
  readFile,
} = require('./utils');

const POSTCSS_PLUGINS = [
  require('postcss-import'),
  require('postcss-custom-properties'),
  require('postcss-custom-media'),
  require('postcss-nested'),
  require('postcss-short'),
  require('autoprefixer'),
];

const removeComments = (css) => {
  return stripCssComments(css, {
    preserve: false,
  });
};

const postify = async (fileSrc, mode) => {
  try {
    info(' > Postifying: load plugins');
    const plugins = [...POSTCSS_PLUGINS];
    const css = readFile(fileSrc);
    const result = await postcss(plugins).process(css, {
      from: fileSrc,
      map: {
        inline: mode == 'dev',
      },
    });

    const minOpt = {level: 2};
    if (mode == 'dev') {
      minOpt.level = 0;
      minOpt.format = 'beautify';
    }

    info(' > Postifying: clean stuff');
    const cleaner = new CleanCSS(minOpt);

    info(' > Postifying: minifying CSS code');
    const minOutput = await cleaner.minify(result.css);

    if (mode == 'dev') {
      return minOutput.styles;
    }
    return removeComments(minOutput.styles);
  } catch (err) {
    error(err);
  }
  return '';
};


module.exports = async (filePath, mode = 'dev') => {
  const fullPath = normalize(filePath);
  info('Start postifying CSS content with PostCSS...');
  const cssContent = await postify(fullPath, mode);
  info(`Postified CSS file '${fullPath}' in ${mode} mode`);
  return cssContent;
};
