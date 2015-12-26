var socket = io('http://localhost:9000');

var btn = document.getElementById('open-auth-window');
var status = document.getElementById('status');

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
  main.innerHTML = '<h1>Connected to the YouTube API :-)</h1>5 subscriptions:<br />';

  gapi.auth.setToken(token);
  gapi.client.load('youtube', 'v3', function () {
    // Retrieve user's subscriptions
    gapi.client.youtube.subscriptions.list({
      part: 'id, snippet',
      mine: true
    }).execute(function (subscriptions) {
      main.innerHTML = main.innerHTML + '<ul>';

      subscriptions.items.forEach(function (subscription) {
        main.innerHTML = main.innerHTML + '<li>' + subscription.snippet.title + '</li>';
      });

      main.innerHTML = main.innerHTML + '</ul>';
    });
  });
});

btn.onclick = openAuthWindow;
