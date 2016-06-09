let async;
let YouTube;
let oauth2Client;
let db;

module.exports = function (_async, _YouTube, _oauth2Client, _db) {
  async = _async;
  YouTube = _YouTube;
  oauth2Client = _oauth2Client;
  db = _db;

  return {
    findAllPlaylistItems,
    refreshPlaylistItems,
  };
};

function findAllPlaylistItems(cb) {
  db.find({ kind: 'youtube#playlistItem' }, cb);
}

function refreshPlaylistItems(channels, cb) {
 cb(null, 'ToDo');
}
