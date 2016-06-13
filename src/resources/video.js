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
    findAllVideos,
    refreshVideos,
  };
};

function findAllVideos(cb) {
  db.find({ kind: 'youtube#video' }, cb);
}

function refreshVideos(playlistItems, callback) {
  let createdVideos = [];
  let videosIds = constructVideosIds(playlistItems);

  // console.info('START: refreshVideos');

  async.each(playlistItems, refreshPlaylistVideos, sendNewVideos);

  function refreshPlaylistVideos(videosIds, nextVideosIdsList) {
    YouTube.videos.list(concoctRequest(videosIds), handleError(gotVideos, callback));

    function gotVideos(videos) {
      if (videos && videos.items && videos.items.length) {
        upsertVideos(videos.items, handleError(upsertedVideo, callback));
      } else {
        nextVideosIdsList();
      }
    }

    function upsertedVideo(someCreatedVideos) {
      if (someCreatedVideos)
        createdVideos.push(...someCreatedVideos);

      nextVideosIdsList();
    }
  }

  function sendNewVideos(err) {
    // console.info('END: refreshVideos');
    callback(err, createdVideos);
  }
}

function constructVideosIds(playlistItems) {
  let counter = 0;
  let idList = [];
  let currentIds = '';

  for (let playlistItem of playlistItems) {
    currentIds += (counter? ', ' : '') + playlistItem.videoId;

    if (++counter === 50) {
      idList.push(currentIds);
      currentIds = '';
      counter = 0;
    }
  }

  if (counter) idList.push(currentIds);

  return idList;
}

function concoctRequest(videosIds) {
  return {
    part: 'id, snippet, contentDetails',
    id: videosIds,
    maxResults: 50,
    auth: oauth2Client,
  };
}

function upsertVideos(videos, callback) {
  let someCreatedVideos = [];

  // console.info('START: upsertVideos');

  let $or = videos.map(video => {
    return { id: video.id };
  });

  db.find({
    kind: 'youtube#video',
    $or: $or,
  }, handleError(gotVideos, callback));

  function gotVideos(results) {
    createUnexistingVideos(sendNewVideos);

    function createUnexistingVideos(done) {
      if (results.length >= videos.length) return done();

      let resultsIds = results.map(result => result.id);
      let unexistingVideos = videos
        .filter(video => !resultsIds.includes(video.id))
        .map(video => {
          return {
            kind: 'youtube#video',
            id: video.id,
            duration: iso8601ToStringDuration(video.contentDetails.duration),
            thumbnail: video.snippet.thumbnails.medium.url,
            title: video.snippet.title,
            channel: video.snippet.channelTitle,
            publishedAt: new Date(video.snippet.publishedAt),
          };
        });

      db.insert(unexistingVideos, handleError(pushCreatedVideos, callback));

      function pushCreatedVideos(createdVideos) {
        someCreatedVideos.push(...createdVideos);
        return done();
      }
    }

    function sendNewVideos(err) {
      // console.info('END: upsertVideos');
      return callback(err, someCreatedVideos);
    }
  }
}

function handleError(next, callback) {
  return function (err) {
    if (err) {
      console.error(err);
      return callback(err);
    }

    let _arguments = Array.prototype.slice.call(arguments, 1);
    next.apply(null, _arguments);
  };
}

function iso8601ToStringDuration(rawDuration) {
  return constructDurationString(parse(rawDuration));

  // From ISO8601-duration npm
  // https://github.com/tolu/ISO8601-duration/blob/master/src/index.js
  function parse(durationString) {
    const numbers = '\\d+(?:[\\.,]\\d{0,3})?';
    const weekPattern = `(${numbers}W)`;
    const datePattern = `(${numbers}Y)?(${numbers}M)?(${numbers}D)?`;
    const timePattern = `T(${numbers}H)?(${numbers}M)?(${numbers}S)?`;

    const iso8601 = `P(?:${weekPattern}|${datePattern}(?:${timePattern})?)`;
    const pattern = new RegExp(iso8601);
    const objMap = ['weeks', 'years', 'months', 'days', 'hours', 'minutes', 'seconds'];

    return durationString.match(pattern).slice(1).reduce((prev, next, idx) => {
      prev[objMap[idx]] = parseFloat(next) || 0;
      return prev;
    }, {});
  }

  function constructDurationString(durationObject) {
    let duration = '';
    let flag = false;

    if (flag || durationObject.hours) {
      duration += leftpad(durationObject.hours) + ':';
      flag = true;
    }

    if (flag || durationObject.minutes) {
      duration += leftpad(durationObject.minutes) + ':';
    } else {
      duration += '0:';
    }

    duration += leftpad(durationObject.seconds, 2, 0);

    return duration;
  }

  // The famous npm leftpad module-function
  // https://github.com/camwest/left-pad/blob/master/index.js
  function leftpad(str, len, ch) {
    str = String(str);

    var i = -1;

    if (!ch && ch !== 0) ch = ' ';

    len = len - str.length;

    while (++i < len) {
      str = ch + str;
    }

    return str;
  }
}

