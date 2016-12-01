const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const _ = require('lodash');
const Config = require('electron-config');

const config = new Config('YouWatch');

app.on('ready', () => {
  const screen = electron.screen;

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
  let primaryDisplay;
  let sortedDisplaysIds;
  let onNumberOfDisplaysChangeHandler;

  function openMainWindow() {
    if (!windows[MAIN_WINDOW])
      windows[MAIN_WINDOW] = createMainWindow();
  }

  function createMainWindow() {
    onNumberOfDisplaysChange();

    const _window = new BrowserWindow({
      title: app.getName(),
      x: config.get(getConfigWindow('classic.x')),
      y: config.get(getConfigWindow('classic.y')),
      width: config.get(getConfigWindow('classic.width')),
      height: config.get(getConfigWindow('classic.height')),
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

    _window.on('resize', () => onResize(MAIN_WINDOW));
    _window.on('move', () => onResize(MAIN_WINDOW));
    _window.on('closed', () => onClosed(MAIN_WINDOW));

    screen.on('display-added', () => onNumberOfDisplaysChange(MAIN_WINDOW));
    screen.on('display-removed', () => onNumberOfDisplaysChange(MAIN_WINDOW));

    return _window;
  }

  function togglePlayerState(_isPlayerMaximized) {
    const bounds = config.get(getConfigWindow(_isPlayerMaximized ? 'floatOnTop' : 'classic'));

    isChangingMode = true;
    windows[MAIN_WINDOW].setBounds(bounds, true);
    isChangingMode = false;

    isPlayerMaximized = _isPlayerMaximized;
  }

  module.exports.openMainWindow = openMainWindow;
  module.exports.togglePlayerState = togglePlayerState;
  module.exports.setOnNumberOfDisplayChangeHandler = setOnNumberOfDisplayChangeHandler;

  function onResize(windowName) {
    if (isChangingMode || primaryDisplay.id !== screen.getPrimaryDisplay().id)
      return;

    const bounds = windows[windowName].getBounds();
    const key = getConfigWindow(isPlayerMaximized ? 'floatOnTop' : 'classic');
    config.set(key, bounds);
  }

  function onClosed(windowName) {
    // dereference the window
    windows[windowName] = null;
  }

  function onNumberOfDisplaysChange(windowName) {
    sortedDisplaysIds = screen.getAllDisplays().map((display) => display.id).sort().join('-');
    primaryDisplay = screen.getPrimaryDisplay();

    if (!config.get(getConfigWindowKey())) {
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

      config.set(getConfigWindowKey(), defaultConfig);
    }

    if (windows[windowName]) {
      const bounds = config.get(getConfigWindow(isPlayerMaximized ? 'floatOnTop' : 'classic'));
      windows[windowName].setBounds(bounds, true);
    }

    if (_.isFunction(onNumberOfDisplaysChangeHandler))
      onNumberOfDisplaysChangeHandler(sortedDisplaysIds);
  }

  function getConfigWindowKey() {
    return 'window.' + sortedDisplaysIds;
  }

  function getConfigWindow(param) {
    return getConfigWindowKey() + '.' + param;
  }

  function setOnNumberOfDisplayChangeHandler(handler) {
    onNumberOfDisplaysChangeHandler = handler;
    onNumberOfDisplaysChangeHandler(sortedDisplaysIds);
  }
});
