const {remote} = require('electron');
const win = remote.getCurrentWindow();

const Titlebar = React.createClass({

  render: function () {

    win.toggleMaximize = () => {
        if (!win.isMaximized()) win.maximize();
        else win.unmaximize();
    }

    return (
      
        <div className="titlebar" data-plateform={this.props.platform}>
        
            <div className="titlebar--text">
                YouWatch
            </div>

            <div className="titlebar--controls-wrapper">

                <div className="titlebar--controls-minimize" onClick={win.minimize}>
                    <span></span>                  
                </div>

                <div className="titlebar--controls-maximize" onClick={win.toggleMaximize}>
                    <span></span>
                    <span className="bar2"></span>  
                </div>

                <div className="titlebar--controls-close" onClick={win.close}>
                    <span></span>
                    <span className="bar2"></span>
                </div>

            </div>
            
        </div>

    );
  }
});

module.exports = Titlebar;