const credentials = require('./credentials');
const Configstore = require('configstore');

const google = require('googleapis');
const OAuth2Client = google.auth.OAuth2;

const REDIRECT_URL = 'http://localhost:9000/youtube/callback';
const oauth2Client = new OAuth2Client(credentials.CLIENT_ID, credentials.CLIENT_SECRET, REDIRECT_URL);

const conf = new Configstore('Youtube');

// Check if the stored access token (if existing) is still working
module.exports.tryStoredAccessToken = function (cb) {
  if(!conf.get('tokens')) {
    return cb(true);
  }

  oauth2Client.setCredentials(conf.get('tokens'));

  google.youtube('v3').subscriptions.list({
    part: 'id',
    mine: true,
    auth: oauth2Client
  }, function (err, response) {
    if (err) return cb(true);

    // Refresh the access token
    oauth2Client.refreshAccessToken(function (err, newTokens) {
      if (err) return cb(true);

      conf.set('tokens', newTokens);

      return cb(false, newTokens);
    });
  });
};

// retrieve the auth page url
module.exports.getAuthUrl = function (cb) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    // approval_prompt : 'force',
    scope: 'https://www.googleapis.com/auth/youtube.readonly' // can be a space-delimited string or an array of scopes
  });

  return cb(url);
};

// retrieve an access token
module.exports.getToken = function (code, cb) {
  // request access token
  oauth2Client.getToken(code, function(err, tokens) {
    if (!err) {
      conf.set('tokens', tokens);
      cb(tokens);
    }
  });
};
