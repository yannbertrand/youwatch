let BrowserWindow;
let CONFIG;

module.exports = function (electron, _CONFIG) {
  BrowserWindow = electron.BrowserWindow;
  CONFIG = _CONFIG;

  return {
    openMainWindow,
    openLogInWindow,
    closeLogInWindow,
    activateWithNoOpenWindows,
  };
};

const MAIN_WINDOW = 'main';
const AUTH_WINDOW = 'auth';

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

function createWindow(windowName, url, width, height, isDevToolsOpen) {
  const win = new BrowserWindow({ width, height });

  win.loadURL(url);
  win.on('closed', onClosed.bind(null, windowName));
  win.on('enter-html-full-screen', (event) => {
    // tmp
    // This event is called when the YouTube player goes fullscreen
    // It should only fullscreen the webview, but it does fullscreen the app
    setTimeout(function () {
      win.setFullScreen(false);
    }, 1000);
  });

  win.setMinimumSize(780, 270);
  if (isDevToolsOpen) win.openDevTools();

  return win;
}

function createMainWindow() {
  const url = 'file://' + __dirname + '/client/index.html';

  return createWindow(
    MAIN_WINDOW,
    url,
    CONFIG.MAIN_WINDOW.WIDTH,
    CONFIG.MAIN_WINDOW.HEIGHT,
    CONFIG.MAIN_WINDOW.IS_DEV_TOOLS_OPEN
  );
}

function createLogInWindow(url) {
  return createWindow(
    AUTH_WINDOW,
    url,
    CONFIG.AUTH_WINDOW.WIDTH,
    CONFIG.AUTH_WINDOW.HEIGHT,
    CONFIG.AUTH_WINDOW.IS_DEV_TOOLS_OPEN
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
