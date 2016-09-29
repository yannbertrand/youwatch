const Titlebar = React.createClass({

  render: function () {
      const darwinClass = this.props.darwin ? "darwin" : "";
    return (
      
        <div className={ darwinClass + " titlebar"}>
        
            <div className="titlebar--text">
                YouWatch
            </div>

            <div className="titlebar--controls-wrapper">

                <div className="titlebar--controls-minimize">
                    <span></span>                  
                </div>

                <div className="titlebar--controls-maximize">
                    <span></span>
                    <span className="bar2"></span>  
                </div>

                <div className="titlebar--controls-close">
                    <span></span>
                    <span className="bar2"></span>
                </div>

            </div>
            
            

        </div>

    );
  }
});

module.exports = Titlebar;