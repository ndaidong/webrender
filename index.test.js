// index.test

const {existsSync} = require('fs');
const {execSync} = require('child_process');

const request = require('supertest');
const run = require('./scripts/run');
const build = require('./scripts/build');
const {
  isFile,
  isDirectory,
  isHtmlFile,
  createFilePath,
} = require('./scripts/utils');


describe('Test run function', () => {
  const app = run('./examples/simple-web');
  it('website must be running', async (done) => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    done();
  });

  it('load favicon.icon must return icon content', async (done) => {
    const res = await request(app).get('/favicon.ico');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch('image/x-icon');
    done();
  });
  it('load robots.txt must return robot content', async (done) => {
    const res = await request(app).get('/robots.txt');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch('text/plain');
    done();
  });

  it('load html must return html content', async (done) => {
    const res = await request(app).get('/index.html');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch('text/html');
    done();
  });

  it('load js must return js content', async (done) => {
    const res = await request(app).get('/assets/js/main.js');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch('text/javascript');
    done();
  });

  it('load css must return css content', async (done) => {
    const res = await request(app).get('/assets/css/main.css');
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch('text/css');
    done();
  });

  it('load bad url must return 404', async (done) => {
    const res = await request(app).get('/somewhere/else');
    expect(res.statusCode).toEqual(404);
    expect(res.headers['content-type']).toMatch('text/html');
    done();
  });

  afterAll((done) => {
    return app.close(done);
  });
});

describe('Test build function', () => {
  beforeAll((done) => {
    if (existsSync('./output')) {
      execSync('rm -rf ./output');
    }
    build('./examples/simple-web', './output');
    done();
  });
  const outputDir = './output/simple-web';
  const staticDir = `${outputDir}/static`;
  const assetDir = `${outputDir}/assets`;
  it('output folder must be created', async () => {
    expect(existsSync(outputDir)).toBe(true);
    expect(isDirectory(outputDir)).toBe(true);
  });
  it('index.html must be generated', async () => {
    const indexFile = createFilePath(outputDir, 'index.html');
    expect(existsSync(indexFile)).toBe(true);
    expect(isFile(indexFile)).toBe(true);
    expect(isHtmlFile(indexFile)).toBe(true);
  });
  it('static folder must be copied', async () => {
    expect(existsSync(staticDir)).toBe(true);
    expect(isDirectory(staticDir)).toBe(true);
    expect(existsSync(`${staticDir}/robots.txt`)).toBe(true);
  });
  it('output assets folders must be created', async () => {
    expect(existsSync(assetDir)).toBe(true);
    expect(isDirectory(assetDir)).toBe(true);
  });

  afterAll((done) => {
    // execSync('rm -rf ./output');
    done();
  });
});
