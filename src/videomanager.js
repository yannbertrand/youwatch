const async = require('async');
const _ = require('lodash');

const Providers = require('./providers');

module.exports = {

  refresh() {
    for (let providerName in Providers) {
      Providers[providerName].refresh((nbOfNewVideos) => {
        console.log('Added ' + nbOfNewVideos + ' video(s) to ' + providerName + ' provider');
      });
    }
  }

};  
