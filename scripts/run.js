// server.js

const path = require('path');
const {lstatSync} = require('fs');

const express = require('express');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const {genid} = require('bellajs');

const {info, error} = require('./utils/logger');

const {
  renderHTML,
  renderCSS,
  renderJS,
} = require('./utils/renderer');

const {
  existsSync,
  makeFilePath,
  fixPath,
  isAbsoluteURL,
} = require('./utils');

const env = process.env || {};

const ENV = env.ENV || 'dev';
const HOST = env.HOST || '0.0.0.0';
const PORT = Number(env.PORT) || 8182;
const URL = env.URL || '';
const TPLDIR = env.TPLDIR || './templates';

const run = (src, middlewares = []) => {
  const sourceDir = fixPath(src, __dirname);
  const confFile = path.join(sourceDir, 'config.json');
  const config = existsSync(confFile) ? require(confFile) : {};
  const tplDir = path.join(sourceDir, TPLDIR);

  const {meta} = config;
  const {url: metaUrl, image} = meta;
  const siteUrl = URL ? URL : metaUrl ? metaUrl : `http://${HOST}:${PORT}`;
  if (metaUrl !== siteUrl) {
    config.meta.url = siteUrl;
  }
  if (image && !isAbsoluteURL(image)) {
    config.meta.image = makeFilePath(siteUrl, image);
  }
  config.ENV = ENV;
  config.HOST = HOST;
  config.PORT = PORT;
  config.URL = siteUrl;
  config.TPLDIR = existsSync(tplDir) ? tplDir : false;
  config.SRCDIR = sourceDir;
  config.revision = genid(32);

  const app = express();
  app.disable('x-powered-by');

  const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    path: path.join(src, 'storage/logs'),
  });
  const morganTpl = 'combined';

  app.use(morgan(morganTpl, {
    stream: accessLogStream,
  }));

  const staticDir = makeFilePath(sourceDir, './static');
  if (existsSync(staticDir)) {
    app.use(express.static(staticDir));
  }

  middlewares.forEach((mw) => {
    app.use(mw);
  });

  app.get('*', async (req, res, next) => {
    const endpoint = req.path;
    const fpath = makeFilePath(sourceDir, endpoint);
    if (!existsSync(fpath) || !lstatSync(fpath).isFile()) {
      return next();
    }
    if (endpoint.endsWith('.css')) {
      const content = await renderCSS(fpath, config);
      res.type('text/css');
      return res.send(content);
    }
    if (endpoint.endsWith('.js')) {
      const content = await renderJS(fpath, config);
      res.type('text/javascript');
      return res.send(content);
    }
    return next();
  });

  app.get('*', async (req, res, next) => {
    const endpoint = req.path !== '/' ? req.path : 'index.html';
    const fpath = makeFilePath(!config.TPLDIR ? './' : tplDir, endpoint);
    if (!existsSync(fpath) || !lstatSync(fpath).isFile()) {
      return next();
    }
    if (endpoint.endsWith('.html')) {
      const content = await renderHTML(fpath, config);
      res.type('text/html');
      return res.send(content);
    }
    return next();
  });


  app.use(async (req, res) => {
    error(`${req.method} ${req.path} --> 404`);
    const errMsg = `The endpoint \`${req.path}\` does not exist!`;
    if (!config.TPLDIR) {
      res.type('text/html');
      return res.status(404).send(errMsg);
    } else {
      const fpath = makeFilePath(tplDir, 'error.html');
      const content = await renderHTML(fpath, {
        config,
        title: '404 Not Found',
        errorCode: 404,
        message: errMsg,
      });
      res.status(404);
      res.type('text/html');
      return res.send(content);
    }
  });

  app.use(async (err, req, res) => {
    error(`${req.METHOD} ${req.path} --> ${String(err)}`);
    const errMsg = 'Internal Server Error';
    if (config.TPLDIR) {
      res.type('text/html');
      return res.status(500).send(errMsg);
    } else {
      const fpath = makeFilePath(tplDir, 'error.html');
      const content = await renderHTML(fpath, {
        config,
        title: errMsg,
        errorCode: 500,
        message: String(err),
      });
      res.status(500);
      res.type('text/html');
      return res.send(content);
    }
  });

  const onServerReady = () => {
    const url = env.URL || `http://${HOST}:${PORT}`;
    info(`${config.meta.name} started at "${url}"`);
  };

  return app.listen(PORT, HOST, onServerReady);
};

module.exports = run;
