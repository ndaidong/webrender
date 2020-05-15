// run

const {normalize} = require('path');
const {existsSync, lstatSync} = require('fs');

const express = require('express');

const readFile = require('./readFile');

const app = express();

const env = process.env || {};

const PORT = env['PORT'] || 8182;

const run = (src) => {
  console.log(src);
  app.get('*', (req, res) => {
    const endpoint = req.path || 'index.html';
    const fpath = normalize(`${src}/${endpoint}`);
    if (!existsSync(fpath) || !lstatSync(fpath).isFile()) {
      res.type('text/html');
      res.status(404);
      return res.send('404 File Not Found');
    }
    if (endpoint.endsWith('.html')) {
      const content = readFile(endpoint);
      res.type('text/html');
      return res.send(content);
    }
    if (endpoint.endsWith('.css')) {
      const content = readFile(endpoint);
      res.type('text/css');
      return res.send(content);
    }
    if (endpoint.endsWith('.js')) {
      const content = readFile(endpoint);
      res.type('text/javascript');
      return res.send(content);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server started at http://0.0.0.0:${PORT}`);
  });
};

module.exports = run;
