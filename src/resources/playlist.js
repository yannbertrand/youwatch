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
    findAllPlaylists,
    refreshPlaylists,
  };
};

function findAllPlaylists(cb) {
  db.find({ kind: 'youtube#playlist' }, cb);
}

function refreshPlaylists(channels, cb) {
  let pageToken = true;
  let newPlaylists = [];
  let updatedPlaylists = [];

  console.info('START: refreshPlaylists');

  async.each(channels, refreshChannelPlaylists, sendNewAndUpdatedPlaylists);



  function refreshChannelPlaylists(channel, nextChannel) {
    YouTube.playlists.list(concoctRequest(channel), gotPlaylists);

    function concoctRequest(channel) {
      return {
        part: 'id, snippet',
        channelId: channel.id,
        auth: oauth2Client,
      };
    }

    function gotPlaylists(err, playlists) {
      if (err) {
        console.error('Error while trying to get playlists of channel ' + channel.id, err);
        return nextChannel(err);
      }

      if (playlists && playlists.items && playlists.items.length) {
        upsertPlaylists(playlists.items, function (err, newChannelPlaylists, updatedChannelPlaylists) {
          if (newChannelPlaylists) {
            newPlaylists.push(...newChannelPlaylists);
          } else if (updatedChannelPlaylists) {
            updatedPlaylists.push(...updatedChannelPlaylists);
          }
          nextChannel();
        });
      } else {
        nextChannel();
      }
    }
  }

  function sendNewAndUpdatedPlaylists(err) {
    console.info('END: refreshPlaylists');
    cb(err, newPlaylists, updatedPlaylists);
  }
}

function upsertPlaylists(playlists, cb) {
  let someNewPlaylists = [];
  let someUpdatedPlaylists = [];

  console.info('START: upsertPlaylists');

  async.each(playlists, findPlaylist, sendNewAndUpdatedPlaylists);



  function findPlaylist(playlist, nextPlaylist) {
    let request = {
      kind: 'youtube#playlist',
      id: playlist.id,
    };

    db.findOne(request, gotPlaylist);

    function gotPlaylist(err, result) {
      if (err) {
        console.error(err);
        return pushCreatedPlaylist(err);
      }

      let dbPlaylist = {
        kind: 'youtube#playlist',
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        thumbnails: playlist.snippet.thumbnails,
      };

      if (!result) {
        db.insert(dbPlaylist, pushCreatedPlaylist);
      } else {
        let $set = {};

        if (result.title !== playlist.snippet.title)
          $set.title = playlist.snippet.title;
        if (result.description !== playlist.snippet.description)
          $set.description = playlist.snippet.description;
        if (JSON.stringify(result.thumbnails) !== JSON.stringify(playlist.snippet.thumbnails))
          $set.thumbnails = playlist.snippet.thumbnails;

        if (Object.keys($set).length) {
          db.update(request, { $set }, { upsert: true }, pushUpdatedPlaylist);
        } else {
          pushCreatedPlaylist();
        }
      }

      function pushCreatedPlaylist(err, playlist) {
        someNewPlaylists.push(playlist);
        nextPlaylist(err);
      }

      function pushUpdatedPlaylist(err, playlist) {
        someUpdatedPlaylists.push(playlist);
        nextPlaylist(err);
      }
    }
  }

  function sendNewAndUpdatedPlaylists(err) {
    console.info('END: upsertPlaylists');
    return cb (err, someNewPlaylists, someUpdatedPlaylists);
  }
}

