let playlist = [];
playlist.concoctVideoIds = concoctPlaylistVideoIds;
playlist.remove = removeVideoFromPlaylist;
playlist.contains = isVideoInPlaylist;
playlist.playNow = playVideoNow;
playlist.setNext = setNextVideoInPlaylist;

module.exports = playlist;

// === _.pluck(playlist, 'id')
function concoctPlaylistVideoIds() {
  let playlistVideosIds = [];

  for (let video of playlist)
    playlistVideosIds.push(video.id);

  return playlistVideosIds;
}

function removeVideoFromPlaylist(videoId) {
  if (!playlist.contains(videoId)) return;

  playlist.splice(playlist.concoctVideoIds().indexOf(videoId), 1);
}

function isVideoInPlaylist(videoId) {
  return ~concoctPlaylistVideoIds().indexOf(videoId);
}

function playVideoNow(video) {
  if (playlist.contains(video.id))
    playlist.remove(video.id);
  playlist.splice(0, 0, video);
}

function setNextVideoInPlaylist(video) {
  if (playlist.length)
    playlist.splice(1, 0, video);
  else
    playlist.push(video);
}
