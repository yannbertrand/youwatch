const { remote } = require('electron');
const React = require('react');
const _ = require('lodash');

let isPlaylistPlaying = false;

const Player = React.createClass({
  onStateChange(event) {
    if (event.data === YT.PlayerState.UNSTARTED) return;
    if (event.data === YT.PlayerState.CUED) return;

    if (event.data === YT.PlayerState.ENDED) {
      // No more video to play
      // (1 because we will remove the played video)
      if (this.state.playlist.length === 1)
        isPlaylistPlaying = false;

      // Remove last played video
      window.dispatchEvent(new CustomEvent('playlist.removeVideo', { detail: { video: this.state.playlist[0] } }));

      // The video has changed
      // Seize the opportunity to update the playlist without interruption
      this.updatePlaylist();
    } else {
      isPlaylistPlaying = true;
    }
  },
  updatePlaylist() {
    if (this.state.playlist.length === 0) return;
    if (!this.state.player.getPlaylist()) return;

    // Update playlist and start playing
    this.state.player.loadPlaylist(this.state.playlist);
  },
  componentWillReceiveProps(nextProps) {
    if (!isPlaylistPlaying && this.state.player.cuePlaylist && nextProps.playlist.length > 0) {
      this.state.player.cuePlaylist(nextProps.playlist);
    }

    this.setState({
      playlist: nextProps.playlist,
    });
  },
  componentDidMount() {
    document.addEventListener('webkitfullscreenchange', () => {
      const currentWindow = remote.getCurrentWindow();
      const isFullScreen = Boolean(document.querySelector('#player:-webkit-full-screen'));

      if (isFullScreen) {
        document.body.classList.add('fullscreen');
        currentWindow.setMinimumSize(160, 90);
      } else {
        document.body.classList.remove('fullscreen');
        currentWindow.setMinimumSize(880, 370);

        // Resize window if too small
        const currentSize = currentWindow.getSize();
        let needResize = false;
        let newWidth = currentSize[0];
        let newHeight = currentSize[1];
        if (newWidth < 880) {
          needResize = true;
          newWidth = 880;
        }
        if (newHeight < 370) {
          needResize = true;
          newHeight = 370;
        }

        if (needResize) {
          currentWindow.setSize(newWidth, newHeight, true);
        }
      }

      currentWindow.setAlwaysOnTop(isFullScreen);
      currentWindow.setHasShadow(!isFullScreen);
      currentWindow.setVisibleOnAllWorkspaces(isFullScreen);
    }, false);

    this.setState({
      playlist: [],

      // YT may not be loaded at this time, need to find a solution...
      // That's probably why I can't put this in a getInitialState method
      player: new YT.Player('player', {
        events: {
          onStateChange: this.onStateChange,
        },
      }),
    });
  },
  render() {
    return <div id="player" />;
  },
});

const PlaylistItem = React.createClass({
  propTypes: {
    id: React.PropTypes.string,
    title: React.PropTypes.string,
    channel: React.PropTypes.string,
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
      <div>
        <div className="playlist-item">
          <button
            className="btn btn-secondary btn-sm remove"
            onClick={this.remove}
            title="Remove this video"
            disabled
            >&times;</button>
          <h5>
            <a onClick={this.raise} title={this.props.title}>
              {this.props.title}
            </a>
          </h5>
          <h6>{this.props.channel}</h6>
        </div>
        <hr />
      </div>
    );
  },
});

const Playlist = React.createClass({
  propTypes: {
    videos: React.PropTypes.object,
  },
  render() {
    const videos = [];
    for (const index in this.props.videos) {
      if ({}.hasOwnProperty.call(this.props.videos, index)) {
        videos.push(
          <PlaylistItem
            key={this.props.videos[index].id}
            id={this.props.videos[index].id}
            thumbnail={this.props.videos[index].thumbnail}
            title={this.props.videos[index].title}
            channel={this.props.videos[index].channel}
            />
          );
      }
    }

    return (
      <div id="playlist">
        {videos}
      </div>
    );
  },
});

const CurrentPlaylist = React.createClass({
  getInitialState() {
    return { videos: [] };
  },
  componentDidMount() {
    // ToDo - retrieve playlist from backend

    window.addEventListener('playlist.addVideo', this.addVideo);
    window.addEventListener('playlist.cueVideo', this.cueVideo);
    window.addEventListener('playlist.removeVideo', this.removeVideo);
    window.addEventListener('playlist.raiseVideo', this.raiseVideo);
  },
  componentWillUnmount() {
    window.removeEventListener('playlist.addVideo', this.addVideo, false);
    window.removeEventListener('playlist.cueVideo', this.cueVideo, false);
    window.removeEventListener('playlist.removeVideo', this.removeVideo, false);
    window.removeEventListener('playlist.raiseVideo', this.raiseVideo, false);
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
  isInPlaylist(video) {
    return _.some(this.state.videos, video);
  },
  render() {
    return (
      <div id="current-playlist">
        <Playlist videos={this.state.videos} />
        <Player playlist={_.map(this.state.videos, 'id')} />
      </div>
    );
  },
});

module.exports = CurrentPlaylist;
