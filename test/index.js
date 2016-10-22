'use strict';

// Test for examples included in README.md
const helpers = require('./global-setup');
const path = require('path');

const describe = global.describe;
const it = global.it;
const beforeEach = global.beforeEach;
const afterEach = global.afterEach;

describe('example application launch', function () {
  helpers.setupTimeout(this);

  let app = null;

  beforeEach(function () {
    return helpers.startApplication().then(function (startedApp) {
      app = startedApp
    });
  });

  afterEach(function () {
    return helpers.stopApplication(app);
  });

  it('opens a window', function () {
    return app.client.waitUntilWindowLoaded()
      .browserWindow.focus()
      .getWindowCount().should.eventually.equal(1)
      .browserWindow.isMinimized().should.eventually.be.false
      .browserWindow.isDevToolsOpened().should.eventually.be.false
      .browserWindow.isVisible().should.eventually.be.true
      .browserWindow.isFocused().should.eventually.be.true
      .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
      .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0);
  });
})