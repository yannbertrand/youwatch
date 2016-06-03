const jQuery = require('jquery');
const React = require('react');
const ReactDOM = require('react-dom');
const Timer = require('./javascript/utils/timer.react.js');
const CurrentPlaylist = require('./javascript/pages/current-playlist.react.js');
const SubscriptionsPage = require('./javascript/pages/subscriptions.react.js');
const ConfigurationPage = require('./javascript/pages/configuration.react.js');
const AuthentificationPage = require('./javascript/pages/authentification.react.js');
const YouTubeIframeLoader = require('youtube-iframe');


window.Tether = require('tether');
// window.lazysizes = require('lazysizes');
require('bootstrap');

const Socket = io('http://localhost:@@PORT');
const mainElement = document.getElementById('main');

const SidebarItem = React.createClass({
  handleClick: function(event){
    event.preventDefault();
    this.props.handleClick();
  },
  render: function () {
    return (
      <li className="nav-item">
        <a href="#" className={this.props.isCurrent? 'nav-link active' : 'nav-link'}
           onClick={this.handleClick}>
          <i className={'fa fa-fw ' + this.props.icon}></i>
        </a>
      </li>
    );
  }
});

const Sidebar = React.createClass({
  handleClick: function (pageName) {
    this.props.changePage(pageName);
  },
  render: function () {
    let pages = [];
    for (let pageName in this.props.pages) {
      pages.push(
        <SidebarItem
          key={this.props.pages[pageName].key}
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
  shouldComponentUpdate: function (nextProps, nextState) {
    return nextState.currentPageName !== this.state.currentPageName;
  },
  getInitialState: function () {
    return {
      pages: {
        subscriptions:
          { key: 'Subscriptions', icon: 'fa-th', page: <SubscriptionsPage /> },
        configuration:
          { key: 'Configuration', icon: 'fa-cog', page: <ConfigurationPage /> }
      },
      currentPageName: 'subscriptions'
    };
  },
  changePage: function (pageName) {
    this.setState({ currentPageName: pageName });
  },
  render: function () {
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

Socket.on('internet/notconnected', function () {
  ReactDOM.render(
    <NoInternetPage />,
    mainElement
  );
});

Socket.on('youtube/notauthenticated', function () {
  ReactDOM.render(
    <AuthentificationPage />,
    mainElement
  );
});

Socket.on('youtube/callback', function (token) {
  ReactDOM.render(
    <App />,
    mainElement
  );
});

Socket.on('app/reloading', function (page) {
  // ToDo go on page
});

