var socket = io('http://localhost:9000');

var btn = document.getElementById('open-auth-window');
var status = document.getElementById('status');

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

var addSubscriptionsToList = function (elem, subscriptions) {
  subscriptions.items.forEach(function (subscription) {
    elem.innerHTML = elem.innerHTML + '<li>' + subscription.snippet.title + '</li>';
  });
};

var constructPageSubscriptionsList = function (elem, page) {
  addSubscriptionsToList(elem, page);

  if (page.nextPageToken) {
    getASubscriptionsPage(page.nextPageToken, function (nextPage) {
      constructPageSubscriptionsList(elem, nextPage);
    });
  }
};

var constructSubscriptionsList = function (elem) {
  elem.innerHTML += '<ul>';
  getASubscriptionsPage(null, function (nextPage) {
    constructPageSubscriptionsList(elem, nextPage);
  });
  elem.innerHTML += '</ul>';
};

var openAuthWindow = function (_btn) {
  _btn.toElement.disabled = true;

  status.innerHTML = 'Loading...';

  socket.emit('youtube/auth');
}

socket.on('youtube/asked', function () {
  status.innerHTML = 'Waiting for YouTube response...';
});

socket.on('youtube/waitingforuser', function () {
  status.innerHTML = 'Please fill in the required informations in the other window';
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

btn.onclick = openAuthWindow;
