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

  var IFrameCommunicator = function () {
    function IFrameCommunicator(id, deps) {
      var _this = this;

      _classCallCheck(this, IFrameCommunicator);

      this.id = id;
      this.deps = deps;
      this.listeners = {};
      this.master = null;

      var eventListenerName = 'addEventListener' in window ? 'addEventListener' : 'attachEvent';

      if (!this.master) {
        this.master = window;
        while (this.master.parent && this.master.parent !== this.master) {
          this.master = this.master.parent;
        }
      }

      window[eventListenerName]('message', function (event) {
        if (!event || !event.data) {
          return;
        }

        var data = fromJSON(event.data);

        if (data.type !== 'ready') {
          return;
        }

        _this.fire('ready', event, data);
      });

      var registered = {};
      this.master.window[eventListenerName]('message', function (event) {
        if (!event || !event.data) {
          return;
        }

        var data = fromJSON(event.data);

        if (data.type !== 'register') {
          return;
        }

        registered[data.id] = data;
        registered[data.id].window = event.source;

        // register deps
        if (data.deps && Array.isArray(data.deps)) {
          data.deps.forEach(function (dep) {
            if (!registered.hasOwnProperty(dep)) {
              registered[dep] = false;
            }
          });
        }

        // check
        for (var key in registered) {
          if (!registered[key]) {
            continue;
          }

          var item = registered[key];

          if (!item || !item.deps) {
            continue;
          }

          var isFulfilled = item.deps.filter(function (dep) {
            return !!registered[dep];
          }) // eslint-disable-line
          .length === item.deps.length;

          if (isFulfilled) {
            item.window.postMessage(toJSON({ type: 'ready' }), '*');
          }
        }
      });
    }

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
      key: 'register',
      value: function register() {
        this.master.postMessage(toJSON({ type: 'register', id: this.id, deps: this.deps }), '*');
      }
    }]);

    return IFrameCommunicator;
  }();

  exports.default = IFrameCommunicator;
});
