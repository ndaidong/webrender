# webrender
Run live web and build static site

[![NPM](https://badge.fury.io/js/webrender.svg)](https://badge.fury.io/js/webrender)
[![Build Status](https://travis-ci.org/ndaidong/webrender.svg?branch=master&updated=2)](https://travis-ci.org/ndaidong/webrender)
[![Coverage Status](https://coveralls.io/repos/github/ndaidong/webrender/badge.svg?branch=master&updated=2)](https://coveralls.io/github/ndaidong/webrender?branch=master)

# Usage

Suppose that we want to build a front-end only website with pure HTML/CSS/JS or React, Vue, whatever. Our repo may look like following folder structure:

```
my-project
 - package.json
 - src/
     - assets
          - css
              - main.css
              - theme.css
          - js
              - main.js
              - another-modules.js
     - static
        - fonts
        - images
     - favicon.ico
     - index.html
     - about.html
     - faq.html

```

Here the website source code is placed within `src` folder. However the folder name can be anything else.

In order to use `webrender`, let's install it:

```bash
npm i webrender
```

And you can use command line or call it from code.


### Command Line

Add these 2 commands to `script` section of the `package.json` file, for example:

```json
  "scripts": {
    "run": "DEBUG=webrender:* webren run ./src",
    "build": "DEBUG=webrender:* webren build ./src ./dist"
  },
```

Since now, we can run the website within `src` folder to view and develop it as below:

```bash
npm run dev
```

Once everything is ok, we can build a static site into `dist` folder:

```bash
npm run build
```

### Programmatically

Run a website located at `./src` folder:

```js
const run = require('webrender/scripts/run');
run('./src');
```

This approach is helpful to work with `nodemon` for auto reloading.


```json
  "scripts": {
    "dev": "DEBUG=webrender:* PORT=4728 nodemon server.js -e js,css,html,json,yaml"
  },
```


You can even add more express middlewares:

```js
const path = require('path');

const cors = require('cors');
const favicon = require('serve-favicon');

const middlewares = [
  cors(),
  favicon(path.join(__dirname, 'public', 'favicon.ico')),
];

run('./src', middlewares);
```

Lastly, just build static version of this website to `./dist` folder:

```js
const build = require('webrender/scripts/build');
build('./src', './dist');
```


# Test

```bash
git clone git@github.com:ndaidong/webrender.git
cd webrender
npm i
npm test
```


# License

The MIT License (MIT)
