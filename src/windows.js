const { app, BrowserWindow } = require('electron');
const path = require('path');

const CONFIG = require('./config');

const MAIN_WINDOW = 'main';
const ICON = path.join('static/icon.png');

const isMac = process.platform === 'darwin';

const windows = {};

function openMainWindow() {
  if (!windows[MAIN_WINDOW])
    windows[MAIN_WINDOW] = createMainWindow();
}

function createMainWindow() {
  const _window = new BrowserWindow({
    title: app.getName(),
    width: CONFIG.MAIN_WINDOW.WIDTH,
    height: CONFIG.MAIN_WINDOW.HEIGHT,
    icon: ICON,
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

  _window.loadURL('file://' + path.resolve('dist/client/index.html'));
  _window.on('closed', onClosed.bind(null, MAIN_WINDOW));

  return _window;
}

module.exports.openMainWindow = openMainWindow;

function onClosed(windowName) {
  // dereference the window
  windows[windowName] = null;
}
