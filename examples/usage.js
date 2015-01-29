'use strict';

var path = require('path');
var fs = require('fs');
// See https://github.com/jshint/jshint/issues/1747 for context
/* global -Promise */
var Promise = require('es6-promise').Promise;
var watch = require('watch');
var startSimulator = require('node-firefox-start-simulator');
var connect = require('node-firefox-connect');
var installApp = require('node-firefox-install-app');
var findApp = require('node-firefox-find-app');
var launchApp = require('node-firefox-launch-app');
var reloadCSS = require('..');

var appPath = path.join(__dirname, 'sampleApp');


startAndConnect().then(function(client) {
  findOrInstall(client, appPath).then(function(app) {
    console.log('ok', app);
    setTimeout(function() {
      // Let's wait a little bit so we can see the app launch and then change
      launchApp({ client: client, manifestURL: app.manifestURL }).then(function() {
        watchCSS(client, app, appPath, 'css');
      });
    }, 1000);
  });
});


function startAndConnect() {
  return startSimulator().then(function(simulator) {
    return connect(simulator.port);
  });
}


function findOrInstall(client, appPath) {
  var manifest = loadJSON(path.join(appPath, 'manifest.webapp'));
  return new Promise(function(resolve, reject) {

    find(client, manifest).then(function(app) {
      if (app === false) {
        installApp({ client: client, appPath: appPath }).then(function() {
          resolve(find(client, manifest));
        });
      } else {
        resolve(app);
      }
    });

  });
}


function find(client, manifest) {
  return new Promise(function(resolve, reject) {
    findApp({ client: client, manifest: manifest }).then(function(apps) {
      if (apps.length === 0) {
        resolve(false);
      } else {
        resolve(apps[0]);
      }
    });
  });
}


function loadJSON(path) {
  var data = fs.readFileSync(path, 'utf8');
  return JSON.parse(data);
}


function watchCSS(client, app, appPath, cssDir) {

  console.log('watching CSS now', appPath, cssDir);

  var appCSSPath = path.join(appPath, cssDir);

  watch.createMonitor(appCSSPath, function(monitor) {
    monitor.on('changed', function(f, curr, prev) {

      // TODO only reload *the changed* file
      reloadCSS({
        client: client,
        app: app,
        srcPath: appPath
      });

    });
  });
}
