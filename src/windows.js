const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const _ = require('lodash');

const pageUrl = url.format({
  protocol: 'file',
  slashes: true,
  pathname: path.join(__dirname, 'client', 'index.html'),
});

const isMac = process.platform === 'darwin';
const MAIN_WINDOW = 'main';
const ICON = path.join(__dirname, '..', 'static', 'icon.png');

const windows = {};

function openMainWindow() {
  if (!windows[MAIN_WINDOW])
    windows[MAIN_WINDOW] = createMainWindow();
}

function createMainWindow() {
  const _window = new BrowserWindow({
    title: app.getName(),
    icon: ICON,
    autoHideMenuBar: true,
    minWidth: 880,
    minHeight: 370,
    frame: isMac,
    titleBarStyle: 'hidden-inset',
    alwaysOnTop: false,
    hasShadow: true,
    enableLargerThanScreen: true,
    show: false,
  });

  if (isMac)
    app.dock.setIcon(ICON);

  _window.loadURL(pageUrl);

  _window.on('ready-to-show', () => {
    if (require('electron-is-dev'))
      _window.openDevTools();

    _window.show();
  });

  _window.on('closed', () => onClosed(MAIN_WINDOW));

  return _window;
}

module.exports.openMainWindow = openMainWindow;

function onClosed(windowName) {
  // Dereference the window
  windows[windowName] = null;
}
