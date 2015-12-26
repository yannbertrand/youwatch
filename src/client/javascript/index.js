var socket = io('http://localhost:9000');

var btn = document.getElementById('open-auth-window');

var openAuthWindow = function (_btn) {
  _btn.toElement.innerHTML = 'Loading...';
  _btn.toElement.disabled = true;

  socket.emit('youtube/auth');
}

socket.on('youtube/callback', function () {
  document.getElementById('main').innerHTML = 'Connected to the YouTube API :-)';

  socket.emit('youtube/subscriptions');
});

btn.onclick = openAuthWindow;
