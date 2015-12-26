var credentials = require('./credentials');

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;

const REDIRECT_URL = 'http://localhost:9000/youtube/callback';
const oauth2Client = new OAuth2Client(credentials.CLIENT_ID, credentials.CLIENT_SECRET, REDIRECT_URL);

// retrieve the auth page url
module.exports.getAuthUrl = function (cb) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://www.googleapis.com/auth/youtube.readonly' // can be a space-delimited string or an array of scopes
  });

  return cb(url);
};

// retrieve an access token
module.exports.getToken = function (code, cb) {
  // request access token
  oauth2Client.getToken(code, function(err, token) {
    cb(token);
  });
};
