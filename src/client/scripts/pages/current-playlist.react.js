const { remote } = require('electron');
const React = require('react');
const _ = require('lodash');

const Utils = require('../utils');

let isPlaylistPlaying = false;

const Player = React.createClass({
  propTypes: {
    playlist: React.PropTypes.array.isRequired,
  },
  getInitialState() {
    return {
      playlist: [],
      player: null,
      isReplayingVideo: false,
    };
  },
  onStateChange(event) {
    if (event.data === YT.PlayerState.UNSTARTED) return;
    if (event.data === YT.PlayerState.CUED) return;

    if (event.data === YT.PlayerState.ENDED) {
      if (this.state.isReplayingVideo)
        this.state.player.loadVideoById(this.state.playlist[0]);
      else if (this.isVideoEnded()) {
        window.dispatchEvent(new CustomEvent('playlist.endVideo', { detail: { video: this.state.playlist[0] } }));

        this.removeVideo();
      }
    } else {
      isPlaylistPlaying = true;
    }
  },
  removeVideo() {
    // No more video to play
    // (1 because we will remove the played video)
    if (this.state.playlist.length === 1)
      isPlaylistPlaying = false;

    // Remove last played video
    window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.state.playlist[0] } }));
  },
  updatePlaylist(forceNextVideo) {
    // ToDo gérer anciennes vidéos
    if (this.state.playlist.length === 0) return;

    const statesThatNeedCue = [
      YT.PlayerState.CUED,
    ];

    const playerState = this.state.player.getPlayerState();

    if (statesThatNeedCue.indexOf(playerState) > -1) {
      this.state.player.cueVideoById(this.state.playlist[0]);
    } else if (forceNextVideo) {
      this.state.player.loadVideoById(this.state.playlist[0]);
    }
  },
  componentWillReceiveProps(nextProps) {
    let updatePlaylist;
    if (this.state.playlist[0] === nextProps.playlist[0]) {
      updatePlaylist = this.updatePlaylist.bind(null, false);
    } else {
      updatePlaylist = this.updatePlaylist.bind(null, true);
    }

    this.setState({
      playlist: nextProps.playlist,
    }, updatePlaylist);
  },
  isFullScreen() {
    return Boolean(document.querySelector('#player:-webkit-full-screen'));
  },
  onWebkitFullScreenChange() {
    const isFullScreen = this.isFullScreen();

    if (isFullScreen) {
      document.body.classList.add('fullscreen');
      this.state.currentWindow.setMinimumSize(160, 90);
    } else {
      document.body.classList.remove('fullscreen');
      this.state.currentWindow.setMinimumSize(880, 370);
    }

    this.state.currentWindow.setAlwaysOnTop(isFullScreen);
    this.state.currentWindow.setHasShadow(!isFullScreen);
    this.state.currentWindow.setVisibleOnAllWorkspaces(isFullScreen);
  },
  componentDidMount() {
    window.addEventListener('player.playNextVideo', this.playNextVideo);
    window.addEventListener('player.replayCurrentVideo', this.replayCurrentVideo);
    window.addEventListener('player.stopReplayCurrentVideo', this.stopReplayCurrentVideo);
    window.addEventListener('numberOfDisplays.update', this.updatePreferredMode);

    document.addEventListener('webkitfullscreenchange', this.onWebkitFullScreenChange);

    this.setState({
      currentWindow: remote.getCurrentWindow(),
      playlist: this.state.playlist,
      isReplayingVideo: this.state.isReplayingVideo,

      // YT may not be loaded at this time, need to find a solution...
      // That's probably why I can't put this in a getInitialState method
      player: new YT.Player('player', {
        width: 480,
        height: 270,
        events: {
          onStateChange: this.onStateChange,
        },
      }),
    }, this.updatePreferredMode);
  },
  componentWillUnmount() {
    document.removeEventListener('webkitfullscreenchange', this.onWebkitFullScreenChange);

    window.removeEventListener('player.playNextVideo', this.playNextVideo);
    window.removeEventListener('player.replayCurrentVideo', this.replayCurrentVideo);
    window.removeEventListener('player.stopReplayCurrentVideo', this.stopReplayCurrentVideo);
    window.removeEventListener('numberOfDisplays.update', this.updatePreferredMode);
  },
  playNextVideo() {
    this.removeVideo();
  },
  replayCurrentVideo() {
    this.setState({
      isReplayingVideo: true,
      playlist: this.state.playlist,
      player: this.state.player,
    });
  },
  stopReplayCurrentVideo() {
    this.setState({
      isReplayingVideo: false,
      playlist: this.state.playlist,
      player: this.state.player,
    });
  },
  isVideoEnded() {
    return this.state.player.getCurrentTime() === this.state.player.getDuration();
  },
  updatePreferredMode() {
    this.state.currentWindow.setFullScreenable(Utils.isFullScreenPreferredMode());
  },
  render() {
    return <div id="player" />;
  },
});

