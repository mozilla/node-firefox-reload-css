'use strict';

var path = require('path');
var fs = require('fs');
// See https://github.com/jshint/jshint/issues/1747 for context
/* global -Promise */
var Promise = require('es6-Promise').Promise;


module.exports = function reloadCSS(options) {

  options = options || {};

  var client = options.client;
  var app = options.app;
  var appSrcPath = options.srcPath;

  // TODO error if any ^^^ undefined

  console.log(app);

  return new Promise(function(resolve, reject) {

    getWebAppsActor(client)
      .then(function(webAppsActor) {
        return getAppTab(webAppsActor, app.manifestURL);
      })
      .then(function(tab) {
        tab.StyleSheets.getStyleSheets(function(err, styleSheets) {
          if(err) {
            reject(err);
          }
          var appOrigin = app.origin;
          resolve(updateStyleSheets(styleSheets, appOrigin, appSrcPath));
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
      if(err) {
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
    // sheet.href = 'app://928a5c50-a79e-11e4-995c-db5a47a5c876/css/style.css'
    // app.origin = app://928a5c50-a79e-11e4-995c-db5a47a5c876
    // css/style.css
    // appSrcPath /Users/sole/apps/myApp/

    var sheetHref = sheet.href;
    var sheetRelPath = sheetHref.replace(appOrigin, '');
    var sheetSrcPath = path.join(appSrcPath, sheetRelPath);

    console.log('>>>>', sheetRelPath);
    console.log(sheetSrcPath);

    fs.readFile(sheetSrcPath, 'utf-8', function(err, cssContents) {

      if(err) {
        return reject(err);
      }

      sheet.update(cssContents, function(err, res) {
        if(err) {
          return reject(err);
        }
        console.log('pushed update', sheetRelPath);
        resolve(res);
      });
      
    });
    
  });
}

// App->Tab
// Tab -> StyleSheets
// .getStyleSheets()
//
// StyleSheet->update

// local sources
// css dir
// remote stylesheets
// how do you link both <->
//
// app.getStylesheets ? eso funciona?


