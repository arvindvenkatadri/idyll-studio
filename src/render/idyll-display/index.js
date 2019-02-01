import React from "react";
import Edit from "./edit.js";
import Render from "./render.js";
import ComponentView from "./component-view.js";

class IdyllDisplay extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentMarkup: this.props.markup
    };
    this.handleChange = this.handleChange.bind(this);
    this.insertComponent = this.insertComponent.bind(this);
  }

  // When editor detects changes, updates current markup
  // to the newMarkup passed in
  handleChange(newMarkup) {
    this.setState({ currentMarkup: newMarkup });
    const { onChange } = this.props; // must pass info up one level
    if (onChange) {
      onChange(newMarkup);
    }
  }

  // Update renderer to reflect newly uploaded file
  // if previous markup is any different from current
  componentDidUpdate(prevProps) {
    if (this.props.markup !== prevProps.markup) {
      this.handleChange(this.props.markup);
    }
  }

  // Insert a new component into editor and renderer given
  // component tag String
  insertComponent(componentTag) {
    var markup = this.state.currentMarkup + "\n" + componentTag;
    this.setState({ currentMarkup: markup });

    const { insertComponent } = this.props;
    insertComponent(markup);
  }

  render() {
    const { markup, components, propsMap } = this.props;
    const { currentMarkup } = this.state;

    return (
      <div className="grid">
        <div className="header">
          <ComponentView
            components={components}
            insertComponent={this.insertComponent}
            propsMap={propsMap}
          />
        </div>
        <div className="edit-container">
          <Edit markup={markup} onChange={this.handleChange} />
        </div>
        <div className="output-container">
          <Render markup={currentMarkup} components={components} />
        </div>
      </div>
    );
  }
}

export default IdyllDisplay;