const PlaylistItem = React.createClass({
  propTypes: {
    id: React.PropTypes.string.isRequired,
    title: React.PropTypes.string.isRequired,
    channel: React.PropTypes.string.isRequired,
  },
  raise() {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.raiseVideo', { detail: { video: this.props } }));
    }
  },
  remove() {
    if (this.props.id) {
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.props } }));
    }
  },
  render() {
    return (
      <div className="playlist-item">
        <a
          className="playlist-item--remove"
          onClick={this.remove}
          title="Remove this video from the list"
        >
          &times;
        </a>

        <a className="playlist-item--title" onClick={this.raise} title={this.props.title}>
          {this.props.title}
        </a>

        <p className="playlist-item--channel">
          {this.props.channel}
        </p>
      </div>
    );
  },
});

const Playlist = React.createClass({
  propTypes: {
    videos: React.PropTypes.array.isRequired,
  },
  render() {
    const videos = [];
    for (const video of this.props.videos) {
      videos.push(
        <PlaylistItem
          key={video.id}
          id={video.id}
          thumbnail={video.thumbnail}
          title={video.title}
          channel={video.channel}
        />
      );
    }

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  },
});

const Controls = React.createClass({
  propTypes: {
    numberOfPlayedVideos: React.PropTypes.number.isRequired,
    numberOfVideos: React.PropTypes.number.isRequired,
  },
  getInitialState() {
    return { isReplayingVideo: false };
  },
  replayCurrentVideo() {
    this.setState({ isReplayingVideo: true });

    window.dispatchEvent(new CustomEvent('player.replayCurrentVideo'));
  },
  stopReplayCurrentVideo() {
    this.setState({ isReplayingVideo: false });

    window.dispatchEvent(new CustomEvent('player.stopReplayCurrentVideo'));
  },
  isPreviousVideoDisabled() {
    return this.props.numberOfPlayedVideos === 0;
  },
  playPreviousVideo() {
    window.dispatchEvent(new CustomEvent('playlist.playPreviousVideo'));
  },
  isNextVideoDisabled() {
    return this.props.numberOfVideos <= 1;
  },
  playNextVideo() {
    window.dispatchEvent(new CustomEvent('player.playNextVideo'));
  },
  togglePlaylistVisibility() {
    window.dispatchEvent(new CustomEvent('playlist.togglePlaylistVisibility'));
  },
  render() {
    let replayVideoButton;
    if (this.state.isReplayingVideo) {
      replayVideoButton = <button className="btn" onClick={this.stopReplayCurrentVideo}><i className="fa fa-repeat fa-spin" /></button>;
    } else {
      replayVideoButton = <button className="btn" onClick={this.replayCurrentVideo}><i className="fa fa-repeat" /></button>;
    }

    return (
      <div id="playlist-controls">
        <button className="btn" onClick={this.playPreviousVideo} disabled={this.isPreviousVideoDisabled()}><i className="fa fa-backward" /></button>
        {replayVideoButton}
        <button className="btn" onClick={this.playNextVideo} disabled={this.isNextVideoDisabled()}><i className="fa fa-forward" /></button>
        <button className="btn" onClick={this.togglePlaylistVisibility}><i className="fa fa-list" /></button>
      </div>
    );
  },
});

