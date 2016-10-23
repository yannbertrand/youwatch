// eslint-disable-next-line no-undef
const Socket = io('http://localhost:@@PORT');

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
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
};