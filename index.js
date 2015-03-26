'use strict';

var path = require('path');
var fs = require('fs');
// See https://github.com/jshint/jshint/issues/1747 for context
/* global -Promise */
var Promise = require('es6-promise').Promise;


module.exports = function reloadCSS(options) {

  options = options || {};

  var client = options.client;
  var app = options.app;
  var appSrcPath = options.srcPath;

  return new Promise(function(resolve, reject) {

    if (client === undefined || app === undefined || appSrcPath === undefined) {
      return reject(new Error('client, app and appSrcPath are required to reload stylesheets'));
    }

    getWebAppsActor(client)
      .then(function(webAppsActor) {
        return getAppTab(webAppsActor, app.manifestURL);
      })
      .then(function(tab) {
        // Apparently this method needs to be called in tabs before you can
        // do anything at all on them. This is a change introduced in simulators
        // 2.1 onwards.
        tab.attach(function() {
          tab.StyleSheets.getStyleSheets(function(err, styleSheets) {
            if (err) {
              reject(err);
            }
            var appOrigin = app.origin;
            resolve(updateStyleSheets(styleSheets, appOrigin, appSrcPath));
          });
        });
      }).catch(function(err) {
        console.error('This happened', err);
      });

  });

};


function getWebAppsActor(client) {
  return new Promise(function(resolve, reject) {

    client.getWebapps(function(err, webAppsActor) {
      if (err) {
        return reject(err);
      }
      resolve(webAppsActor);
    });

  });
}


function getAppTab(webAppsActor, manifestURL) {
  return new Promise(function(resolve, reject) {
    webAppsActor.getApp(manifestURL, function(err, app) {
      if (err) {
        return reject(err);
      }
      resolve(app);
    });
  });
}


function updateStyleSheets(sheets, appOrigin, appSrcPath) {
  return Promise.all(sheets.map(function(sheet) {
    return updateStyleSheet(sheet, appOrigin, appSrcPath);
  }));
}


function updateStyleSheet(sheet, appOrigin, appSrcPath) {
  return new Promise(function(resolve, reject) {
    // Each sheet has an .href property that looks like
    // sheet.href = 'app://928a5c50-a79e-11e4-995c-db5a47a5c876/css/style.css'
    // Then the app has an origin that looks like
    // app.origin = app://928a5c50-a79e-11e4-995c-db5a47a5c876
    // but we actually want the relative path: css/style.css
    // for relating it to the source path, reading the changed contents from
    // disk and updating the style sheet in the running application

    var sheetHref = sheet.href;
    var sheetRelPath = sheetHref.replace(appOrigin, '');
    var sheetSrcPath = path.join(appSrcPath, sheetRelPath);

    fs.readFile(sheetSrcPath, 'utf-8', function(err, cssContents) {

      if (err) {
        return reject(err);
      }

      sheet.update(cssContents, function(err, res) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });

    });

  });
}
