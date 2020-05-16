# webrender
Run live web and build static site

# Usage

```bash
npm i webrender
```

Then run website stored at given folder:

```bash
./node_modules/.bin/webren run PATH_TO_SOURCE_DIR
```

Or build static site:

```bash
./node_modules/.bin/webren build SOURCE_DIR TARGET_DIR
```

It's recommended to add to script section in the `package.json` file, for example:

```json
  "scripts": {
    "dev": "DEBUG=webrender:* webren run ./src",
    "build": "DEBUG=webrender:* webren build ./src ./dist"
  },
```

Then, we can use it as:

```bash
npm run dev  # or
npm run build
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
