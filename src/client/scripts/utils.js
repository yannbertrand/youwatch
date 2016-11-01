// eslint-disable-next-line no-undef
const Socket = io('http://localhost:@@PORT');

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
}

function getMode() {
  return castStringToBoolean(localStorage.getItem('mode'));
}

function toggleMode() {
  localStorage.setItem('mode', castBooleanToString(!getMode()));
  Socket.emit('config/mode', !getMode());
  return getMode();
}

function getActiveLayout() {
  if (document.body.classList.contains('layout-overlay'))
    return 'overlay';
  if (document.body.classList.contains('layout-sticker'))
    return 'sticker';

  return 'youtube';
}

function castStringToBoolean(string) {
  return string === '1';
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
