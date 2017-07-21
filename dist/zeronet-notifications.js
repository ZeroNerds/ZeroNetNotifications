(function() {
  var Notification, Notifications, template;

  template = "<div class=\"zNotifications-notification\"><span class=\"notification-icon\">!</span> <span class=\"body\">Test notification</span><a class=\"close\" href=\"#Close\">&times;</a>\n  <div style=\"clear: both\"></div>\n</div>";

  Notifications = (function() {
    function Notifications(elem1) {
      this.elem = elem1;
      if (typeof jQuery !== "function") {
        throw new Error("jQuery Required!");
      }
      this.elem.addClass("zNotifications-notifications");
      $(window).on("resize", this.resizeAll.bind(this));
      this;
    }

    Notifications.prototype.ids = {};

    Notifications.prototype.register = function(id, o) {
      if (this.ids[id]) {
        throw new Error("UniqueError: " + id + " is already registered");
      }
      return this.ids[id] = o;
    };

    Notifications.prototype.get = function(id, th) {
      if (!this.ids[id] && th) {
        throw new Error("UndefinedError: " + id + " is not registered");
      }
      return this.ids[id];
    };

    Notifications.prototype.unregister = function(id, o) {
      if (!this.ids[id]) {
        throw new Error("UndefinedError: " + id + " is not registered");
      }
      return delete this.ids[id];
    };

    Notifications.prototype.test = function() {
      setTimeout(((function(_this) {
        return function() {
          _this.add("connection", "error", "Connection lost to <b>UiServer</b> on <b>localhost</b>!");
          return _this.add("message-Anyone", "info", "New  from <b>Anyone</b>.");
        };
      })(this)), 1000);
      return setTimeout(((function(_this) {
        return function() {
          return _this.add("connection", "done", "<b>UiServer</b> connection recovered.", 5000);
        };
      })(this)), 3000);
    };

    Notifications.prototype.add = function(id, type, body, timeout, options, cb) {
      if (timeout == null) {
        timeout = 0;
      }
      if (options == null) {
        options = {};
      }
      return new Notification(this, {
        id: id,
        type: type,
        body: body,
        timeout: timeout,
        options: options,
        cb: cb
      });
    };

    Notifications.prototype.close = function(id) {
      return this.get(id, true).close("script", true);
    };

    Notifications.prototype.closeAll = function() {
      var main;
      main = this;
      Object.keys(this.ids).map(function(p) {
        return main.close(p);
      });
    };

    Notifications.prototype.resizeAll = function() {
      var main;
      main = this;
      Object.keys(this.ids).map(function(p) {
        return main.get(p, true).resizeBox();
      });
    };

    Notifications.prototype.randomId = function() {
      return "msg" + Math.random().toString().replace(/0/g, "").replace(/\./g, "");
    };

    Notifications.prototype.displayMessage = function(type, body, timeout, cb) {
      if (timeout == null) {
        timeout = 0;
      }
      return add(randomId(), type, body, timeout, {}, cb);
    };

    Notifications.prototype.displayConfirm = function(message, confirm_label, cancel_label, cb) {
      if (cancel_label == null) {
        cancel_label = false;
      }
      return add(randomId(), "confirm", message, 0, {
        confirm_label: confirm_label,
        cancel_label: cancel_label
      }, cb);
    };

    Notifications.prototype.displayPrompt = function(message, confirm_label, cancel_label, cb) {
      if (cancel_label == null) {
        cancel_label = false;
      }
      return add(randomId(), "prompt", message, 0, {
        confirm_label: confirm_label,
        cancel_label: cancel_label
      }, cb);
    };

    return Notifications;

  })();

  Notification = (function() {
    function Notification(main1, message) {
      var body, width;
      this.main = main1;
      this;
      this.main_elem = this.main.elem;
      this.options = message.options;
      this.cb = message.cb;
      this.id = message.id.replace(/[^A-Za-z0-9]/g, "");
      if (this.main.get(this.id)) {
        this.main.get(this.id).close();
      }
      this.type = message.type;
      this["is" + this.type.substr(0, 1).toUpperCase() + this.type.substr(1)] = true;
      if (this.isProgress) {
        this.RealTimeout = message.timeout;
      } else if (this.isInput || this.isConfirm) {

      } else {
        this.Timeout = message.timeout;
      }
      this.main.register(this.id, this);
      this.elem = $(template);
      if (this.isProgress) {
        this.elem.addClass("notification-done");
      }
      this.updateText(this.type);
      body = message.body;
      this.body = body;
      this.closed = false;
      this.rebuildMsg("");
      this.elem.appendTo(this.main_elem);
      if (this.Timeout) {
        $(".close", this.elem).remove();
        setTimeout(((function(_this) {
          return function() {
            return _this.close();
          };
        })(this)), this.Timeout);
      }
      if (this.isProgress) {
        this.setProgress(this.options.progress || 0);
      }
      if (this.isPrompt) {
        this.buildPrompt($(".body", this.elem), this.options.confirm_label || "Ok", this.options.cancel_label || false);
      }
      if (this.isConfirm) {
        this.buildConfirm($(".body", this.elem), this.options.confirm_label || "Ok", this.options.cancel_label || false);
      }
      width = this.elem.outerWidth();
      if (this.elem.outerHeight() > 55) {
        this.elem.addClass("long");
      }
      this.elem.css({
        "width": "50px",
        "transform": "scale(0.01)"
      });
      this.elem.animate({
        "scale": 1
      }, 800, "easeOutElastic");
      this.elem.animate({
        "width": width
      }, 700, "easeInOutCubic");
      $(".body", this.elem).cssLater("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)", 1000);
      setTimeout(this.resizeBox.bind(this), 1500);
      $(".close", this.elem).on("click", (function(_this) {
        return function() {
          _this.close("user", true);
          return false;
        };
      })(this));
      $(".zNotifications-button", this.elem).on("click", (function(_this) {
        return function() {
          _this.close();
          return false;
        };
      })(this));
      $(".select", this.elem).on("click", (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
    }

    Notification.prototype.resizeBox = function() {
      return this.elem[0].style = "";
    };

    Notification.prototype.callBack = function(event, res) {
      if (this.called) {
        throw new Error("CalbackError: Callback was called twice");
      }
      this.called = true;
      if (typeof this.cb !== "function") {
        console.warn("Silently failing callback @ %s: %s & '%s'", this.id, event, res);
        return;
      }
      console.info("Event @ %s %s %s", this.id, event, res);
      return this.cb(event, res);
    };

    Notification.prototype.rebuildMsg = function(append) {
      this.append = $(append);
      if (typeof this.body === "string") {
        $(".body", this.elem).html("<span class=\"message\">" + this.escape(this.body) + "</span>").append(this.append);
        if (this.isList || this.isPrompt || this.isConfirm) {
          return $(".message", this.elem).addClass("message-non-center");
        }
      } else {
        return $(".body", this.elem).html("").append(this.body, this.append);
      }
    };

    Notification.prototype.escape = function(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>");
    };

    Notification.prototype.setBody = function(body) {
      this.body = body;
      if (typeof this.body === "string") {
        this.body = $("<span>" + this.escape(this.body) + "</span>");
        $(".body .message", this.elem).empty().append(this.body);
      } else {
        $(".body .message", this.elem).empty().append(this.body);
      }
      this.resizeBox();
      return this;
    };

    Notification.prototype.buildConfirm = function(body, caption, cancel) {
      var button, cButton;
      if (cancel == null) {
        cancel = false;
      }
      button = $("<a href='#" + caption + "' class='zNotifications-button zNotifications-button-confirm'>" + caption + "</a>");
      button.on("click", (function(_this) {
        return function() {
          _this.callBack("action", true);
          return false;
        };
      })(this));
      body.append(button);
      if (cancel) {
        cButton = $("<a href='#" + cancel + "' class='zNotifications-button zNotifications-button-cancel'>" + cancel + "</a>");
        cButton.on("click", (function(_this) {
          return function() {
            _this.callBack("action", false);
            return false;
          };
        })(this));
        body.append(cButton);
      }
      button.focus();
      return $(".notification").scrollLeft(0);
    };

    Notification.prototype.buildPrompt = function(body, caption, cancel) {
      var button, cButton, input;
      if (cancel == null) {
        cancel = false;
      }
      input = $("<input type='text' class='input'/>");
      input.on("keyup", (function(_this) {
        return function(e) {
          if (e.keyCode === 13) {
            return button.trigger("click");
          }
        };
      })(this));
      body.append(input);
      button = $("<a href='#" + caption + "' class='zNotifications-button zNotifications-button-confirm'>" + caption + "</a>");
      button.on("click", (function(_this) {
        return function() {
          _this.callBack("action", input.val());
          return false;
        };
      })(this));
      body.append(button);
      if (cancel) {
        cButton = $("<a href='#" + cancel + "' class='zNotifications-button zNotifications-button-cancel'>" + cancel + "</a>");
        cButton.on("click", (function(_this) {
          return function() {
            _this.callBack("action", false);
            return false;
          };
        })(this));
        body.append(cButton);
      }
      input.focus();
      return $(".notification").scrollLeft(0);
    };

    Notification.prototype.setProgress = function(percent_) {
      var circle, offset, percent, width;
      if (typeof percent_ !== "number") {
        throw new Error("TypeError: Progress must be int");
      }
      this.resizeBox();
      percent = Math.min(100, percent_) / 100;
      offset = 75 - (percent * 75);
      circle = "<div class=\"circle\"><svg class=\"circle-svg\" width=\"30\" height=\"30\" viewport=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">\n  				<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class=\"circle-bg\"></circle>\n  				<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class=\"circle-fg\" style=\"stroke-dashoffset: " + offset + "\"></circle>\n</svg></div>";
      width = $(".body .message", this.elem).outerWidth();
      if (!$(".circle", this.elem).length) {
        this.rebuildMsg(circle);
      }
      if ($(".body .message", this.elem).css("width") === "") {
        $(".body .message", this.elem).css("width", width);
      }
      $(".body .circle-fg", this.elem).css("stroke-dashoffset", offset);
      if (percent > 0) {
        $(".body .circle-bg", this.elem).css({
          "animation-play-state": "paused",
          "stroke-dasharray": "180px"
        });
      }
      if ($(".notification-icon", this.elem).data("done")) {
        return false;
      } else if (percent_ >= 100) {
        $(".circle-fg", this.elem).css("transition", "all 0.3s ease-in-out");
        setTimeout((function() {
          $(".notification-icon", this.elem).css({
            transform: "scale(1)",
            opacity: 1
          });
          return $(".notification-icon .icon-success", this.elem).css({
            transform: "rotate(45deg) scale(1)"
          });
        }), 300);
        if (this.RealTimeout) {
          $(".close", this.elem).remove();
          setTimeout(((function(_this) {
            return function() {
              return _this.close("auto", true);
            };
          })(this)), this.RealTimeout);
        }
        $(".notification-icon", this.elem).data("done", true);
      } else if (percent_ < 0) {
        $(".body .circle-fg", this.elem).css("stroke", "#ec6f47").css("transition", "transition: all 0.3s ease-in-out");
        setTimeout(((function(_this) {
          return function() {
            $(".notification-icon", _this.elem).css({
              transform: "scale(1)",
              opacity: 1
            });
            _this.elem.removeClass("notification-done").addClass("notification-error");
            return $(".notification-icon .icon-success", _this.elem).removeClass("icon-success").html("!");
          };
        })(this)), 300);
        $(".notification-icon", this.elem).data("done", true);
      }
      return this;
    };

    Notification.prototype.setDesign = function(char, type) {
      $(".notification-icon", this.elem).html(char);
      return this.elem.addClass("notification-" + type);
    };

    Notification.prototype.updateText = function(type) {
      switch (type) {
        case "error":
          return this.setDesign("!", "error");
        case "done":
          return this.setDesign("<div class='icon-success'></div>", "done");
        case "progress":
          return this.setDesign("<div class='icon-success'></div>", "progress");
        case "ask":
        case "list":
        case "prompt":
        case "confirm":
          return this.setDesign("?", "ask");
        case "info":
          return this.setDesign("i", "info");
        default:
          throw new Error("UnknownNotificationType: Type " + type + " is not known");
      }
    };

    Notification.prototype.close = function(event, cb) {
      var elem;
      if (event == null) {
        event = "auto";
      }
      if (cb == null) {
        cb = false;
      }
      if (this.closed) {
        return;
      }
      this.closed = true;
      if (cb || !this.called) {
        this.callBack(event);
      }
      $(".close", this.elem).remove();
      this.main.unregister(this.id);
      this.elem.stop().animate({
        "width": 0,
        "opacity": 0
      }, 700, "easeInOutCubic");
      elem = this.elem;
      this.elem.slideUp(300, (function() {
        return elem.remove();
      }));
      return this.main;
    };

    return Notification;

  })();

  window.Notifications = Notifications;

}).call(this);

(function() {
  var transform_property;

  jQuery.cssHooks.scale = {
    get: function(elem, computed) {
      var match, scale;
      match = window.getComputedStyle(elem)[transform_property].match("[0-9\.]+");
      if (match) {
        scale = parseFloat(match[0]);
        return scale;
      } else {
        return 1.0;
      }
    },
    set: function(elem, val) {
      var transforms;
      transforms = window.getComputedStyle(elem)[transform_property].match(/[0-9\.]+/g);
      if (transforms) {
        transforms[0] = val;
        transforms[3] = val;
        return elem.style[transform_property] = 'matrix(' + transforms.join(", ") + ')';
      } else {
        return elem.style[transform_property] = "scale(" + val + ")";
      }
    }
  };

  jQuery.fx.step.scale = function(fx) {
    return jQuery.cssHooks['scale'].set(fx.elem, fx.now);
  };

  if ((window.getComputedStyle(document.body).transform)) {
    transform_property = "transform";
  } else {
    transform_property = "webkitTransform";
  }

}).call(this);

(function() {
  jQuery.fn.readdClass = function(class_name) {
    var elem;
    elem = this;
    elem.removeClass(class_name);
    setTimeout((function() {
      return elem.addClass(class_name);
    }), 1);
    return this;
  };

  jQuery.fn.removeLater = function(time) {
    var elem;
    if (time == null) {
      time = 500;
    }
    elem = this;
    setTimeout((function() {
      return elem.remove();
    }), time);
    return this;
  };

  jQuery.fn.hideLater = function(time) {
    var elem;
    if (time == null) {
      time = 500;
    }
    elem = this;
    setTimeout((function() {
      if (elem.css("opacity") === 0) {
        return elem.css("display", "none");
      }
    }), time);
    return this;
  };

  jQuery.fn.addClassLater = function(class_name, time) {
    var elem;
    if (time == null) {
      time = 5;
    }
    elem = this;
    setTimeout((function() {
      return elem.addClass(class_name);
    }), time);
    return this;
  };

  jQuery.fn.cssLater = function(name, val, time) {
    var elem;
    if (time == null) {
      time = 500;
    }
    elem = this;
    setTimeout((function() {
      return elem.css(name, val);
    }), time);
    return this;
  };

}).call(this);

//# sourceMappingURL=zeronet-notifications.js.map
