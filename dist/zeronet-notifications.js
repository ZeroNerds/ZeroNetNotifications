(function() {
  var Notification, Notifications;

  Notifications = (function() {
    function Notifications(elem1) {
      this.elem = elem1;
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
      return this.get(id, true).close();
    };

    return Notifications;

  })();

  Notification = (function() {
    function Notification(main, message) {
      var body, width;
      this.main = main;
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
      this;
      this.elem = $(".notification.notificationTemplate", this.main_elem).clone().removeClass("notificationTemplate");
      this.elem.addClass("notification-" + this.type).addClass("notification-" + this.id);
      if (this.isProgress) {
        this.elem.addClass("notification-done");
      }
      this.updateText(this.type);
      body = message.body;
      this.body = body;
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
      if (!this.Timeout) {
        width += 20;
      }
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
      $(".close", this.elem).on("click", (function(_this) {
        return function() {
          _this.close("user", true);
          return false;
        };
      })(this));
      $(".button", this.elem).on("click", (function(_this) {
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
      return this.elem.css("width", "inherit");
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
        return $(".body", this.elem).html("<span class='message'>" + this.escape(this.body) + "</span>").append(this.append);
      } else {
        return $(".body", this.elem).html("").append(this.body, this.append);
      }
    };

    Notification.prototype.escape = function(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>");
    };

    Notification.prototype.setBody = function(body) {
      this.body = body;
      this.rebuildMsg(this.append);
      this.resizeBox();
      return this;
    };

    Notification.prototype.buildConfirm = function(body, caption, cancel) {
      var button, cButton;
      if (cancel == null) {
        cancel = false;
      }
      button = $("<a href='#" + caption + "' class='button button-" + caption + "'>" + caption + "</a>");
      button.on("click", (function(_this) {
        return function() {
          _this.callBack("action", true);
          return false;
        };
      })(this));
      body.append(button);
      if (cancel) {
        cButton = $("<a href='#" + cancel + "' class='button button-" + cancel + "'>" + cancel + "</a>");
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
      input = $("<input type='" + this.type + "' class='input button-" + this.type + "'/>");
      input.on("keyup", (function(_this) {
        return function(e) {
          if (e.keyCode === 13) {
            return button.trigger("click");
          }
        };
      })(this));
      body.append(input);
      button = $("<a href='#" + caption + "' class='button button-" + caption + "'>" + caption + "</a>");
      button.on("click", (function(_this) {
        return function() {
          _this.callBack("action", input.val());
          return false;
        };
      })(this));
      body.append(button);
      if (cancel) {
        cButton = $("<a href='#" + cancel + "' class='button button-" + cancel + "'>" + cancel + "</a>");
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
      this.rebuildMsg(circle);
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

    Notification.prototype.updateText = function(type) {
      if (type === "error") {
        return $(".notification-icon", this.elem).html("!");
      } else if (type === "done") {
        return $(".notification-icon", this.elem).html("<div class='icon-success'></div>");
      } else if (type === "progress") {
        return $(".notification-icon", this.elem).html("<div class='icon-success'></div>");
      } else if (type === "ask" || type === "list" || type === "prompt" || type === "confirm") {
        return $(".notification-icon", this.elem).html("?");
      } else if (type === "info") {
        return $(".notification-icon", this.elem).html("i");
      } else {
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQU07SUFDUSx1QkFBQyxLQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFDYjtJQURZOzs0QkFHYixHQUFBLEdBQUs7OzRCQUVMLFFBQUEsR0FBVSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1QsSUFBSSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVDtBQUNDLGNBQVUsSUFBQSxLQUFBLENBQU0sZUFBQSxHQUFnQixFQUFoQixHQUFtQix3QkFBekIsRUFEWDs7YUFFQSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTCxHQUFTO0lBSEE7OzRCQUtWLEdBQUEsR0FBSyxTQUFDLEVBQUQsRUFBSSxFQUFKO01BQ0osSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFOLElBQWEsRUFBakI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFBLEdBQW1CLEVBQW5CLEdBQXNCLG9CQUE1QixFQURYOztBQUVBLGFBQU8sSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBO0lBSFI7OzRCQUtMLFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1gsSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFWO0FBQ0MsY0FBVSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBNUIsRUFEWDs7YUFFQSxPQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhEOzs0QkFNWixJQUFBLEdBQU0sU0FBQTtNQUNMLFVBQUEsQ0FBVyxDQUFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNYLEtBQUMsQ0FBQSxHQUFELENBQUssWUFBTCxFQUFtQixPQUFuQixFQUE0Qix5REFBNUI7aUJBQ0EsS0FBQyxD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QUQ7QUFDckIsUUFBQTs7TUFEc0IsT0FBTzs7SUFDN0IsSUFBQSxHQUFPO0lBQ1AsVUFBQSxDQUFXLENBQUUsU0FBQTtNQUNaLElBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFULENBQUEsS0FBdUIsQ0FBMUI7ZUFDQyxJQUFJLENBQUMsR0FBTCxDQUFTLFNBQVQsRUFBb0IsTUFBcEIsRUFERDs7SUFEWSxDQUFGLENBQVgsRUFHRyxJQUhIO0FBSUEsV0FBTztFQU5jOztFQVF0QixNQUFNLENBQUMsRUFBRSxDQUFDLGFBQVYsR0FBMEIsU0FBQyxVQUFELEVBQWEsSUFBYjtBQUN6QixRQUFBOztNQURzQyxPQUFPOztJQUM3QyxJQUFBLEdBQU87SUFDUCxVQUFBLENBQVcsQ0FBRSxTQUFBO2FBQ1osSUFBSSxDQUFDLFFBQUwsQ0FBYyxVQUFkO0lBRFksQ0FBRixDQUFYLEVBRUcsSUFGSDtBQUdBLFdBQU87RUFMa0I7O0VBTzFCLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBVixHQUFxQixTQUFDLElBQUQsRUFBTyxHQUFQLEVBQVksSUFBWjtBQUNwQixRQUFBOztNQURnQyxPQUFPOztJQUN2QyxJQUFBLEdBQU87SUFDUCxVQUFBLENBQVcsQ0FBRSxTQUFBO2FBQ1osSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFULEVBQWUsR0FBZjtJQURZLENBQUYsQ0FBWCxFQUVHLElBRkg7QUFHQSxXQUFPO0VBTGE7QUE5QnJCIiwiZmlsZSI6Inplcm9uZXQtbm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIE5vdGlmaWNhdGlvbnNcblx0Y29uc3RydWN0b3I6IChAZWxlbSkgLT5cblx0XHRAXG5cblx0aWRzOiB7fVxuXG5cdHJlZ2lzdGVyOiAoaWQsbykgLT5cblx0XHRpZiAoQGlkc1tpZF0pXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmlxdWVFcnJvcjogXCIraWQrXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkXCIpXG5cdFx0QGlkc1tpZF09b1xuXG5cdGdldDogKGlkLHRoKSAtPlxuXHRcdGlmICghQGlkc1tpZF0gJiYgdGgpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmRlZmluZWRFcnJvcjogXCIraWQrXCIgaXMgbm90IHJlZ2lzdGVyZWRcIilcblx0XHRyZXR1cm4gQGlkc1tpZF1cblxuXHR1bnJlZ2lzdGVyOiAoaWQsbykgLT5cblx0XHRpZiAoIUBpZHNbaWRdKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkRXJyb3I6IFwiK2lkK1wiIGlzIG5vdCByZWdpc3RlcmVkXCIpXG5cdFx0ZGVsZXRlIEBpZHNbaWRdXG5cblx0IyBUT0RPOiBhZGQgdW5pdCB0ZXN0c1xuXHR0ZXN0OiAtPlxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImVycm9yXCIsIFwiQ29ubmVjdGlvbiBsb3N0IHRvIDxiPlVpU2VydmVyPC9iPiBvbiA8Yj5sb2NhbGhvc3Q8L2I+IVwiKVxuXHRcdFx0QGFkZChcIm1lc3NhZ2UtQW55b25lXCIsIFwiaW5mb1wiLCBcIk5ldyAgZnJvbSA8Yj5BbnlvbmU8L2I+LlwiKVxuXHRcdCksIDEwMDBcblx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0QGFkZChcImNvbm5lY3Rpb25cIiwgXCJkb25lXCIsIFwiPGI+VWlTZXJ2ZXI8L2I+IGNvbm5lY3Rpb24gcmVjb3ZlcmVkLlwiLCA1MDAwKVxuXHRcdCksIDMwMDBcblxuXG5cdGFkZDogKGlkLCB0eXBlLCBib2R5LCB0aW1lb3V0PTAsIG9wdGlvbnM9e30sIGNiKSAtPlxuXHRcdHJldHVybiBuZXcgTm90aWZpY2F0aW9uIEAsIHtpZCx0eXBlLGJvZHksdGltZW91dCxvcHRpb25zLGNifVxuXG5cdGNsb3NlOiAoaWQpIC0+XG5cdFx0QGdldChpZCx0cnVlKS5jbG9zZSgpXG5cbiNcdGRpc3BsYXlDb25maXJtOiAobWVzc2FnZSwgY2FwdGlvbiwgY2FuY2VsPWZhbHNlLCBjYikgLT5cbiNcdGRpc3BsYXlQcm9tcHQ6IChtZXNzYWdlLCB0eXBlLCBjYXB0aW9uLCBjYikgLT5cblxuY2xhc3MgTm90aWZpY2F0aW9uXG5cdGNvbnN0cnVjdG9yOiAoQG1haW4sbWVzc2FnZSkgLT4gIyhAaWQsIEB0eXBlLCBAYm9keSwgQHRpbWVvdXQ9MCkgLT5cblx0XHRAbWFpbl9lbGVtPUBtYWluLmVsZW1cblx0XHRAb3B0aW9ucz1tZXNzYWdlLm9wdGlvbnNcblx0XHRAY2I9bWVzc2FnZS5jYlxuXHRcdEBpZCA9IG1lc3NhZ2UuaWQucmVwbGFjZSAvW15BLVphLXowLTldL2csIFwiXCJcblxuXHRcdCMgQ2xvc2Ugbm90aWZpY2F0aW9ucyB3aXRoIHNhbWUgaWRcblx0XHRpZiBAbWFpbi5nZXQoQGlkKVxuXHRcdFx0QG1haW4uZ2V0KEBpZCkuY2xvc2UoKVxuXG5cblx0XHRAdHlwZT1tZXNzYWdlLnR5cGVcblx0XHRAW1wiaXNcIitAdHlwZS5zdWJzdHIoMCwxKS50b1VwcGVyQ2FzZSgpK0B0eXBlLnN1YnN0cigxKV09dHJ1ZVxuXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBSZWFsVGltZW91dD1tZXNzYWdlLnRpbWVvdXQgI3ByZXZlbnQgZnJvbSBsYXVuY2hpbmcgdG9vIGVhcmx5XG5cdFx0ZWxzZSBpZiBAaXNJbnB1dCBvciBAaXNDb25maXJtICNpZ25vcmVcblx0XHRlbHNlXG5cdFx0XHRAVGltZW91dD1tZXNzYWdlLnRpbWVvdXRcblxuXHRcdEBtYWluLnJlZ2lzdGVyKEBpZCxAKSAjcmVnaXN0ZXJcblxuXHRcdEBcblxuXHRcdCMgQ3JlYXRlIGVsZW1lbnRcblx0XHRAZWxlbSA9ICQoXCIubm90aWZpY2F0aW9uLm5vdGlmaWNhdGlvblRlbXBsYXRlXCIsIEBtYWluX2VsZW0pLmNsb25lKCkucmVtb3ZlQ2xhc3MoXCJub3RpZmljYXRpb25UZW1wbGF0ZVwiKSAjIFRPRE86IGdldCBlbGVtIGZyb20gbm90aWZpY2F0aW9uc1xuXHRcdEBlbGVtLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLSN7QHR5cGV9XCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLSN7QGlkfVwiKVxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpXG5cdFx0IyBVcGRhdGUgdGV4dFxuXHRcdEB1cGRhdGVUZXh0IEB0eXBlXG5cblx0XHRib2R5PW1lc3NhZ2UuYm9keVxuXHRcdEBib2R5PWJvZHlcblxuXHRcdEByZWJ1aWxkTXNnIFwiXCJcblxuXHRcdEBlbGVtLmFwcGVuZFRvKEBtYWluX2VsZW0pXG5cblx0XHQjIFRpbWVvdXRcblx0XHRpZiBAVGltZW91dFxuXHRcdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBObyBuZWVkIG9mIGNsb3NlIGJ1dHRvblxuXHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0QGNsb3NlKClcblx0XHRcdCksIEBUaW1lb3V0XG5cblx0XHQjSW5pdCBtYWluIHN0dWZmXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBzZXRQcm9ncmVzcyhAb3B0aW9ucy5wcm9ncmVzc3x8MClcblx0XHRpZiBAaXNQcm9tcHRcblx0XHRcdEBidWlsZFByb21wdCgkKFwiLmJvZHlcIiwgQGVsZW0pLCBAb3B0aW9ucy5jb25maXJtX2xhYmVsfHxcIk9rXCIsIEBvcHRpb25zLmNhbmNlbF9sYWJlbHx8ZmFsc2UpXG5cdFx0aWYgQGlzQ29uZmlybVxuXHRcdFx0QGJ1aWxkQ29uZmlybSgkKFwiLmJvZHlcIiwgQGVsZW0pLCBAb3B0aW9ucy5jb25maXJtX2xhYmVsfHxcIk9rXCIsIEBvcHRpb25zLmNhbmNlbF9sYWJlbHx8ZmFsc2UpXG5cblx0XHQjIEFuaW1hdGVcblx0XHR3aWR0aCA9IEBlbGVtLm91dGVyV2lkdGgoKVxuXHRcdGlmIG5vdCBAVGltZW91dCB0aGVuIHdpZHRoICs9IDIwICMgQWRkIHNwYWNlIGZvciBjbG9zZSBidXR0b25cblx0XHRpZiBAZWxlbS5vdXRlckhlaWdodCgpID4gNTUgdGhlbiBAZWxlbS5hZGRDbGFzcyhcImxvbmdcIilcblx0XHRAZWxlbS5jc3Moe1wid2lkdGhcIjogXCI1MHB4XCIsIFwidHJhbnNmb3JtXCI6IFwic2NhbGUoMC4wMSlcIn0pXG5cdFx0QGVsZW0uYW5pbWF0ZSh7XCJzY2FsZVwiOiAxfSwgODAwLCBcImVhc2VPdXRFbGFzdGljXCIpXG5cdFx0QGVsZW0uYW5pbWF0ZSh7XCJ3aWR0aFwiOiB3aWR0aH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiKVxuXHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuY3NzTGF0ZXIoXCJib3gtc2hhZG93XCIsIFwiMHB4IDBweCA1cHggcmdiYSgwLDAsMCwwLjEpXCIsIDEwMDApXG5cblx0XHQjIENsb3NlIGJ1dHRvbiBvciBDb25maXJtIGJ1dHRvblxuXHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjbG9zZShcInVzZXJcIix0cnVlKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0JChcIi5idXR0b25cIiwgQGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjbG9zZSgpXG5cdFx0XHRyZXR1cm4gZmFsc2VcblxuXHRcdCMgU2VsZWN0IGxpc3Rcblx0XHQkKFwiLnNlbGVjdFwiLCBAZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlKClcblxuXHRyZXNpemVCb3g6IC0+XG5cdFx0QGVsZW0uY3NzKFwid2lkdGhcIixcImluaGVyaXRcIilcblxuXHRjYWxsQmFjazogKGV2ZW50LHJlcykgLT5cblx0XHRpZiBAY2FsbGVkXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYWxiYWNrRXJyb3I6IENhbGxiYWNrIHdhcyBjYWxsZWQgdHdpY2VcIilcblx0XHRAY2FsbGVkPXRydWVcblx0XHRpZiB0eXBlb2YoQGNiKSAhPSBcImZ1bmN0aW9uXCJcblx0XHRcdGNvbnNvbGUud2FybihcIlNpbGVudGx5IGZhaWxpbmcgY2FsbGJhY2sgQCAlczogJXMgJiAnJXMnXCIsQGlkLGV2ZW50LHJlcylcblx0XHRcdHJldHVyblxuXHRcdGNvbnNvbGUuaW5mbyhcIkV2ZW50IEAgJXMgJXMgJXNcIixAaWQsZXZlbnQscmVzKVxuXHRcdEBjYihldmVudCxyZXMpXG5cblx0cmVidWlsZE1zZzogKGFwcGVuZCkgLT5cblx0XHRAYXBwZW5kPSQoYXBwZW5kKVxuXHRcdGlmIHR5cGVvZihAYm9keSkgPT0gXCJzdHJpbmdcIlxuXHRcdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5odG1sKFwiPHNwYW4gY2xhc3M9J21lc3NhZ2UnPlwiK0Blc2NhcGUoQGJvZHkpK1wiPC9zcGFuPlwiKS5hcHBlbmQoQGFwcGVuZClcblx0XHRlbHNlXG5cdFx0XHQkKFwiLmJvZHlcIiwgQGVsZW0pLmh0bWwoXCJcIikuYXBwZW5kKEBib2R5LEBhcHBlbmQpXG5cblx0ZXNjYXBlOiAodmFsdWUpIC0+XG4gXHRcdHJldHVybiBTdHJpbmcodmFsdWUpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JykucmVwbGFjZSgvJmx0OyhbXFwvXXswLDF9KGJyfGJ8dXxpKSkmZ3Q7L2csIFwiPCQxPlwiKSAjIEVzY2FwZSBhbmQgVW5lc2NhcGUgYiwgaSwgdSwgYnIgdGFnc1xuXG5cdHNldEJvZHk6IChib2R5KSAtPlxuXHRcdEBib2R5PWJvZHlcblx0XHRAcmVidWlsZE1zZyBAYXBwZW5kXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cmV0dXJuIEBcblxuXHRidWlsZENvbmZpcm06IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsdHJ1ZVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0Ym9keS5hcHBlbmQoYnV0dG9uKVxuXHRcdGlmIChjYW5jZWwpXG5cdFx0XHRjQnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhbmNlbH0nIGNsYXNzPSdidXR0b24gYnV0dG9uLSN7Y2FuY2VsfSc+I3tjYW5jZWx9PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdFx0Y0J1dHRvbi5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGZhbHNlXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0Ym9keS5hcHBlbmQoY0J1dHRvbilcblxuXHRcdGJ1dHRvbi5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cblx0YnVpbGRQcm9tcHQ6IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGlucHV0ID0gJChcIjxpbnB1dCB0eXBlPScje0B0eXBlfScgY2xhc3M9J2lucHV0IGJ1dHRvbi0je0B0eXBlfScvPlwiKSAjIEFkZCBpbnB1dFxuXHRcdGlucHV0Lm9uIFwia2V5dXBcIiwgKGUpID0+ICMgU2VuZCBvbiBlbnRlclxuXHRcdFx0aWYgZS5rZXlDb2RlID09IDEzXG5cdFx0XHRcdGJ1dHRvbi50cmlnZ2VyIFwiY2xpY2tcIiAjIFJlc3BvbnNlIHRvIGNvbmZpcm1cblx0XHRib2R5LmFwcGVuZChpbnB1dClcblxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PiAjIFJlc3BvbnNlIG9uIGJ1dHRvbiBjbGlja1xuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsaW5wdXQudmFsKClcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nYnV0dG9uIGJ1dHRvbi0je2NhbmNlbH0nPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGJvZHkuYXBwZW5kKGNCdXR0b24pXG5cblx0XHRpbnB1dC5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cdHNldFByb2dyZXNzOiAocGVyY2VudF8pIC0+XG5cdFx0aWYgdHlwZW9mKHBlcmNlbnRfKSAhPSBcIm51bWJlclwiXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUeXBlRXJyb3I6IFByb2dyZXNzIG11c3QgYmUgaW50XCIpXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cGVyY2VudCA9IE1hdGgubWluKDEwMCwgcGVyY2VudF8pLzEwMFxuXHRcdG9mZnNldCA9IDc1LShwZXJjZW50Kjc1KVxuXHRcdGNpcmNsZSA9IFwiXCJcIlxuXHRcdFx0PGRpdiBjbGFzcz1cImNpcmNsZVwiPjxzdmcgY2xhc3M9XCJjaXJjbGUtc3ZnXCIgd2lkdGg9XCIzMFwiIGhlaWdodD1cIjMwXCIgdmlld3BvcnQ9XCIwIDAgMzAgMzBcIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1iZ1wiPjwvY2lyY2xlPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1mZ1wiIHN0eWxlPVwic3Ryb2tlLWRhc2hvZmZzZXQ6ICN7b2Zmc2V0fVwiPjwvY2lyY2xlPlxuXHRcdFx0PC9zdmc+PC9kaXY+XG5cdFx0XCJcIlwiXG5cdFx0d2lkdGggPSAkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLm91dGVyV2lkdGgoKVxuXHRcdCMkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmh0bWwobWVzc2FnZS5wYXJhbXNbMV0pXG5cdFx0QHJlYnVpbGRNc2cgY2lyY2xlXG5cdFx0aWYgJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5jc3MoXCJ3aWR0aFwiKSA9PSBcIlwiXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmNzcyhcIndpZHRoXCIsIHdpZHRoKVxuXHRcdCQoXCIuYm9keSAuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJzdHJva2UtZGFzaG9mZnNldFwiLCBvZmZzZXQpXG5cdFx0aWYgcGVyY2VudCA+IDBcblx0XHRcdCQoXCIuYm9keSAuY2lyY2xlLWJnXCIsIEBlbGVtKS5jc3Mge1wiYW5pbWF0aW9uLXBsYXktc3RhdGVcIjogXCJwYXVzZWRcIiwgXCJzdHJva2UtZGFzaGFycmF5XCI6IFwiMTgwcHhcIn1cblxuXHRcdGlmICQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRlbHNlIGlmIHBlcmNlbnRfID49IDEwMCAgIyBEb25lXG5cdFx0XHQkKFwiLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwidHJhbnNpdGlvblwiLCBcImFsbCAwLjNzIGVhc2UtaW4tb3V0XCIpXG5cdFx0XHRzZXRUaW1lb3V0ICgtPlxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJzY2FsZSgxKVwiLCBvcGFjaXR5OiAxfVxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uIC5pY29uLXN1Y2Nlc3NcIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInJvdGF0ZSg0NWRlZykgc2NhbGUoMSlcIn1cblx0XHRcdCksIDMwMFxuXHRcdFx0aWYgQFJlYWxUaW1lb3V0XG5cdFx0XHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgSXQncyBhbHJlYWR5IGNsb3Npbmdcblx0XHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0XHRAY2xvc2UoXCJhdXRvXCIsdHJ1ZSlcblx0XHRcdFx0KSwgQFJlYWxUaW1lb3V0XG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiLCB0cnVlKVxuXHRcdGVsc2UgaWYgcGVyY2VudF8gPCAwICAjIEVycm9yXG5cdFx0XHQkKFwiLmJvZHkgLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwic3Ryb2tlXCIsIFwiI2VjNmY0N1wiKS5jc3MoXCJ0cmFuc2l0aW9uXCIsIFwidHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZS1pbi1vdXRcIilcblx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsIG9wYWNpdHk6IDF9XG5cdFx0XHRcdEBlbGVtLnJlbW92ZUNsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIikuYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tZXJyb3JcIilcblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvbiAuaWNvbi1zdWNjZXNzXCIsIEBlbGVtKS5yZW1vdmVDbGFzcyhcImljb24tc3VjY2Vzc1wiKS5odG1sKFwiIVwiKVxuXHRcdFx0KSwgMzAwXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiLCB0cnVlKVxuXHRcdHJldHVybiBAXG5cblx0dXBkYXRlVGV4dDogKHR5cGUpIC0+XG5cdFx0aWYgdHlwZSA9PSBcImVycm9yXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCIhXCIpXG5cdFx0ZWxzZSBpZiB0eXBlID09IFwiZG9uZVwiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIilcblx0XHRlbHNlIGlmIHR5cGUgPT0gXCJwcm9ncmVzc1wiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIilcblx0XHRlbHNlIGlmIHR5cGUgPT0gXCJhc2tcIiB8fCB0eXBlID09IFwibGlzdFwiIHx8IHR5cGUgPT0gXCJwcm9tcHRcIiB8fCB0eXBlID09IFwiY29uZmlybVwiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKFwiP1wiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcImluZm9cIlxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuaHRtbChcImlcIilcblx0XHRlbHNlXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duTm90aWZpY2F0aW9uVHlwZTogVHlwZSBcIit0eXBlK1wiIGlzIG5vdCBrbm93blwiKVxuXG5cdGNsb3NlOiAoZXZlbnQ9XCJhdXRvXCIsY2I9ZmFsc2UpIC0+XG5cdFx0aWYgKGNifHwhQGNhbGxlZClcblx0XHRcdEBjYWxsQmFjayBldmVudFxuXHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgSXQncyBhbHJlYWR5IGNsb3Npbmdcblx0XHRAbWFpbi51bnJlZ2lzdGVyKEBpZClcblx0XHRAZWxlbS5zdG9wKCkuYW5pbWF0ZSB7XCJ3aWR0aFwiOiAwLCBcIm9wYWNpdHlcIjogMH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiXG5cdFx0ZWxlbT1AZWxlbVxuXHRcdEBlbGVtLnNsaWRlVXAgMzAwLCAoLT4gZWxlbS5yZW1vdmUoKSlcblx0XHRyZXR1cm4gQG1haW5cblxud2luZG93Lk5vdGlmaWNhdGlvbnMgPSBOb3RpZmljYXRpb25zXG4iLCJqUXVlcnkuY3NzSG9va3Muc2NhbGUgPSB7XG5cdGdldDogKGVsZW0sIGNvbXB1dGVkKSAtPlxuXHRcdG1hdGNoID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaChcIlswLTlcXC5dK1wiKVxuXHRcdGlmIG1hdGNoXG5cdFx0XHRzY2FsZSA9IHBhcnNlRmxvYXQobWF0Y2hbMF0pXG5cdFx0XHRyZXR1cm4gc2NhbGVcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gMS4wXG5cdHNldDogKGVsZW0sIHZhbCkgLT5cblx0XHR0cmFuc2Zvcm1zID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaCgvWzAtOVxcLl0rL2cpXG5cdFx0aWYgKHRyYW5zZm9ybXMpXG5cdFx0XHR0cmFuc2Zvcm1zWzBdID0gdmFsXG5cdFx0XHR0cmFuc2Zvcm1zWzNdID0gdmFsXG5cdFx0XHRlbGVtLnN0eWxlW3RyYW5zZm9ybV9wcm9wZXJ0eV0gPSAnbWF0cml4KCcrdHJhbnNmb3Jtcy5qb2luKFwiLCBcIikrJyknXG5cdFx0ZWxzZVxuXHRcdFx0ZWxlbS5zdHlsZVt0cmFuc2Zvcm1fcHJvcGVydHldID0gXCJzY2FsZShcIit2YWwrXCIpXCJcbn1cblxualF1ZXJ5LmZ4LnN0ZXAuc2NhbGUgPSAoZngpIC0+XG5cdGpRdWVyeS5jc3NIb29rc1snc2NhbGUnXS5zZXQoZnguZWxlbSwgZngubm93KVxuXG5pZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtKVxuXHR0cmFuc2Zvcm1fcHJvcGVydHkgPSBcInRyYW5zZm9ybVwiXG5lbHNlXG5cdHRyYW5zZm9ybV9wcm9wZXJ0eSA9IFwid2Via2l0VHJhbnNmb3JtXCJcbiIsImpRdWVyeS5mbi5yZWFkZENsYXNzID0gKGNsYXNzX25hbWUpIC0+XG5cdGVsZW0gPSBAXG5cdGVsZW0ucmVtb3ZlQ2xhc3MgY2xhc3NfbmFtZVxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmFkZENsYXNzIGNsYXNzX25hbWVcblx0KSwgMVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4ucmVtb3ZlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5yZW1vdmUoKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5oaWRlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0aWYgZWxlbS5jc3MoXCJvcGFjaXR5XCIpID09IDBcblx0XHRcdGVsZW0uY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uYWRkQ2xhc3NMYXRlciA9IChjbGFzc19uYW1lLCB0aW1lID0gNSkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5hZGRDbGFzcyhjbGFzc19uYW1lKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5jc3NMYXRlciA9IChuYW1lLCB2YWwsIHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uY3NzIG5hbWUsIHZhbFxuXHQpLCB0aW1lXG5cdHJldHVybiBAIl19
