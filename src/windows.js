const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const Configstore = require('configstore');

app.on('ready', () => {
  const primaryDisplay = electron.screen.getPrimaryDisplay();
  let sortedDisplaysIds = electron.screen.getAllDisplays().map((display) => display.id).sort().join('-');

  const { width: screenWidth, height: screenHeight } = primaryDisplay.size;
  const appWidth = 0.75 * screenWidth;
  const appHeight = 0.75 * screenHeight;

  const defaultConfig = {
    classic: {
      x: (screenWidth / 2.0) - (appWidth / 2.0),
      y: (screenHeight / 2.0) - (appHeight / 2.0),
      width: appWidth,
      height: appHeight,
    },
    floatOnTop: {
      x: screenWidth - 640,
      y: screenHeight - 360,
      width: 640,
      height: 360,
    },
  };

  const configStore = new Configstore('YouWatch');
  if (!configStore.get(getConfigStoreWindowKey()))
    configStore.set(getConfigStoreWindowKey(), defaultConfig);

  const pageUrl = url.format({
    protocol: 'file',
    slashes: true,
    pathname: path.join(__dirname, 'client', 'index.html'),
  });

  const isMac = process.platform === 'darwin';
  const MAIN_WINDOW = 'main';
  const ICON = path.join(__dirname, '..', 'static', 'icon.png');

  const windows = {};
  let isPlayerMaximized = false;
  let isChangingMode = false;

  function openMainWindow() {
    if (!windows[MAIN_WINDOW])
      windows[MAIN_WINDOW] = createMainWindow();
  }

  function createMainWindow() {
    const _window = new BrowserWindow({
      title: app.getName(),
      x: configStore.get(getConfigStoreWindow('classic.x')),
      y: configStore.get(getConfigStoreWindow('classic.y')),
      width: configStore.get(getConfigStoreWindow('classic.width')),
      height: configStore.get(getConfigStoreWindow('classic.height')),
      icon: ICON,
      autoHideMenuBar: true,
      minWidth: 880,
      minHeight: 370,
      frame: isMac,
      titleBarStyle: 'hidden-inset',
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

  function togglePlayerState(_isPlayerMaximized) {
    const bounds = configStore.get(getConfigStoreWindow(_isPlayerMaximized ? 'floatOnTop' : 'classic'));

    isChangingMode = true;
    windows[MAIN_WINDOW].setBounds(bounds, true);
    isChangingMode = false;

    isPlayerMaximized = _isPlayerMaximized;
  }

  module.exports.openMainWindow = openMainWindow;
  module.exports.togglePlayerState = togglePlayerState;

  function onResize(windowName) {
    if (isChangingMode)
      return;

    const bounds = windows[windowName].getBounds();
    const key = getConfigStoreWindow(isPlayerMaximized ? 'floatOnTop' : 'classic');
    configStore.set(key, bounds);
  }

  function onClosed(windowName) {
    // dereference the window
    windows[windowName] = null;
  }

  function getConfigStoreWindowKey() {
    return 'window.' + sortedDisplaysIds;
  }

  function getConfigStoreWindow(param) {
    return getConfigStoreWindowKey() + '.' + param;
  }
});
