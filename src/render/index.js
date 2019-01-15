import React from "react";
import ReactDOM from "react-dom";
import IdyllDisplay from "./idyll-display";
const { ipcRenderer } = require("electron");

class App extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      markup: "",
      pathKey: ""
    };

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(newMarkup) {
    console.log(newMarkup);
    ipcRenderer.send("save", newMarkup);
  }

  componentDidMount() {
    ipcRenderer.on("idyll:markup", (event, markup) => {
      this.setState({
        markup: markup
      });
    });

    ipcRenderer.on("idyll:path", (event, path) => {
      this.setState({
        pathKey: path
      });
    });

    ipcRenderer.on("idyll:idyll", (event, idyll) => {
      console.log(idyll.getComponents());
    });
  }

  render() {
    return (
      <div>
        <IdyllDisplay
          key={this.state.pathKey}
          markup={this.state.markup}
          onChange={this.handleChange}
        />
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
