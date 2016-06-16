/*
 * Component that contains the button to interact with the lesson:
 * check for errors in source code, run, execute one instruction, etc.
 */

var React = require("react");
var Constants = require("../constants");

var ButtonBar = React.createClass({
  _styles: {
    playButton: {
      height: "100%",
      width: "10%",
      backgroundImage: "url(\"" + Constants.PLAY_ICON_URL + "\")",
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
    resetButton: {
      height: "100%",
      width: "10%",
      backgroundImage: "url(\"" + Constants.RESET_ICON_URL + "\")",
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    },
  },
  render: function() {
    return <div style={{backgroundColor: "#eeffee", width: "100%",
                        height: "100%"}}>
              <button onClick={this.props.onPlay}
                      style={this._styles.playButton} />

              <button onClick={this.props.onReset}
                      style={this._styles.resetButton} />
           </div>;
  },
});

module.exports = ButtonBar;
