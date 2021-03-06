(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.IFrameCommunicator = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function toJSON(value) {
    try {
      return JSON.stringify(value);
    } catch (err) {
      return false;
    }
  }

  function fromJSON(value) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return false;
    }
  }

  /**
   * @class IFrameCommunicator
   * @example
   * ```
   * const com = new IFrameCommunicator();
   * com.on('ready', () => document.querySelector('root').style.backgroundColor = 'blue');
   * com.ready();
   * ```
   */

  var IFrameCommunicator = function () {

    /**
     * @param {string} id
     * @param {array} initialDeps
     */
    function IFrameCommunicator(id, initialDeps) {
      var _this = this;

      _classCallCheck(this, IFrameCommunicator);

      this.id = id;
      this.remainingDeps = initialDeps;
      this.listeners = {};

      var eventListenerName = 'addEventListener' in window ? 'addEventListener' : 'attachEvent';

      window[eventListenerName]('message', function (event) {
        if (!event || !event.data) {
          return;
        }

        var data = fromJSON(event.data);

        if (data.type === 'ping') {
          event.source.postMessage(toJSON({
            type: 'pong',
            id: _this.id
          }), '*');
        }

        var index = _this.remainingDeps.indexOf(data.id);
        if (index >= 0) {
          _this.remainingDeps.splice(index, 1);

          if (_this.remainingDeps.length === 0) {
            _this.fire('ready');
          }
        }
      });
    }

    /**
     * @param {string} name
     * @param {function} callback
     * @return {IFrameCommunicator}
     */


    _createClass(IFrameCommunicator, [{
      key: 'on',
      value: function on(name, callback) {
        this.listeners[name] = this.listeners[name] || [];
        this.listeners[name].push(callback);

        return this;
      }
    }, {
      key: 'fire',
      value: function fire(name) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        if (!this.listeners[name]) {
          return false;
        }

        this.listeners[name].forEach(function (callback) {
          callback.apply(undefined, args);
        });
        return true;
      }
    }, {
      key: 'ready',
      value: function ready() {
        var _this2 = this;

        var bubble = function bubble() {
          var currentWindow = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.top;

          for (var index = 0; index < currentWindow.frames.length; index + 1) {
            if (currentWindow.frames[index] !== window) {
              currentWindow.frames[index].postMessage(toJSON({ type: 'ping', id: _this2.id }), '*');
            }

            bubble(currentWindow.frames[index]);
          }
        };

        bubble();
      }
    }]);

    return IFrameCommunicator;
  }();

  exports.default = IFrameCommunicator;
});
