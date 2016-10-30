const { app, BrowserWindow } = require('electron');
const path = require('path');

const isMac = process.platform === 'darwin';
const MAIN_WINDOW = 'main';
const ICON = path.join(__dirname, '..', 'static', 'icon.png');
const url = require('url').format({
  protocol: 'file',
  slashes: true,
  pathname: path.join(__dirname, 'client', 'index.html')
});

const CONFIG = require('./config');

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

  _window.loadURL(url);
  _window.on('closed', onClosed.bind(null, MAIN_WINDOW));

  return _window;
}

module.exports.openMainWindow = openMainWindow;

function onClosed(windowName) {
  // dereference the window
  windows[windowName] = null;
}
