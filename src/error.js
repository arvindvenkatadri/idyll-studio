class ExtendableError extends Error {
  constructor(msg) {
    super(msg);
    this.name = this.constructor.name;
    this.message = msg;
    this.stack = new Error(msg).stack;
  }
}

exports.InvalidParameterError = class InvalidParameterError extends ExtendableError {
  constructor(msg) {
    super(msg);
  }
};

exports.EditingWarning = class EditingWarning extends ExtendableError {
  constructor(msg) {
    super(msg);
  }
};
