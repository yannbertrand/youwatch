const { ipcRenderer, screen } = require('electron');
const Config = require('electron-config');

// eslint-disable-next-line no-undef
const Socket = ipcRenderer;

const config = new Config('YouWatch');
const FULLSCREEN = 'fullscreen';
const FLOAT_ON_TOP = 'float-on-top';

let sortedDisplaysIds;
let preferredMode;

onNumberOfDisplayChange();

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
}

function getConfigKey() {
  return 'window.' + sortedDisplaysIds + '.preferredMode';
}

function onNumberOfDisplayChange() {
  sortedDisplaysIds = screen.getAllDisplays().map((display) => display.id).sort().join('-');

  preferredMode = config.get(getConfigKey());
  if (!preferredMode) {
    preferredMode = FULLSCREEN;
    config.set(getConfigKey(), preferredMode);
  }
}

function getPreferredMode() {
  return preferredMode;
}

function isFullScreenPreferredMode() {
  return getPreferredMode() === FULLSCREEN;
}

function isFloatOnTopPreferredMode() {
  return getPreferredMode() === FLOAT_ON_TOP;
}

function togglePreferredMode() {
  preferredMode = isFullScreenPreferredMode() ? FLOAT_ON_TOP : FULLSCREEN;

  config.set(getConfigKey(), preferredMode);
}

function getActiveLayout() {
  if (document.body.classList.contains('layout-overlay'))
    return 'overlay';
  if (document.body.classList.contains('layout-sticker'))
    return 'sticker';

  return 'youtube';
}

function castBooleanToString(boolean) {
  return boolean ? '1' : '0';
}

module.exports = {
  Socket,
  screen,
  isDarkThemeActive,
  getActiveLayout,
  castBooleanToString,
  isFullScreenPreferredMode,
  isFloatOnTopPreferredMode,
  togglePreferredMode,
};
