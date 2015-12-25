var readline = require('readline');
var credentials = require('./credentials');

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var plus = google.plus('v1');

var oauth2Client = new OAuth2Client(credentials.CLIENT_ID, credentials.CLIENT_SECRET, credentials.REDIRECT_URL);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getAuthUrl(oauth2Client, cb) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://www.googleapis.com/auth/plus.me' // can be a space-delimited string or an array of scopes
  });

  return cb(url);
}

function getToken(oauth2Client, code, cb) {
  // request access token
  oauth2Client.getToken(code, function(err, tokens) {
    // set tokens to the client
    oauth2Client.setCredentials(tokens);
    cb();
  });
}

// retrieve an access token
module.exports.getAuthUrl = function (cb) {
  getAuthUrl(oauth2Client, cb);
};

module.exports.getToken = function (code, cb) {
  getToken(oauth2Client, code, cb);
};

module.exports.getPlusPeople = function (cb) {
  plus.people.get({ userId: 'me', auth: oauth2Client }, cb);
};
