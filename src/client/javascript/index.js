var socket = io('http://localhost:9000');


var getASubscriptionsPage = function (pageToken, cb) {
  var params = {
    part: 'id, snippet',
    mine: true,
    maxResults: 50,
    order: 'alphabetical'
  };

  if (pageToken)
    params.pageToken = pageToken;

  gapi.client.youtube
    .subscriptions.list(params)
    .execute(cb);
};

var getChannelDetails = (channelId, cb) => {
  var params = {
    part: 'id, contentDetails',
    id: channelId
  };

  gapi.client.youtube
    .channels.list(params)
    .execute(cb);
};

var getLastUploadedVideos = function (playlistId, cb) {
  var params = {
    part: 'id, snippet',
    playlistId: playlistId
  };

  gapi.client.youtube
    .playlistItems.list(params)
    .execute(cb);
};

var addSubscriptionToList = function (elem, subscription, uploads) {
  var li = document.createElement('li');
  var strong = document.createElement('strong');
  var channelTitle = document.createTextNode(subscription.snippet.title);

  strong.appendChild(channelTitle);
  li.appendChild(strong);
  if (uploads.items.length) {
    var ul = document.createElement('ul');
    var li2;
    var videoTitle;
    uploads.items.forEach((upload) => {
      li2 = document.createElement('li');
      videoTitle = document.createTextNode(upload.snippet.title);
      li2.appendChild(videoTitle);
      ul.appendChild(li2);
    });
    li.appendChild(ul);
  }
  elem.appendChild(li);
};

var constructPageSubscriptionsList = function (elem, page) {
  page.items.forEach(function (subscription) {
    ((subscription) => {
      getChannelDetails(subscription.snippet.resourceId.channelId, (channel) => {
        if (channel.pageInfo.totalResults > 0) {
          getLastUploadedVideos(channel.items[0].contentDetails.relatedPlaylists.uploads, (uploads) => {
            addSubscriptionToList(elem, subscription, uploads);
          });
        }
      });
    })(subscription);
  });

  if (page.nextPageToken) {
    getASubscriptionsPage(page.nextPageToken, function (nextPage) {
      constructPageSubscriptionsList(elem, nextPage);
    });
  }
};

var constructSubscriptionsList = function (elem) {
  var ul = document.createElement('ul');
  getASubscriptionsPage(null, function (nextPage) {
    constructPageSubscriptionsList(ul, nextPage);
  });
  elem.appendChild(ul);
};

var openAuthWindow = function (_btn) {
  _btn.toElement.disabled = true;

  document.getElementById('status').innerHTML = 'Loading...';

  socket.emit('youtube/auth');
}

socket.on('youtube/notauthenticated', function () {
  main.innerHTML = '<button id="open-auth-window" class="btn btn-primary btn-lg">Connect</button><br>';
  main.innerHTML += '<span id="status"></span>';

  document.getElementById('open-auth-window').onclick = openAuthWindow;
});

socket.on('youtube/asked', function () {
  document.getElementById('status').innerHTML = 'Waiting for YouTube response...';
});

socket.on('youtube/waitingforuser', function () {
  document.getElementById('status').innerHTML = 'Please fill in the required informations in the other window';
});

socket.on('youtube/callback', function (token) {
  var main = document.getElementById('main');
  main.innerHTML = '<h1>Connected to the YouTube API :-)</h1>';
  main.innerHTML += 'Your subscriptions:<br />';

  gapi.auth.setToken(token);
  gapi.client.load('youtube', 'v3', function () {
    // Retrieve user's subscriptions
    constructSubscriptionsList(main);
  });
});


