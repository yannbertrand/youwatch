const app = require('electron').app;

const CONFIG = require('./config');

let BrowserWindow;

module.exports = function (electron) {
  BrowserWindow = electron.BrowserWindow;

  return {
    openMainWindow,
    openLogInWindow,
    closeLogInWindow,
    activateWithNoOpenWindows,
  };
};

const MAIN_WINDOW = 'main';
const AUTH_WINDOW = 'auth';

const ICON = __dirname + '/../static/icon.png';

const isMac = process.platform === 'darwin';

let windows = {};

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

function createWindow(windowName, url, width, height, icon) {
  const win = new BrowserWindow({
    title: app.getName(),
    width,
    height,
    icon,
    autoHideMenuBar: true,
    minWidth: 780,
    minHeight: 270,
    frame: isMac,
    'title-bar-style': 'hidden-inset',
  });

  if (isMac)
    app.dock.setIcon(icon);

  if (require('electron-is-dev'))
    win.openDevTools();

  win.loadURL(url);
  win.on('closed', onClosed.bind(null, windowName));

  return win;
}

function createMainWindow() {
  const url = 'file://' + __dirname + '/client/index.html';

  return createWindow(
    MAIN_WINDOW,
    url,
    CONFIG.MAIN_WINDOW.WIDTH,
    CONFIG.MAIN_WINDOW.HEIGHT,
    ICON
  );
}

function createLogInWindow(url) {
  return createWindow(
    AUTH_WINDOW,
    url,
    CONFIG.AUTH_WINDOW.WIDTH,
    CONFIG.AUTH_WINDOW.HEIGHT,
    ICON
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
