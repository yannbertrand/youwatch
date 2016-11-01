const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const Configstore = require('configstore');

const configStore = new Configstore('YouWatch');

const pageUrl = url.format({
  protocol: 'file',
  slashes: true,
  pathname: path.join(__dirname, 'client', 'index.html')
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
    width: configStore.get('width') || 1600,
    height: configStore.get('height') || 900,
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

  _window.loadURL(pageUrl);
  _window.on('resize', onResize.bind(null, MAIN_WINDOW));
  _window.on('closed', onClosed.bind(null, MAIN_WINDOW));

  return _window;
}

module.exports.openMainWindow = openMainWindow;

function onResize(windowName) {
  const size = windows[windowName].getSize();

  configStore.set('width', size[0]);
  configStore.set('height', size[1]);
}

function onClosed(windowName) {
  // dereference the window
  windows[windowName] = null;
}
