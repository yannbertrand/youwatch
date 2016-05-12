/**
 * Collections
 */

const User = {

  identity: 'user',
  connection: 'YouWatch',

  attributes: {

    accessToken: {
      type: 'string',
    },

    tokenType: {
      type: 'string',
    },

    expiryDate: {
      type: 'string',
    },

    refreshToken: {
      type: 'string',
    },

  },

};

const Configuration = {

  identity: 'configuration',
  connection: 'YouWatch',

  attributes: {
    
  },

};
 
const Channel = {

  identity: 'channel',
  connection: 'YouWatch',

  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      required: true,
      unique: true,
    },

    title: {
      type: 'string',
      required: true,
    },

    playlists: {
      collection: 'playlist',
      via: 'channel',
    },

  },

};

const Playlist = {

  identity: 'playlist',
  connection: 'YouWatch',

  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      required: true,
      unique: true,
    },

    channel: {
      model: 'channel',
      required: true,
    },

    playlistItems: {
      collection: 'playlist-item',
      via: 'playlist',
    },

  },

};

const PlaylistItem = {

  identity: 'playlist-item',
  connection: 'YouWatch',

  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      required: true,
      unique: true,
    },

    playlist: {
      model: 'playlist',
      required: true,
    },

    video: {
      model: 'video',
    },

  },

};

const Video = {

  identity: 'video',
  connection: 'YouWatch',

  attributes: {

    id: {
      type: 'string',
      primaryKey: true,
      required: true,
      unique: true,
    },

    duration: {
      type: 'string',
      required: true,
    },

    thumbnail: {
      type: 'string',
      required: true,
    },

    title: {
      type: 'string',
      required: true,
    },

    publishedAt: {
      type: 'datetime',
      required: true,
    },

    seen: {
      type: 'boolean',
      required: true,
      defaultsTo: false
    },

    playlistItem: {
      model: 'playlist-item',
      required: true,
    },

  },

};
