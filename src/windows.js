const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const Configstore = require('configstore');

app.on('ready', () => {
  const primaryDisplay = electron.screen.getPrimaryDisplay();
  const screenWidth = primaryDisplay.bounds.width;
  const screenHeight = primaryDisplay.bounds.height;
  const appWidth = 0.75 * screenWidth;
  const appHeight = 0.75 * screenHeight;

  const configStore = new Configstore('YouWatch', {
    window: {
      classic: {
        x: (screenWidth / 2.0) - (appWidth / 2.0),
        y: (screenHeight / 2.0) - (appHeight / 2.0),
        width: appWidth,
        height: appHeight,
      },
      fullscreen: {
        x: screenWidth - 640,
        y: screenHeight - 380,
        width: 640,
        height: 380,
      },
    },
  });

  const pageUrl = url.format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, 'client', 'index.html'),
  });

  const isMac = process.platform === 'darwin';
  const MAIN_WINDOW = 'main';
  const ICON = path.join(__dirname, '..', 'static', 'icon.png');

  const windows = {};
  let isFullscreen = false;
  let isChangingMode = false;

  function openMainWindow() {
    if (!windows[MAIN_WINDOW])
      windows[MAIN_WINDOW] = createMainWindow();
  }

  function createMainWindow() {
    const _window = new BrowserWindow({
      title: app.getName(),
      x: configStore.get('window.classic.x'),
      y: configStore.get('window.classic.y'),
      width: configStore.get('window.classic.width'),
      height: configStore.get('window.classic.height'),
      icon: ICON,
      autoHideMenuBar: true,
      minWidth: 880,
      minHeight: 370,
      frame: isMac,
      titleBarStyle: 'hidden-inset',
      fullscreenable: false, // so that the youtube videos go fullscreen inside the window, not in the screen
      alwaysOnTop: false,
      hasShadow: true,
      enableLargerThanScreen: true,
    });

    if (isMac)
      app.dock.setIcon(ICON);

    if (require('electron-is-dev'))
      _window.openDevTools();

    _window.loadURL(pageUrl);
    _window.on('resize', onResize.bind(null, MAIN_WINDOW));
    _window.on('move', onResize.bind(null, MAIN_WINDOW));

    _window.on('closed', onClosed.bind(null, MAIN_WINDOW));

    return _window;
  }

  function toggleFullscreen(_isFullscreen) {
    const bounds = configStore.get('window.' + (_isFullscreen ? 'fullscreen' : 'classic'));

    isChangingMode = true;
    windows[MAIN_WINDOW].setBounds(bounds, true);
    isChangingMode = false;

    isFullscreen = _isFullscreen;
  }

  module.exports.openMainWindow = openMainWindow;
  module.exports.toggleFullscreen = toggleFullscreen;

  function onResize(windowName) {
    if (isChangingMode)
      return;

    const bounds = windows[windowName].getBounds();
    const key = 'window.' + (isFullscreen ? 'fullscreen' : 'classic');
    configStore.set(key, bounds);
  }

  function onClosed(windowName) {
    // dereference the window
    windows[windowName] = null;
  }
});
