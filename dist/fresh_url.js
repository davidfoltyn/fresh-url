var FreshUrl;

FreshUrl = (function() {
  FreshUrl.libraries = {
    googleAnalytics: {
      present: function() {
        return window._gaq || window[window.GoogleAnalyticsObject];
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(FreshUrl.libraries.googleAnalytics.present).then(function() {
          var ga;
          if (ga = window._gaq) {
            return ga.push(function() {
              return ready();
            });
          } else if (ga = window[window.GoogleAnalyticsObject]) {
            return ga(function() {
              return ready();
            });
          }
        });
      }
    },
    hubspot: {
      present: function() {
        return window._hsq || FreshUrl.scriptFrom(/\/\/(js\.hubspot\.com|js.hs-analytics\.net)/);
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(function() {
          return window._hsq;
        }).then(function() {
          return _hsq.push(function() {
            return ready();
          });
        });
      }
    },
    clicky: {
      present: function() {
        return window.clicky || window.clicky_site_ids || FreshUrl.scriptFrom(/\/\/static\.getclicky\.com/);
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(function() {
          return window.clicky_obj;
        }).then(ready);
      }
    },
    pardot: {
      present: function() {
        return window.piAId || window.piCId || FreshUrl.scriptContains(/\.pardot\.com\/pd\.js/);
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(function() {
          var ref, ref1;
          return (ref = window.pi) != null ? (ref1 = ref.tracker) != null ? ref1.url : void 0 : void 0;
        }).then(ready);
      }
    },
    simplex: {
      present: function() {
        return window.simplex || FreshUrl.scriptFrom(/\/simplex\.js/);
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(function() {
          return window.simplex;
        }).then(ready);
      }
    },
    analyticsJs: {
      present: function() {
        var ref;
        return (ref = window.analytics) != null ? ref.ready : void 0;
      },
      ready: function(ready) {
        return FreshUrl.waitsFor(function() {
          var ref;
          return (ref = window.analytics) != null ? ref.ready : void 0;
        }).then(function() {
          return analytics.ready(ready);
        });
      }
    }
  };

  FreshUrl.originalUrl = window.location.href;

  function FreshUrl(waitList) {
    var i, iframeListener, item, len;
    if (waitList == null) {
      waitList = [];
    }
    if (!window.history.replaceState) {
      return;
    }
    this.key = 0;
    this._isReady = {};
    for (i = 0, len = waitList.length; i < len; i++) {
      item = waitList[i];
      if (typeof item === "string" && FreshUrl.libraries[item]) {
        this.wait(FreshUrl.libraries[item].ready, item);
      } else if (typeof item === "function") {
        this.wait(item);
      } else {
        if (typeof console !== "undefined" && console !== null) {
          console.log("FreshURL: Don't know how to wait for " + item);
        }
      }
    }
    if (waitList.length === 0) {
      if (this.allReady()) {
        this.allReadyCallback();
      }
    }
    FreshUrl.updateWistiaIframes();
    iframeListener = function(event) {
      if (event.data === 'new-wistia-iframe') {
        return FreshUrl.updateWistiaIframes();
      }
    };
    if (typeof window !== "undefined" && window !== null) {
      window.addEventListener('message', iframeListener, false);
    }
  }

  FreshUrl.prototype.wait = function(trigger, key) {
    if (key == null) {
      key = this.nextKey();
    }
    this._isReady[key] = false;
    return trigger((function(_this) {
      return function() {
        return _this.ready(key);
      };
    })(this));
  };

  FreshUrl.prototype.ready = function(key) {
    this._isReady[key] = true;
    if (this.allReady()) {
      return this.allReadyCallback();
    }
  };

  FreshUrl.prototype.allReady = function() {
    var key, notReady, ref, value;
    notReady = [];
    ref = this._isReady;
    for (key in ref) {
      value = ref[key];
      if (!value) {
        notReady.push(key);
      }
    }
    return notReady.length === 0;
  };

  FreshUrl.prototype.allReadyCallback = function() {
    return window.history.replaceState({}, '', FreshUrl.cleanUrl());
  };

  FreshUrl.cleanUrl = function() {
    var cleanSearch;
    cleanSearch = window.location.search.replace(/utm_[^&]+&?/g, '').replace(/(wkey|wemail)[^&]+&?/g, '').replace(/(_hsenc|_hsmi|hsCtaTracking)[^&]+&?/g, '').replace(/(gclid)[^&]+&?/g, '').replace(/mc_[^&]+&?/g, '').replace(/&$/, '').replace(/^\?$/, '');
    return window.location.pathname + cleanSearch + window.location.hash;
  };

  FreshUrl.poll = function(cond, callback, interval, timeout) {
    var pollFn, pollTimeout, start;
    if (interval == null) {
      interval = 50;
    }
    if (timeout == null) {
      timeout = 5000;
    }
    pollTimeout = null;
    start = new Date().getTime();
    pollFn = function() {
      if (new Date().getTime() - start > timeout) {
        return;
      }
      if (cond()) {
        return callback();
      } else {
        clearTimeout(pollTimeout);
        return pollTimeout = setTimeout(pollFn, interval);
      }
    };
    return pollTimeout = setTimeout(pollFn, 1);
  };

  FreshUrl.waitsFor = function(cond) {
    return {
      then: function(callback) {
        return FreshUrl.poll(cond, callback);
      }
    };
  };

  FreshUrl.prototype.nextKey = function() {
    return this.key += 1;
  };

  FreshUrl.scriptFrom = function(re) {
    var i, len, ref, ref1, script;
    ref = document.getElementsByTagName('script');
    for (i = 0, len = ref.length; i < len; i++) {
      script = ref[i];
      if ((ref1 = script.getAttribute('src')) != null ? ref1.match(re) : void 0) {
        return true;
      }
    }
    return false;
  };

  FreshUrl.scriptContains = function(re) {
    var i, len, ref, ref1, script;
    ref = document.getElementsByTagName('script');
    for (i = 0, len = ref.length; i < len; i++) {
      script = ref[i];
      if ((ref1 = script.innerHTML) != null ? ref1.match(re) : void 0) {
        return true;
      }
    }
    return false;
  };

  FreshUrl.librariesPresent = function() {
    var library, name, ref, results;
    ref = FreshUrl.libraries;
    results = [];
    for (name in ref) {
      library = ref[name];
      if (library.present()) {
        results.push(name);
      }
    }
    return results;
  };

  FreshUrl.wistiaIframes = function() {
    var i, iframe, len, ref, results;
    ref = document.getElementsByTagName('iframe');
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      iframe = ref[i];
      if (iframe.src.match(/\/\/.*\.wistia\..*\//)) {
        results.push(iframe);
      }
    }
    return results;
  };

  FreshUrl.updateWistiaIframes = function() {
    var e, error, i, iframe, len, message, ref, results;
    message = {
      method: 'updateProperties',
      args: [
        {
          params: {
            pageUrl: this.originalUrl
          },
          options: {
            pageUrl: this.originalUrl
          }
        }
      ]
    };
    ref = this.wistiaIframes();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      iframe = ref[i];
      try {
        results.push(iframe.contentWindow.postMessage(message, '*'));
      } catch (error) {
        e = error;
      }
    }
    return results;
  };

  return FreshUrl;

})();

if (typeof _freshenUrlAfter !== "undefined" && _freshenUrlAfter !== null) {
  window.freshUrl = new FreshUrl(_freshenUrlAfter);
} else if (window.dataLayer) {
  dataLayer.push(function() {
    return window.freshUrl = new FreshUrl(FreshUrl.librariesPresent());
  });
} else {
  window.freshUrl = new FreshUrl(FreshUrl.librariesPresent());
}
