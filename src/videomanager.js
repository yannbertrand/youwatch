const Providers = require('./providers');

module.exports = {

  refresh() {
    for (const providerName in Providers) {
      if ({}.hasOwnProperty.call(Providers, providerName)) {
        Providers[providerName].refresh((nbOfNewVideos) => {
          console.log('Added ' + nbOfNewVideos + ' video(s) to ' + providerName + ' provider');
        });
      }
    }
  },

};