const CurrentPlaylist = React.createClass({
  getInitialState() {
    return {
      videos: [],
      playedVideos: [],
      playlistVisible: false,
    };
  },
  componentDidMount() {
    // ToDo retrieve playlist from backend

    window.addEventListener('playlist.addVideo', this.addVideo);
    window.addEventListener('playlist.cueVideo', this.cueVideo);
    window.addEventListener('playlist.endVideo', this.endVideo);
    window.addEventListener('playlist.playPreviousVideo', this.playPreviousVideo);
    window.addEventListener('playlist.removeVideo', this.removeVideo);
    window.addEventListener('playlist.raiseVideo', this.raiseVideo);
    window.addEventListener('playlist.togglePlaylistVisibility', this.togglePlaylistVisibility);
  },
  componentWillUnmount() {
    window.removeEventListener('playlist.addVideo', this.addVideo);
    window.removeEventListener('playlist.cueVideo', this.cueVideo);
    window.removeEventListener('playlist.endVideo', this.endVideo);
    window.removeEventListener('playlist.playPreviousVideo', this.playPreviousVideo);
    window.removeEventListener('playlist.removeVideo', this.removeVideo);
    window.removeEventListener('playlist.raiseVideo', this.raiseVideo);
    window.removeEventListener('playlist.togglePlaylistVisibility', this.togglePlaylistVisibility);
  },
  addVideo(event) {
    // Add the video in first position if no video playing
    // Else add it in second position

    const video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState((state) => {
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  cueVideo(event) {
    // Add the video in last position
    const video = this.normalizeVideo(event.detail.video);

    if (this.isInPlaylist(video))
      return;

    this.setState((state) => {
      state.videos.push(video);

      return state;
    });
  },
  endVideo(event) {
    const video = this.hydrateVideoFromPlaylist(event.detail.video);

    this.setState((state) => {
      state.playedVideos.push(video);

      return state;
    });
  },
  playPreviousVideo() {
    this.setState((state) => {
      const latestVideo = _.last(state.playedVideos);

      state.playedVideos = _.reject(state.playedVideos, latestVideo);
      state.videos.splice(0, 0, latestVideo);

      return state;
    });
  },
  removeVideo(event) {
    const video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState((state) => {
      state.videos = _.reject(state.videos, video);

      return state;
    });
  },
  raiseVideo(event) {
    const video = this.normalizeVideo(event.detail.video);

    if (!this.isInPlaylist(video))
      return;

    this.setState((state) => {
      state.videos = _.reject(state.videos, video);
      if (isPlaylistPlaying) {
        state.videos.splice(1, 0, video);
      } else {
        state.videos.splice(0, 0, video);
      }

      return state;
    });
  },
  normalizeVideo(video) {
    if (_.isObject(video))
      return video;

    return { id: video };
  },
  hydrateVideoFromPlaylist(videoId) {
    return this.state.videos[_.findIndex(this.state.videos, { id: videoId })];
  },
  isInPlaylist(video) {
    return _.some(this.state.videos, video);
  },
  togglePlaylistVisibility() {
    this.setState({
      videos: this.state.videos,
      playedVideos: this.state.playedVideos,
      playlistVisible: document.querySelector('#playlist').classList.toggle('visible'),
    });
  },
  render() {
    return (
      <div id="current-playlist">
        <Playlist videos={this.state.videos} />
        <Controls numberOfPlayedVideos={this.state.playedVideos.length} numberOfVideos={this.state.videos.length} />
        <Player playlist={_.map(this.state.videos, 'id')} />
      </div>
    );
  },
});

module.exports = CurrentPlaylist;
