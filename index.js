#!/usr/bin/env node

const {execSync} = require('child_process');
const {existsSync} = require('fs');
const {join, normalize} = require('path');

const minimist = require('minimist');

const run = require('./scripts/run');

const getPackage = () => {
  const topLevelPackage = './package.json';
  const insidePackage = join(
    __dirname, normalize(topLevelPackage)
  );
  return __dirname.includes('node_modules') ? require(insidePackage) : require(topLevelPackage);
};

const {
  name,
  version,
} = getPackage();


const build = (src, dist) => {
  if (!existsSync(dist)) {
    execSync(`mkdir -p ${dist}`);
  }
  console.log(src, dist);
};

const fallback = () => {
  const lines = [
    ` ${name}@${version}`,
    '-'.repeat(70),
    ' USAGE:',
    '',
    ' - webren run ./path/to/web/folder',
    ' - webren build ./path/to/web/folder ./path/to/output/folder',
    '-'.repeat(70),
  ];
  console.log(lines.join('\n'));
};

const handle = (args) => {
  const action = args[0];
  return action === 'run' && args.length === 2 ? run(args[1]) :
    (action === 'build' && args.length === 3) ? build(args[1], args[2]) : fallback();
};

const init = () => {
  const argv = minimist(process.argv.slice(2));
  const args = argv._;
  return args.length < 1 ? fallback() : handle(args);
};

init();
