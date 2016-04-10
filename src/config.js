module.exports = {

  // Client ID and client secret are available at
  // https://code.google.com/apis/console
  CREDENTIALS: {
    CLIENT_ID: 'YOUR CLIENT ID HERE',
    CLIENT_SECRET: 'YOUR CLIENT SECRET HERE'
  },

  // YouWatch need to open an HTTP server and a websocket server
  // Please choose a port you're not using inside another app
  // Don't forget to add it to the authorized origins
  // and authorized redirect URIs on the Google Console
  PORT: 9000,

  // The main window config
  MAIN_WINDOW: {
    WIDTH: 1200,
    HEIGHT: 700,
    IS_DEV_TOOLS_OPEN: false
  },

  // The auth window config
  AUTH_WINDOW: {
    WIDTH: 500,
    HEIGHT: 600,
    IS_DEV_TOOLS_OPEN: false
  }

};
