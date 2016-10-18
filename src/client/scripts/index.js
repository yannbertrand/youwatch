const _ = require('lodash');
const React = require('react');
const ReactDOM = require('react-dom');
const CurrentPlaylist = require('./scripts/pages/current-playlist.react.js');
const SubscriptionsPage = require('./scripts/pages/subscriptions.react.js');
const ConfigurationPage = require('./scripts/pages/configuration.react.js');
const AuthentificationPage = require('./scripts/pages/authentification.react.js');
const NoInternetPage = require('./scripts/pages/no-internet.react.js');
const Titlebar = require('./scripts/components/titlebar.react.js');
const YouTubeIframeLoader = require('youtube-iframe');


window.Tether = require('tether');
window.lazysizes = require('lazysizes');

const Socket = io('http://localhost:@@PORT');
const mainElement = document.getElementById('main');
const titlebarElement = document.getElementById('titlebar-container');

const SidebarItem = React.createClass({
  handleClick(event){
    event.preventDefault();
    this.props.handleClick();
  },
  render() {
    return (
      <li className="nav-item">
        <a href="#" className={this.props.isCurrent? 'nav-link active' : 'nav-link'}
           onClick={this.handleClick}>
          <i className={'fa fa-fw ' + this.props.icon}></i>
          <span className="page-name">
            {this.props.pageName}
          </span>
        </a>
      </li>
    );
  }
});

const Sidebar = React.createClass({
  handleClick(pageName) {
    this.props.changePage(pageName);
  },
  render() {
    let pages = [];
    for (let pageName in this.props.pages) {
      pages.push(
        <SidebarItem
          key={pageName}
          pageName={this.props.pages[pageName].name}
          icon={this.props.pages[pageName].icon}
          isCurrent={this.props.currentPageName === pageName}
          handleClick={this.handleClick.bind(this, pageName)}
        />
      );
    }

    return (
      <div id="sidebar">
        <ul className="nav nav-pills nav-stacked">
          {pages}
        </ul>
      </div>
    );
  }
});

const App = React.createClass({
  shouldComponentUpdate(nextProps, nextState) {
    return nextState.currentPageName !== this.state.currentPageName;
  },
  getInitialState() {
    return {
      pages: {
        subscriptions:
          { name: 'Subscriptions', icon: 'fa-th', page: <SubscriptionsPage /> },
        configuration:
          { name: 'Configuration', icon: 'fa-cog', page: <ConfigurationPage /> }
      },
      currentPageName: 'subscriptions'
    };
  },
  changePage(pageName) {
    this.setState({ currentPageName: pageName });
  },
  render() {
    return (
      <div>
        <Sidebar
          pages={this.state.pages}
          currentPageName={this.state.currentPageName}
          changePage={this.changePage}
        />

        <div id="content">
          {this.state.pages[this.state.currentPageName].page}
        </div>
      </div>
    );
  }
})

let YT;
YouTubeIframeLoader.load(_YT => YT = _YT);

window.addEventListener('offline', renderOfflineMode);
window.addEventListener('online', tryStoredAccessToken);
Socket.on('youtube/notauthenticated', renderAuthentication);
Socket.on('youtube/callback', renderApp);

loadConfig();

if (navigator.onLine) {
  tryStoredAccessToken();
} else {
  switchToOfflineMode();
}

function tryStoredAccessToken() {
  Socket.emit('app/authenticate');
}

ReactDOM.render(
  <Titlebar />,
  titlebarElement
);

function renderAuthentication() {
  ReactDOM.render(
    <AuthentificationPage />,
    mainElement
  );
}

function renderApp(token) {
  ReactDOM.render(
    <App />,
    mainElement
  );
}

function renderOfflineMode() {
  ReactDOM.render(
    <NoInternetPage />,
    mainElement
  );
}

function loadConfig() {
  const darkTheme = localStorage.getItem('darkTheme');
  const layout = localStorage.getItem('layout');

  if (darkTheme) {
    if (darkTheme === '1')
      document.body.classList.add('dark');
  } else
    localStorage.setItem('darkTheme', castBooleanToString(isDarkThemeActive()));

  if (layout) {
    if (layout === 'overlay') {
      document.body.classList.add('layout-overlay');
    } else if (layout === 'sticker') {
      document.body.classList.add('layout-sticker');
    }
  } else
    localStorage.setItem('layout', getActiveLayout());
}

function isDarkThemeActive() {
  return document.body.classList.contains('dark');
}

function getActiveLayout() {
  if (document.body.classList.contains('layout-overlay'))
    return 'overlay';
  if (document.body.classList.contains('layout-sticker'))
    return 'sticker';

  return 'youtube';
}

function castBooleanToString(boolean) {
  return boolean? '1': '0';
}

document.body.classList.add(process.platform)