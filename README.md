# node-firefox-reload-css [![Build Status](https://secure.travis-ci.org/mozilla/node-firefox-reload-css.png?branch=master)](http://travis-ci.org/mozilla/node-firefox-reload-css)

> Reload CSS stylesheets on a running app on a Firefox runtime.

This is part of the [node-firefox](https://github.com/mozilla/node-firefox) project.

*NOTE: This module is super experimental and the API is not totally stable yet. Use under your own responsibility.*

## Installation

### From git

```bash
git clone https://github.com/mozilla/node-firefox-reload-css.git
cd node-firefox-reload-css
npm install
```

If you want to update later on:

```bash
cd node-firefox-reload-css
git pull origin master
npm install
```

### npm

```bash
npm install node-firefox-reload-css
```

## Usage

```javascript
reloadCSS(options) // returns a Promise
```

where `options` is a plain `Object` which must contain the following:

* `app`: an object containing the description of an installed app *in the client* (you must have obtained this after a call to <a href="https://github.com/mozilla/node-firefox-find-app"><tt>node-firefox-find-app</tt></a>.
* `client`: the remote client where we want to reload the style sheets
* `srcPath`: the source for the app

If no `options` are provided, or if `options` is an empty `Object` (`{}`), or missing then `uninstallApp` will fail (how can you uninstall *you don't know what app exactly* from *you don't know where*?)


### Reloading the app stylesheets on change (using the npm `watch` module)

```javascript
var watch = require('watch');
var reloadCSS = require('node-firefox-reload-css');

var appPath = '/path/to/your/app/code';
var appCSSPath = path.join(appPath, 'css');

watch.createMonitor(appCSSPath, function(monitor) {
  monitor.on('changed', function(f, curr, prev) {

    reloadCSS({
      client: client,
      app: app,
      srcPath: appPath
    });

  });
});

```

You can have a look at the `examples` folder for a complete example.

## Running the tests

After installing, you can simply run the following from the module folder:

```bash
npm test
```

To add a new unit test file, create a new file in the `tests/unit` folder. Any file that matches `test.*.js` will be run as a test by the appropriate test runner, based on the folder location.

We use `gulp` behind the scenes to run the test; if you don't have it installed globally you can use `npm gulp` from inside the project's root folder to run `gulp`.

### Code quality and style

Because we have multiple contributors working on our projects, we value consistent code styles. It makes it easier to read code written by many people! :-)

Our tests include unit tests as well as code quality ("linting") tests that make sure our test pass a style guide and [JSHint](http://jshint.com/). Instead of submitting code with the wrong indentation or a different style, run the tests and you will be told where your code quality/style differs from ours and instructions on how to fix it.

## License

This program is free software; it is distributed under an
[Apache License](https://github.com/mozilla/node-firefox-reload-css/blob/master/LICENSE).

## Copyright

Copyright (c) 2015 [Mozilla](https://mozilla.org)
([Contributors](https://github.com/mozilla/node-firefox-reload-css/graphs/contributors)).

