const { app, BrowserWindow } = require('electron');
const path = require('path');

const CONFIG = require('./config');

module.exports = function () {
  return {
    openMainWindow,
    openLogInWindow,
    closeLogInWindow,
    activateWithNoOpenWindows,
  };
};

const MAIN_WINDOW = 'main';
const AUTH_WINDOW = 'auth';

const ICON = path.join('static/icon.png');

const isMac = process.platform === 'darwin';

const windows = {};

function openMainWindow() {
  if (!windows[MAIN_WINDOW])
    windows[MAIN_WINDOW] = createMainWindow();
}

function openLogInWindow(url) {
  windows[AUTH_WINDOW] = createLogInWindow(url);
}

function closeLogInWindow() {
  windows[AUTH_WINDOW].close();
}

function createWindow(windowName, url, width, height) {
  const _window = new BrowserWindow({
    title: app.getName(),
    width,
    height,
    ICON,
    autoHideMenuBar: true,
    minWidth: 880,
    minHeight: 370,
    frame: isMac,
    titleBarStyle: 'hidden-inset',
    fullscreenable: false, // so that the youtube videos go fullscreen inside the window, not in the screen
    alwaysOnTop: false,
    hasShadow: true,
  });

  if (isMac)
    app.dock.setIcon(ICON);

  if (require('electron-is-dev'))
    _window.openDevTools();

  _window.loadURL(url);
  _window.on('closed', onClosed.bind(null, windowName));

  return _window;
}

function createMainWindow() {
  const url = 'file://' + path.resolve('dist/client/index.html');

  return createWindow(
    MAIN_WINDOW,
    url,
    CONFIG.MAIN_WINDOW.WIDTH,
    CONFIG.MAIN_WINDOW.HEIGHT
  );
}

function createLogInWindow(url) {
  return createWindow(
    AUTH_WINDOW,
    url,
    CONFIG.AUTH_WINDOW.WIDTH,
    CONFIG.AUTH_WINDOW.HEIGHT
  );
}

function activateWithNoOpenWindows() {
  if (!windows[MAIN_WINDOW]) {
    windows[MAIN_WINDOW] = createMainWindow();
  }
}

function onClosed(windowName) {
  // dereference the window
  windows[windowName] = null;
}
