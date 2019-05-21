import React from 'react';
import Context from '../../context';
const AST = require('idyll-ast');
const compile = require('idyll-compiler');

const cursorPositions = {};
const getRandomId = () => {
  return Math.floor(Math.random()*10000000000) + 100000000;
}

const getNodeById = (node, id) => {
  if (node.id === id) {
    return node;
  }
  if (!node.children || !node.children.length) {
    return false;
  }
  for (var i = 0; i < node.children.length; i++) {
    const ret = getNodeById(node.children[i], id);
    if (ret) {
      return ret;
    }
  }
  return false;
}

function isChildOf(node, parent) {
  while (node !== null) {
      if (node === parent) {
          return true;
      }
      node = node.parentNode;
  }

  return false;
};

function getCurrentCursorPosition(parent) {
  var selection = window.getSelection(),
      charCount = -1,
      node;

  if (selection.focusNode) {
      if (isChildOf(selection.focusNode, parent)) {
          node = selection.focusNode;
          charCount = selection.focusOffset;

          while (node) {
              if (node === parent) {
                  break;
              }

              if (node.previousSibling) {
                  node = node.previousSibling;
                  charCount += node.textContent.length;
              } else {
                   node = node.parentNode;
                   if (node === null) {
                       break
                   }
              }
         }
    }
 }

  return charCount;
};

function createRange(node, chars, range) {
  if (!range) {
      range = document.createRange()
      range.selectNode(node);
      range.setStart(node, 0);
  }

  if (chars.count === 0) {
      range.setEnd(node, chars.count);
  } else if (node && chars.count >0) {
      if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.length < chars.count) {
              chars.count -= node.textContent.length;
          } else {
              range.setEnd(node, chars.count);
              chars.count = 0;
          }
      } else {
         for (var lp = 0; lp < node.childNodes.length; lp++) {
              range = createRange(node.childNodes[lp], chars, range);

              if (chars.count === 0) {
                  break;
              }
          }
      }
  }

  return range;
};

function setCurrentCursorPosition(node, chars) {
  if (chars >= 0) {
      var selection = window.getSelection();

      const range = createRange(node.parentNode, { count: chars });

      if (range) {
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
      }
  }
};

class AuthorTool extends React.PureComponent {
  static contextType = Context;

  constructor(props) {
    super(props);
    this.state = {
      showCode: false
    }
    this._markup = this.getMarkup(props);
    cursorPositions[props.idyllASTNode.id] = -1;
  }

  updateNode(node, oldString, newString) {
    Object.keys(node.properties || {}).forEach((key) => {
      const prop = node.properties[key];
      if (prop.type === 'value' && ('' + prop.value).trim() == ('' + oldString).trim()) {
        prop.value = newString;
      }
    });
    (node.children || []).forEach(child => {
      this.updateNode(child, oldString, newString);
    })
  }

  // Flips between whether we are in the author view of a component
  handleClickCode() {
    if (this.state.showCode) {

      const output = compile(this._markup, { async: false });
      console.log(output);
      let node = output.children[0];
      if (node.children && node.children.length) {
        node = node.children[0];
      }
      console.log(node);
      const targetNode = getNodeById(this.context.ast, this.props.idyllASTNode.id);
      Object.keys(node).forEach((key) => {
        if (key === 'id') {
          return;
        }
        targetNode[key] = node[key];
      });
      console.log(targetNode);

      this.context.setAst(this.context.ast);
      this.setState({
        showCode: false
      })
    } else {
      this._markup = this.getMarkup(this.props);
      this.setState({ showCode: true });
    }
  }

  handleClickProps() {
    if (this.context.currentSidebarNode && this.context.currentSidebarNode.id === this.props.idyllASTNode.id) {
      this.context.setSidebarNode(null);
    } else {
      this.context.setSidebarNode(getNodeById(this.context.ast, this.props.idyllASTNode.id));
    }
  }

  getMarkup(props) {
    return AST.toMarkup({
      id: -1,
      type: 'component',
      name: 'div',
      children: [props.idyllASTNode]
    })
  }

  registerObserver() {
    if (!this._componentRef) {
      return;
    }
    const node = getNodeById(this.context.ast, this.props.idyllASTNode.id);
    var observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          this.updateNode(node, mutation.oldValue, mutation.target.data);
        });
        const ast = this.context.ast;
        ast.id = getRandomId();
        this.context.setAst(ast);
    });
    var config = { subtree: true, characterData: true, characterDataOldValue: true }
    observer.observe(this._componentRef, config);
    this.observer = observer;
  }

  componentDidMount() {
    setCurrentCursorPosition(this._componentRef, cursorPositions[this.props.idyllASTNode.id]);
    // Set up mutation observer to catch DOM changes.
    this.registerObserver();
  }

  handleMarkupRef(ref) {
    if (!ref) {
      return;
    }
    if (this.markupObserver) {
      this.markupObserver.disconnect();
    }
    if (this.observer) {
      this.observer.disconnect();
    }
    this._markupRef = ref;

    // Set up mutation observer to catch DOM changes.
    const node = getNodeById(this.context.ast, this.props.idyllASTNode.id);
    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
          const input = mutation.target.data;
          this._markup = input;
        });
        // const ast = this.context.ast;
        // ast.id = getRandomId();
        // this.context.setAst(ast);
    });
    var config = { subtree: true, characterData: true, characterDataOldValue: true }
    observer.observe(this._markupRef, config);
    this.markupObserver = observer;
  }

  componentWillUnmount() {
    this.observer && this.observer.disconnect();
    this.markupObserver && this.markupObserver.disconnect();
    this._componentRef ? cursorPositions[this.props.idyllASTNode.id] = getCurrentCursorPosition(this._componentRef.parentNode) : null;
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.showCode === false && this.state.showCode !== prevState.showCode) {
      this.registerObserver();
    }
  }

  // Returns an entire author view, including the component itself,
  // a quill icon to indicate whether we're hovering in the component,
  // and debugging information when the icon is pressed
  render() {
    const isAuthorView = this.context.currentSidebarNode && this.context.currentSidebarNode.id === this.props.idyllASTNode.id;
    const { idyll, updateProps, hasError, ...props } = this.props;
    const addBorder = isAuthorView
      ? {
          // boxShadow: '5px 5px 10px 1px lightGray',
          // transition: 'box-shadow 0.35s linear',
          // padding: '0px 10px 10px',
          // margin: '0px -10px 20px'
        }
      : null;
    const putButtonBack = isAuthorView
      ? {
          right: '10px',
          top: '3px'
        }
      : null;

    return (
      <div
        className="component-debug-view"
        style={addBorder}
        ref={ref => (this._refContainer = ref)}
      >
        {
          this.state.showCode ? (<div >
            <pre>
              <code>
                <div contentEditable={true} ref={(ref) => this.handleMarkupRef(ref)}>
                  {this._markup}
                </div>
              </code>
            </pre>
          </div>) : <div contentEditable={true} suppressContentEditableWarning={true} ref={ref => this._componentRef = ref}>{props.component}</div>
        }
        <button
          className="author-view-button"
          style={{right: 40}}
          onClick={this.handleClickProps.bind(this)}
          data-tip
          data-for={props.uniqueKey}
        />
        <button
          className="author-view-button"
          style={putButtonBack}
          onClick={this.handleClickCode.bind(this)}
          data-tip
          data-for={props.uniqueKey}
        />
      </div>
    );
  }
}

export default AuthorTool;
