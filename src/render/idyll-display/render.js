import React from "react";
import * as components from "idyll-components";
import IdyllDocument from "idyll-document";

class Renderer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(e) {
    this.setState({
      error: e
    });
  }

  render() {
    const { markup, components } = this.props;

    if (!components || !components.length) {
      return 'Loading components...';
    }
    const loadedComponent = components.reduce((memo, {name, path}) => {
      try {
        memo[name] = require(path);
      } catch(e){
        console.log('Error loading component', name);
      }
      return memo;
    }, {});
    return (
      <div className="renderer" style={{ width: "50%" }}>
        <div className="renderer-container">
          <IdyllDocument
            markup={markup}
            components={loadedComponent}
            layout={"centered"}
            context={context => {
              window.IDYLL_CONTEXT = context;
            }}
            datasets={{}}
          />
        </div>
      </div>
    );
  }
}

export default Renderer;
