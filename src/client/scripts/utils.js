const Config = require('electron-config');

// eslint-disable-next-line no-undef
const Socket = io('http://localhost:@@PORT');

const config = new Config('YouWatch');
let sortedDisplaysIds;

Socket.on('number-of-display/update', onNumberOfDisplayChange);

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
}

function onNumberOfDisplayChange(_sortedDisplaysIds) {
  sortedDisplaysIds = _sortedDisplaysIds;

  if (!config.get('window.' + sortedDisplaysIds + '.preferedMode'))
    config.set('window.' + sortedDisplaysIds + '.preferedMode', false);
}

function getMode() {
  return config.get('window.' + sortedDisplaysIds + '.preferedMode');
}

function toggleMode() {
  config.set('window.' + sortedDisplaysIds + '.preferedMode', !getMode());
  return getMode();
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
  isDarkThemeActive,
  getActiveLayout,
  castBooleanToString,
  getMode,
  toggleMode,
};
