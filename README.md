# webrender
Run live web and build static site

# Usage

Install it as local package:

```bash
npm i webrender
```

Then run website in `src` folder

```bash
./node_modules/.bin/webren run
```

Or release a static site into `dist` folder

```bash
./node_modules/.bin/webren build
```

While running/building web with `webrender`, the output will be standardized naturally:

- cleanify and minify HTML
- transpile CSS with PostCSS to make use of CSS4 features
- merge CSS files and minify them
- transpile JS code with Rollup (not convert ES6 to ES5, but make use of ES6 Module)
- merge JS files together and minify them

