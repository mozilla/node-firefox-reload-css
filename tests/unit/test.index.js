'use strict';

var mockery = require('mockery');
var nodemock = require('nodemock');

var reloadCSS = require('../../index');

module.exports = {

  'reloadCSS() should fail when missing client option': function(test) {
    reloadCSS({
      app: {},
      srcPath: '...'
    }).then(function(results) {
      test.ok(false);
      test.done();
    }).catch(function(err) {
      test.done();
    });
  },

  'reloadCSS() should fail when missing app option': function(test) {
    reloadCSS({
      client: {},
      srcPath: '...'
    }).then(function(results) {
      test.ok(false);
      test.done();
    }).catch(function(err) {
      test.done();
    });
  },

  'reloadCSS() should fail when missing srcPath option': function(test) {
    reloadCSS({
      client: {},
      app: {}
    }).then(function(results) {
      test.ok(false);
      test.done();
    }).catch(function(err) {
      test.done();
    });
  },


  'reloadCSS() should make Firefox API calls to reload CSS': function(test) {

    var callbackType = function() {};
    var appOrigin = 'app://8675309/';
    var manifestURL = appOrigin + 'manifest.webapp';
    var appSrcPath = '/devel/apps/test/';
    var testApp = {
      origin: appOrigin,
      manifestURL: manifestURL
    };

    // Set up some mock stylesheets
    function MockStyleSheet(path, text) {
      this.path = path;
      this.href = appOrigin + path;
      this.file = appSrcPath + path;
      this.text = text;
    }
    MockStyleSheet.prototype.update = function(text, updateCallback) {
      this.text = text;
      return updateCallback(null, 'updated ' + this.path);
    };
    var stylesheets = [
      new MockStyleSheet('css/style1.css', 'old contents 1'),
      new MockStyleSheet('css/style2.css', 'old contents 2'),
      new MockStyleSheet('css/style3.css', 'old contents 3')
    ];

    // Set up some mock files intended to replace stylesheet contents
    var files = {};
    stylesheets.forEach(function(sheet) {
      files[sheet.file] = sheet.text.replace('old', 'new');
    });

    // Mock out fs.readFile to return only mock files
    mockery.registerMock('fs', {
      readFile: function(filePath, encoding, readFileCallback) {
        test.equal(encoding, 'utf-8');
        test.ok(filePath in files);
        readFileCallback(null, files[filePath]);
      }
    });

    // Set up mock tab.StyleSheets.getStyleSheets API to return stylesheets
    var mocked = nodemock
      .mock('attach')
        .takes(callbackType)
        .calls(0)
      .mock('getStyleSheets')
        .takes(callbackType)
        .calls(0, [null, stylesheets]);

    var tabAPI = {
      attach: mocked.attach,
      StyleSheets: { getStyleSheets: mocked.getStyleSheets }
    };

    // Set up mock client that supports getApp() returning mock tab API
    mocked.mock('getApp')
      .takes(manifestURL, callbackType)
      .calls(1, [null, tabAPI]);

    var mockClient = {
      getWebapps: function(webappsCallback) {
        webappsCallback(null, { getApp: mocked.getApp });
      }
    };

    // Enable mocks on a clear import cache
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    });

    // Require a freshly imported installApp for this test
    require('../../index')({
      client: mockClient,
      srcPath: appSrcPath,
      app: testApp
    }).catch(function(err) {
      test.ifError(err);
      test.done();
    }).then(function(result) {

      // Ensure all the mocks were called, and with the expected parameters
      test.ok(mocked.assert());

      // Ensure all the stylesheets were updated with new contents
      stylesheets.forEach(function(sheet) {
        test.equal(sheet.text, files[sheet.file]);
      });

      // Ensure the result from each update is carried through the promises
      test.deepEqual(result, [
        'updated css/style1.css',
        'updated css/style2.css',
        'updated css/style3.css'
      ]);

      test.done();

    });

  },

  tearDown: function(done) {
    // Clean up after mockery
    mockery.disable();
    done();
  }

};
