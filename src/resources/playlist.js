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
  let deletedPlaylists = [];

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
        upsertPlaylists(playlists.items, function (err, createdChannelPlaylists, updatedChannelPlaylists, deletedChannelPlaylists) {
          if (createdChannelPlaylists) {
            newPlaylists.push(...createdChannelPlaylists);
          }
          if (updatedChannelPlaylists) {
            updatedPlaylists.push(...updatedChannelPlaylists);
          }
          if (deletedChannelPlaylists) {
            deletedPlaylists.push(...deletedChannelPlaylists);
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
    cb(err, newPlaylists, updatedPlaylists, deletedPlaylists);
  }
}

function upsertPlaylists(playlists, cb) {
  let createdChannelPlaylists = [];
  let updatedChannelPlaylists = [];
  let deletedChannelPlaylists = [];

  console.info('START: upsertPlaylists');

  let $or = playlists.map(playlist => {
    return {
      id: playlist.id
    };
  });

  db.find({
    kind: 'youtube#playlist',
    $or: $or,
  }, gotPlaylists);

  function gotPlaylists(err, results) {
    if (err) {
      console.error(err);
      return sendNewAndUpdatedPlaylists(err);
    }

    async.parallel([
      createUnexistingPlaylists,
      updateExistingPlaylists,
      deletePlaylists,
    ], sendNewAndUpdatedPlaylists);

    function createUnexistingPlaylists(done) {
      if (results.length >= playlists.length) return done();

      let resultsIds = results.map(result => result.id);
      let unexistingPlaylists = playlists.filter(playlist => !resultsIds.includes(playlist.id));

      unexistingPlaylists = unexistingPlaylists.map(playlist => {
        return {
          kind: 'youtube#playlist',
          id: playlist.id,
          channelId: playlist.snippet.channelId,
          title: playlist.snippet.title,
          description: playlist.snippet.description,
          thumbnails: playlist.snippet.thumbnails,
        };
      });

      db.insert(unexistingPlaylists, pushCreatedPlaylists);

      function pushCreatedPlaylists(err, createdPlaylists) {
        createdChannelPlaylists.push(...createdPlaylists);
        return done(err);
      }
    }

    function updateExistingPlaylists(done) {
      async.each(results, updatePlaylist, pushUpdatedPlaylists);

      function updatePlaylist(result, nextResult) {
        let correspondingPlaylist = playlists.filter(playlist => playlist.id === result.id)[0];

        let $set = {};

        if (result.title !== correspondingPlaylist.snippet.title)
          $set.title = correspondingPlaylist.snippet.title;
        if (result.description !== correspondingPlaylist.snippet.description)
          $set.description = correspondingPlaylist.snippet.description;
        if (JSON.stringify(result.thumbnails) !== JSON.stringify(correspondingPlaylist.snippet.thumbnails))
          $set.thumbnails = correspondingPlaylist.snippet.thumbnails;

        if (Object.keys($set).length) {
          db.update({
            kind: 'youtube#playlist',
            id: result.id,
          }, { $set }, { upsert: true }, pushUpdatedPlaylist);
        } else {
          nextResult();
        }

        function pushUpdatedPlaylist(err, updatedPlaylist) {
          updatedChannelPlaylists.push(updatedPlaylist);
          nextResult(err);
        }
      }

      function pushUpdatedPlaylists(err) {
        return done(err);
      }
    }

    function deletePlaylists(done) {
      if (results.length <= playlists.length) return done();

      let playlistsIds = playlists.map(playlist => playlist.id);
      let deletedPlaylists = results
        .filter(result => !playlistsIds.includes(result.id))
        .map(deletedResult => { return { id: deletedResult.id }; });

      db.remove(deletedPlaylists, { multi: true }, pushDeletedPlaylists);

      function pushDeletedPlaylists(err, deletedPlaylists) {
        deletedChannelPlaylists.push(...deletedPlaylists);
        return done(err);
      }
    }

    function sendNewAndUpdatedPlaylists(err) {
      console.info('END: upsertPlaylists');
      return cb(err, createdChannelPlaylists, updatedChannelPlaylists, deletedChannelPlaylists);
    }
  }
}

