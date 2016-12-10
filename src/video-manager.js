'use strict';

const { app, ipcMain } = require('electron');
const fs = require('fs');
const _ = require('lodash');
const Config = require('electron-config');

const config = new Config('YouWatch');

const Providers = [];

module.exports = (() => {

  function init(callback) {
    hydrateProviders((err) => {
      if (err) {
        console.error(err);
      }

      const options = { config, app, ipcMain };

      Providers.forEach((provider) => {
        provider.init((err) => {
          if (err) {
            console.error(err);
          }

          callback(err);
        }, options);
      });
    });
  }

  function getVideos(callback) {
    Providers.forEach((provider) => {
      provider.getVideos((err, videos) => {
        if (err) {
          console.error(err);
        }

        callback(err, videos);
      });
    });
  }

  return {
    init,
    getVideos,
  };

})();

function hydrateProviders(callback) {
  const nodeModules = require('path').join(__dirname, '..', 'node_modules');

  const youwatchProviderRegex = /^youwatch-\w+-provider$/;
  fs.readdir(nodeModules, (err, files) => {
    files.forEach((file) => {
      if (file.match(youwatchProviderRegex)) {
        // eslint-disable-next-line import/no-dynamic-require
        Providers.push(require(file));
      }
    });

    callback(err);
  });
}
