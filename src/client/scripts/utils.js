const Configstore = require('configstore');

// eslint-disable-next-line no-undef
const Socket = io('http://localhost:@@PORT');

const configStore = new Configstore('YouWatch');
let sortedDisplaysIds;

Socket.on('number-of-display/update', onNumberOfDisplayChange);

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
}

function onNumberOfDisplayChange(_sortedDisplaysIds) {
  sortedDisplaysIds = _sortedDisplaysIds;

  if (!configStore.get('window.' + sortedDisplaysIds + '.preferedMode'))
    configStore.set('window.' + sortedDisplaysIds + '.preferedMode', false);
}

function getMode() {
  return configStore.get('window.' + sortedDisplaysIds + '.preferedMode');
}

function toggleMode() {
  configStore.set('window.' + sortedDisplaysIds + '.preferedMode', !getMode());
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
