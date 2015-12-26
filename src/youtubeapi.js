const credentials = require('./credentials');
const Configstore = require('configstore');

const google = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

const REDIRECT_URL = 'http://localhost:9000/youtube/callback';
const oauth2Client = new OAuth2Client(credentials.CLIENT_ID, credentials.CLIENT_SECRET, REDIRECT_URL);

const conf = new Configstore('Youtube');

// Check if the stored access token (if existing) is still working
module.exports.tryStoredAccessToken = function (cb) {
  if(!conf.get('token')) {
    return cb(true);
  }

  oauth2Client.setCredentials(conf.get('token'));

  google.youtube('v3').subscriptions.list({
    part: 'id',
    mine: true,
    auth: oauth2Client
  }, function (err, response) {
    if (err) return cb(true);

    return cb(false, conf.get('token'));
  });
};

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
    conf.set('token', token);
    cb(token);
  });
};
