const {remote} = require('electron');

const Titlebar = React.createClass({

  render: function () {

    const w = {
        min: () => {
            const win = remote.getCurrentWindow()
            win.minimize()
        },
        max: () => {
            const win = remote.getCurrentWindow()
            if (!win.isMaximized()) win.maximize()
            else win.unmaximize()
        },
        quit: () => {
            const win = remote.getCurrentWindow()
            win.close()
        },
    }

    return (
      
        <div id="titlebar" data-platform={this.props.platform}>
        
            <div className="titlebar--text">
                <img className="titlebar--icon" src="images/icon.png" />
                YouWatch
            </div>

            <div className="titlebar--controls-wrapper">

                <div className="titlebar--controls-minimize" onClick={w.min}>
                    <span></span>                  
                </div>

                <div className="titlebar--controls-maximize" onClick={w.max}>
                    <span></span>
                    <span className="bar2"></span>  
                </div>

                <div className="titlebar--controls-close" onClick={w.quit}>
                    <span></span>
                    <span className="bar2"></span>
                </div>

            </div>
            
        </div>

    );
  }
});

module.exports = Titlebar;