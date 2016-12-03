const React = require('react');
const ReactDOM = require('react-dom');
const YouTubeIframeLoader = require('youtube-iframe');

const SubscriptionsPage = require('./scripts/pages/subscriptions.react.js');
const ConfigurationPage = require('./scripts/pages/configuration.react.js');
const AuthentificationPage = require('./scripts/pages/authentification.react.js');
const NoInternetPage = require('./scripts/pages/no-internet.react.js');
const Titlebar = require('./scripts/components/titlebar.react.js');
const Utils = require('./scripts/utils');

window.Tether = require('tether');
window.lazysizes = require('lazysizes');

const mainElement = document.getElementById('main');
const titlebarElement = document.getElementById('titlebar-container');

const SidebarItem = React.createClass({
  propTypes: {
    changePage: React.PropTypes.func,
    isCurrent: React.PropTypes.bool,
    icon: React.PropTypes.string,
    page: React.PropTypes.string,
    pageName: React.PropTypes.string,
  },
  handleClick(event) {
    event.preventDefault();
    this.props.changePage(this.props.page);
  },
  render() {
    return (
      <li className="nav-item">
        <a href="#" className={this.props.isCurrent ? 'nav-link active' : 'nav-link'} onClick={this.handleClick}>
          <i className={'fa fa-fw ' + this.props.icon} />
          <span className="page-name">
            {this.props.pageName}
          </span>
        </a>
      </li>
    );
  },
});

const Sidebar = React.createClass({
  propTypes: {
    changePage: React.PropTypes.func,
    pages: React.PropTypes.object,
    currentPage: React.PropTypes.string,
  },
  render() {
    const pages = [];
    for (const page in this.props.pages) {
      if ({}.hasOwnProperty.call(this.props.pages, page)) {
        pages.push(
          <SidebarItem
            key={page}
            page={page}
            pageName={this.props.pages[page].name}
            icon={this.props.pages[page].icon}
            isCurrent={this.props.currentPage === page}
            changePage={this.props.changePage}
            />
        );
      }
    }

    return (
      <div id="sidebar">
        <ul className="nav nav-pills nav-stacked">
          {pages}
        </ul>
      </div>
    );
  },
});

const App = React.createClass({
  propTypes: {
    currentPage: React.PropTypes.string,
  },
  shouldComponentUpdate(nextProps, nextState) {
    return nextState.currentPage !== this.state.currentPage;
  },
  getInitialState() {
    return {
      pages: {
        subscriptions:
          { name: 'Subscriptions', icon: 'fa-th', page: <SubscriptionsPage /> },
        configuration:
          { name: 'Configuration', icon: 'fa-cog', page: <ConfigurationPage /> },
      },
      currentPage: 'subscriptions',
    };
  },
  changePage(newPage) {
    this.setState({ currentPage: newPage });
  },
  render() {
    return (
      <div>
        <Sidebar
          pages={this.state.pages}
          currentPage={this.state.currentPage}
          changePage={this.changePage}
          />

        <div id="content">
          {this.state.pages[this.state.currentPage].page}
        </div>
      </div>
    );
  },
});

// eslint-disable-next-line no-unused-vars
let YT;
YouTubeIframeLoader.load(loadYoutube);
function loadYoutube(_YT) {
  YT = _YT;
}

window.addEventListener('offline', switchToOfflineMode);
window.addEventListener('online', tryStoredAccessToken);
Utils.Socket.send('handshake');
Utils.Socket.on('youtube/notauthenticated', renderAuthentication);
Utils.Socket.on('youtube/callbackerror', renderAuthentication);
Utils.Socket.on('youtube/callback', renderApp);

loadConfig();

if (navigator.onLine) {
  tryStoredAccessToken();
} else {
  switchToOfflineMode();
}

function tryStoredAccessToken() {
  Utils.Socket.send('app/authenticate');
}

ReactDOM.render(
  <Titlebar />,
  titlebarElement
);

function renderAuthentication(event, error) {
  ReactDOM.render(
    <AuthentificationPage error={error} />,
    mainElement
  );
}

function renderApp() {
  ReactDOM.render(
    <App />,
    mainElement
  );
}

function switchToOfflineMode() {
  // ToDo save states
  renderOfflineMode();
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
    localStorage.setItem('darkTheme', Utils.castBooleanToString(Utils.isDarkThemeActive()));

  if (layout) {
    if (layout === 'overlay') {
      document.body.classList.add('layout-overlay');
    } else if (layout === 'sticker') {
      document.body.classList.add('layout-sticker');
    }
  } else
    localStorage.setItem('layout', Utils.getActiveLayout());
}

document.body.classList.add(process.platform);
