// run

const {existsSync, lstatSync} = require('fs');

const {genid} = require('bellajs');
const express = require('express');

const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const parseHTML = require('./parseHTML');

const {createFilePath} = require('./utils');

const {info} = require('./logger');

const app = express();

const env = process.env || {};

const PORT = env['PORT'] || 8182;

const REVISION = genid(24);


const run = (src) => {
  app.get('*', async (req, res, next) => {
    const endpoint = req.path;
    const fpath = createFilePath(src, endpoint);
    if (!existsSync(fpath) || !lstatSync(fpath).isFile()) {
      return next();
    }
    if (endpoint.endsWith('.html')) {
      const content = parseHTML(fpath, REVISION);
      res.type('text/html');
      return res.send(content);
    }
    if (endpoint.endsWith('.css')) {
      const content = await parseCSS(fpath);
      res.type('text/css');
      return res.send(content);
    }
    if (endpoint.endsWith('.js')) {
      const content = await parseJS(fpath);
      res.type('text/javascript');
      return res.send(content);
    }
    return next();
  });

  app.get('/', async (req, res, next) => {
    let fpath = createFilePath(src, 'index.htm');
    if (!existsSync(fpath)) {
      fpath = createFilePath(src, 'index.html');
    }
    if (existsSync(fpath)) {
      const content = parseHTML(fpath, REVISION);
      res.type('text/html');
      return res.send(content);
    }
    return next();
  });

  app.use((req, res) => {
    res.type('text/html');
    const endpoint = req.path;
    const content = `Path "${endpoint}" does not exist!`;
    return res.status(404).send(content);
  });

  app.listen(PORT, () => {
    info(`Server started at http://0.0.0.0:${PORT}`);
  });
};

module.exports = run;
