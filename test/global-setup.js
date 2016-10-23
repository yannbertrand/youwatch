'use strict';

const Application = require('spectron').Application;
const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const path = require('path');

global.before(function () {
  chai.should();
  chai.use(chaiAsPromised);
});

exports.getElectronPath = function () {
  const electronPath = path.join(__dirname, '../node_modules/.bin/electron');
  if (process.platform === 'win32') electronPath += '.cmd';

  return electronPath;
};

exports.setupTimeout = function (test) {
  if (process.env.CI)
    test.timeout(30000);
  else
    test.timeout(15000);
};

exports.startApplication = function () {
  const options = {};

  options.path = exports.getElectronPath();
  options.args = [path.join(__dirname, '..')];

  if (process.env.CI) options.startTimeout = 30000;

  const app = new Application(options);
  return app.start().then(function () {
    assert.equal(app.isRunning(), true);
    chaiAsPromised.transferPromiseness = app.transferPromiseness;
    return app;
  });
};

exports.stopApplication = function (app) {
  if (!app || !app.isRunning()) return;

  return app.stop().then(function () {
    assert.equal(app.isRunning(), false);
  });
};
