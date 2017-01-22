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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFTOztFQU1IO0lBQ1EsdUJBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ2IsSUFBRyxPQUFPLE1BQVAsS0FBZ0IsVUFBbkI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFOLEVBRFg7O01BRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsOEJBQWY7TUFDQSxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsRUFBVixDQUFhLFFBQWIsRUFBc0IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUFYLENBQWdCLElBQWhCLENBQXRCO01BQ0E7SUFMWTs7NEJBT2IsR0FBQSxHQUFLOzs0QkFFTCxRQUFBLEdBQVUsU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNULElBQUksSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQVQ7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGVBQUEsR0FBZ0IsRUFBaEIsR0FBbUIsd0JBQXpCLEVBRFg7O2FBRUEsSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQUwsR0FBUztJQUhBOzs0QkFLVixHQUFBLEdBQUssU0FBQyxFQUFELEVBQUksRUFBSjtNQUNKLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTixJQUFhLEVBQWpCO0FBQ0MsY0FBVSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBNUIsRUFEWDs7QUFFQSxhQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhSOzs0QkFLTCxVQUFBLEdBQVksU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNYLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVjtBQUNDLGNBQVUsSUFBQSxL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LEVBQUUsQ0FBQyxhQUFWLEdBQTBCLFNBQUMsVUFBRCxFQUFhLElBQWI7QUFDekIsUUFBQTs7TUFEc0MsT0FBTzs7SUFDN0MsSUFBQSxHQUFPO0lBQ1AsVUFBQSxDQUFXLENBQUUsU0FBQTthQUNaLElBQUksQ0FBQyxRQUFMLENBQWMsVUFBZDtJQURZLENBQUYsQ0FBWCxFQUVHLElBRkg7QUFHQSxXQUFPO0VBTGtCOztFQU8xQixNQUFNLENBQUMsRUFBRSxDQUFDLFFBQVYsR0FBcUIsU0FBQyxJQUFELEVBQU8sR0FBUCxFQUFZLElBQVo7QUFDcEIsUUFBQTs7TUFEZ0MsT0FBTzs7SUFDdkMsSUFBQSxHQUFPO0lBQ1AsVUFBQSxDQUFXLENBQUUsU0FBQTthQUNaLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBVCxFQUFlLEdBQWY7SUFEWSxDQUFGLENBQVgsRUFFRyxJQUZIO0FBR0EsV0FBTztFQUxhO0FBOUJyQiIsImZpbGUiOiJ6ZXJvbmV0LW5vdGlmaWNhdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ0ZW1wbGF0ZT1cIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiek5vdGlmaWNhdGlvbnMtbm90aWZpY2F0aW9uXCI+PHNwYW4gY2xhc3M9XCJub3RpZmljYXRpb24taWNvblwiPiE8L3NwYW4+IDxzcGFuIGNsYXNzPVwiYm9keVwiPlRlc3Qgbm90aWZpY2F0aW9uPC9zcGFuPjxhIGNsYXNzPVwiY2xvc2VcIiBocmVmPVwiI0Nsb3NlXCI+JnRpbWVzOzwvYT5cbiAgICAgIDxkaXYgc3R5bGU9XCJjbGVhcjogYm90aFwiPjwvZGl2PlxuICAgIDwvZGl2PlxuXCJcIlwiXG5cbmNsYXNzIE5vdGlmaWNhdGlvbnNcblx0Y29uc3RydWN0b3I6IChAZWxlbSkgLT5cblx0XHRpZiB0eXBlb2YoalF1ZXJ5KSE9XCJmdW5jdGlvblwiXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgUmVxdWlyZWQhXCIpXG5cdFx0QGVsZW0uYWRkQ2xhc3MoXCJ6Tm90aWZpY2F0aW9ucy1ub3RpZmljYXRpb25zXCIpXG5cdFx0JCh3aW5kb3cpLm9uKFwicmVzaXplXCIsQHJlc2l6ZUFsbC5iaW5kKEApKVxuXHRcdEBcblxuXHRpZHM6IHt9XG5cblx0cmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmIChAaWRzW2lkXSlcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuaXF1ZUVycm9yOiBcIitpZCtcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIilcblx0XHRAaWRzW2lkXT1vXG5cblx0Z2V0OiAoaWQsdGgpIC0+XG5cdFx0aWYgKCFAaWRzW2lkXSAmJiB0aClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZEVycm9yOiBcIitpZCtcIiBpcyBub3QgcmVnaXN0ZXJlZFwiKVxuXHRcdHJldHVybiBAaWRzW2lkXVxuXG5cdHVucmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmICghQGlkc1tpZF0pXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmRlZmluZWRFcnJvcjogXCIraWQrXCIgaXMgbm90IHJlZ2lzdGVyZWRcIilcblx0XHRkZWxldGUgQGlkc1tpZF1cblxuXHQjIFRPRE86IGFkZCB1bml0IHRlc3RzXG5cdHRlc3Q6IC0+XG5cdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdEBhZGQoXCJjb25uZWN0aW9uXCIsIFwiZXJyb3JcIiwgXCJDb25uZWN0aW9uIGxvc3QgdG8gPGI+VWlTZXJ2ZXI8L2I+IG9uIDxiPmxvY2FsaG9zdDwvYj4hXCIpXG5cdFx0XHRAYWRkKFwibWVzc2FnZS1BbnlvbmVcIiwgXCJpbmZvXCIsIFwiTmV3ICBmcm9tIDxiPkFueW9uZTwvYj4uXCIpXG5cdFx0KSwgMTAwMFxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImRvbmVcIiwgXCI8Yj5VaVNlcnZlcjwvYj4gY29ubmVjdGlvbiByZWNvdmVyZWQuXCIsIDUwMDApXG5cdFx0KSwgMzAwMFxuXG5cblx0YWRkOiAoaWQsIHR5cGUsIGJvZHksIHRpbWVvdXQ9MCwgb3B0aW9ucz17fSwgY2IpIC0+XG5cdFx0cmV0dXJuIG5ldyBOb3RpZmljYXRpb24gQCwge2lkLHR5cGUsYm9keSx0aW1lb3V0LG9wdGlvbnMsY2J9XG5cblx0Y2xvc2U6IChpZCkgLT5cblx0XHRAZ2V0KGlkLHRydWUpLmNsb3NlKFwic2NyaXB0XCIsdHJ1ZSlcblxuXHRjbG9zZUFsbDogKCkgLT5cblx0XHRtYWluPUBcblx0XHRPYmplY3Qua2V5cyhAaWRzKS5tYXAgKHApIC0+XG5cdFx0XHRtYWluLmNsb3NlIHBcblx0XHRyZXR1cm5cblxuXHRyZXNpemVBbGw6ICgpIC0+XG5cdFx0bWFpbj1AXG5cdFx0T2JqZWN0LmtleXMoQGlkcykubWFwIChwKSAtPlxuXHRcdFx0bWFpbi5nZXQocCx0cnVlKS5yZXNpemVCb3goKVxuXHRcdHJldHVyblxuXG5cdHJhbmRvbUlkOiAtPlxuXHRcdHJldHVybiBcIm1zZ1wiK01hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5yZXBsYWNlKC8wL2csXCJcIikucmVwbGFjZSgvXFwuL2csXCJcIilcblxuXHRkaXNwbGF5TWVzc2FnZTogKHR5cGUsIGJvZHksIHRpbWVvdXQ9MCxjYikgLT5cblx0XHRyZXR1cm4gYWRkKHJhbmRvbUlkKCksdHlwZSxib2R5LHRpbWVvdXQse30sY2IpXG5cblx0ZGlzcGxheUNvbmZpcm06IChtZXNzYWdlLCBjb25maXJtX2xhYmVsLCBjYW5jZWxfbGFiZWw9ZmFsc2UsIGNiKSAtPlxuXHRcdHJldHVybiBhZGQocmFuZG9tSWQoKSxcImNvbmZpcm1cIixtZXNzYWdlLCAwLCB7Y29uZmlybV9sYWJlbCxjYW5jZWxfbGFiZWx9LGNiKVxuXG5cdGRpc3BsYXlQcm9tcHQ6IChtZXNzYWdlLCBjb25maXJtX2xhYmVsLCBjYW5jZWxfbGFiZWw9ZmFsc2UsIGNiKSAtPlxuXHRcdHJldHVybiBhZGQocmFuZG9tSWQoKSxcInByb21wdFwiLG1lc3NhZ2UsIDAsIHtjb25maXJtX2xhYmVsLGNhbmNlbF9sYWJlbH0sY2IpXG5cbmNsYXNzIE5vdGlmaWNhdGlvblxuXHRjb25zdHJ1Y3RvcjogKEBtYWluLG1lc3NhZ2UpIC0+ICMoQGlkLCBAdHlwZSwgQGJvZHksIEB0aW1lb3V0PTApIC0+XG5cdFx0QFxuXG5cdFx0QG1haW5fZWxlbT1AbWFpbi5lbGVtXG5cdFx0QG9wdGlvbnM9bWVzc2FnZS5vcHRpb25zXG5cdFx0QGNiPW1lc3NhZ2UuY2Jcblx0XHRAaWQgPSBtZXNzYWdlLmlkLnJlcGxhY2UgL1teQS1aYS16MC05XS9nLCBcIlwiXG5cblx0XHQjIENsb3NlIG5vdGlmaWNhdGlvbnMgd2l0aCBzYW1lIGlkXG5cdFx0aWYgQG1haW4uZ2V0KEBpZClcblx0XHRcdEBtYWluLmdldChAaWQpLmNsb3NlKClcblxuXG5cdFx0QHR5cGU9bWVzc2FnZS50eXBlXG5cdFx0QFtcImlzXCIrQHR5cGUuc3Vic3RyKDAsMSkudG9VcHBlckNhc2UoKStAdHlwZS5zdWJzdHIoMSldPXRydWVcblxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAUmVhbFRpbWVvdXQ9bWVzc2FnZS50aW1lb3V0ICNwcmV2ZW50IGZyb20gbGF1bmNoaW5nIHRvbyBlYXJseVxuXHRcdGVsc2UgaWYgQGlzSW5wdXQgb3IgQGlzQ29uZmlybSAjaWdub3JlXG5cdFx0ZWxzZVxuXHRcdFx0QFRpbWVvdXQ9bWVzc2FnZS50aW1lb3V0XG5cblx0XHRAbWFpbi5yZWdpc3RlcihAaWQsQCkgI3JlZ2lzdGVyXG5cblx0XHQjIENyZWF0ZSBlbGVtZW50XG5cdFx0QGVsZW0gPSAkKHRlbXBsYXRlKVxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpXG5cdFx0IyBVcGRhdGUgdGV4dFxuXHRcdEB1cGRhdGVUZXh0IEB0eXBlXG5cblx0XHRib2R5PW1lc3NhZ2UuYm9keVxuXHRcdEBib2R5PWJvZHlcblx0XHRAY2xvc2VkPWZhbHNlXG5cblx0XHRAcmVidWlsZE1zZyBcIlwiXG5cblx0XHRAZWxlbS5hcHBlbmRUbyhAbWFpbl9lbGVtKVxuXG5cdFx0IyBUaW1lb3V0XG5cdFx0aWYgQFRpbWVvdXRcblx0XHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgTm8gbmVlZCBvZiBjbG9zZSBidXR0b25cblx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdEBjbG9zZSgpXG5cdFx0XHQpLCBAVGltZW91dFxuXG5cdFx0I0luaXQgbWFpbiBzdHVmZlxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAc2V0UHJvZ3Jlc3MoQG9wdGlvbnMucHJvZ3Jlc3N8fDApXG5cdFx0aWYgQGlzUHJvbXB0XG5cdFx0XHRAYnVpbGRQcm9tcHQoJChcIi5ib2R5XCIsIEBlbGVtKSwgQG9wdGlvbnMuY29uZmlybV9sYWJlbHx8XCJPa1wiLCBAb3B0aW9ucy5jYW5jZWxfbGFiZWx8fGZhbHNlKVxuXHRcdGlmIEBpc0NvbmZpcm1cblx0XHRcdEBidWlsZENvbmZpcm0oJChcIi5ib2R5XCIsIEBlbGVtKSwgQG9wdGlvbnMuY29uZmlybV9sYWJlbHx8XCJPa1wiLCBAb3B0aW9ucy5jYW5jZWxfbGFiZWx8fGZhbHNlKVxuXG5cdFx0IyBBbmltYXRlXG5cdFx0d2lkdGggPSBAZWxlbS5vdXRlcldpZHRoKClcblx0XHQjaWYgbm90IEBUaW1lb3V0IHRoZW4gd2lkdGggKz0gMjAgIyBBZGQgc3BhY2UgZm9yIGNsb3NlIGJ1dHRvblxuXHRcdGlmIEBlbGVtLm91dGVySGVpZ2h0KCkgPiA1NSB0aGVuIEBlbGVtLmFkZENsYXNzKFwibG9uZ1wiKVxuXHRcdEBlbGVtLmNzcyh7XCJ3aWR0aFwiOiBcIjUwcHhcIiwgXCJ0cmFuc2Zvcm1cIjogXCJzY2FsZSgwLjAxKVwifSlcblx0XHRAZWxlbS5hbmltYXRlKHtcInNjYWxlXCI6IDF9LCA4MDAsIFwiZWFzZU91dEVsYXN0aWNcIilcblx0XHRAZWxlbS5hbmltYXRlKHtcIndpZHRoXCI6IHdpZHRofSwgNzAwLCBcImVhc2VJbk91dEN1YmljXCIpXG5cdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5jc3NMYXRlcihcImJveC1zaGFkb3dcIiwgXCIwcHggMHB4IDVweCByZ2JhKDAsMCwwLDAuMSlcIiwgMTAwMClcblx0XHRzZXRUaW1lb3V0KEByZXNpemVCb3guYmluZChAKSwxNTAwKVxuXG5cdFx0IyBDbG9zZSBidXR0b24gb3IgQ29uZmlybSBidXR0b25cblx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoXCJ1c2VyXCIsdHJ1ZSlcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdCQoXCIuek5vdGlmaWNhdGlvbnMtYnV0dG9uXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHQjIFNlbGVjdCBsaXN0XG5cdFx0JChcIi5zZWxlY3RcIiwgQGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjbG9zZSgpXG5cblx0cmVzaXplQm94OiAtPlxuXHRcdEBlbGVtWzBdLnN0eWxlPVwiXCJcblx0XHQjQGVsZW0uY3NzKFwid2lkdGhcIixcImluaGVyaXRcIilcblxuXHRjYWxsQmFjazogKGV2ZW50LHJlcykgLT5cblx0XHRpZiBAY2FsbGVkXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDYWxiYWNrRXJyb3I6IENhbGxiYWNrIHdhcyBjYWxsZWQgdHdpY2VcIilcblx0XHRAY2FsbGVkPXRydWVcblx0XHRpZiB0eXBlb2YoQGNiKSAhPSBcImZ1bmN0aW9uXCJcblx0XHRcdGNvbnNvbGUud2FybihcIlNpbGVudGx5IGZhaWxpbmcgY2FsbGJhY2sgQCAlczogJXMgJiAnJXMnXCIsQGlkLGV2ZW50LHJlcylcblx0XHRcdHJldHVyblxuXHRcdGNvbnNvbGUuaW5mbyhcIkV2ZW50IEAgJXMgJXMgJXNcIixAaWQsZXZlbnQscmVzKVxuXHRcdEBjYihldmVudCxyZXMpXG5cblx0cmVidWlsZE1zZzogKGFwcGVuZCkgLT5cblx0XHRAYXBwZW5kPSQoYXBwZW5kKVxuXHRcdGlmIHR5cGVvZihAYm9keSkgPT0gXCJzdHJpbmdcIlxuXHRcdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5odG1sKFwiPHNwYW4gY2xhc3M9XFxcIm1lc3NhZ2VcXFwiPlwiK0Blc2NhcGUoQGJvZHkpK1wiPC9zcGFuPlwiKS5hcHBlbmQoQGFwcGVuZClcblx0XHRcdGlmIEBpc0xpc3Qgb3IgQGlzUHJvbXB0IG9yIEBpc0NvbmZpcm1cblx0XHRcdFx0JChcIi5tZXNzYWdlXCIsIEBlbGVtKS5hZGRDbGFzcyhcIm1lc3NhZ2Utbm9uLWNlbnRlclwiKVxuXHRcdGVsc2Vcblx0XHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuaHRtbChcIlwiKS5hcHBlbmQoQGJvZHksQGFwcGVuZClcblxuXHRlc2NhcGU6ICh2YWx1ZSkgLT5cbiBcdFx0cmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKS5yZXBsYWNlKC8mbHQ7KFtcXC9dezAsMX0oYnJ8Ynx1fGkpKSZndDsvZywgXCI8JDE+XCIpICMgRXNjYXBlIGFuZCBVbmVzY2FwZSBiLCBpLCB1LCBiciB0YWdzXG5cblx0c2V0Qm9keTogKGJvZHkpIC0+XG5cdFx0QGJvZHk9Ym9keVxuXHRcdGlmIHR5cGVvZihAYm9keSkgPT0gXCJzdHJpbmdcIlxuXHRcdFx0QGJvZHk9JChcIjxzcGFuPlwiK0Blc2NhcGUoQGJvZHkpK1wiPC9zcGFuPlwiKVxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5lbXB0eSgpLmFwcGVuZChAYm9keSlcblx0XHRlbHNlXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmVtcHR5KCkuYXBwZW5kKEBib2R5KVxuXHRcdEByZXNpemVCb3goKVxuXHRcdHJldHVybiBAXG5cblx0YnVpbGRDb25maXJtOiAoYm9keSxjYXB0aW9uLGNhbmNlbD1mYWxzZSkgLT5cblx0XHRidXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FwdGlvbn0nIGNsYXNzPSd6Tm90aWZpY2F0aW9ucy1idXR0b24gek5vdGlmaWNhdGlvbnMtYnV0dG9uLWNvbmZpcm0nPiN7Y2FwdGlvbn08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0YnV0dG9uLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLHRydWVcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nek5vdGlmaWNhdGlvbnMtYnV0dG9uIHpOb3RpZmljYXRpb25zLWJ1dHRvbi1jYW5jZWwnPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGJvZHkuYXBwZW5kKGNCdXR0b24pXG5cblx0XHRidXR0b24uZm9jdXMoKVxuXHRcdCQoXCIubm90aWZpY2F0aW9uXCIpLnNjcm9sbExlZnQoMClcblxuXG5cdGJ1aWxkUHJvbXB0OiAoYm9keSxjYXB0aW9uLGNhbmNlbD1mYWxzZSkgLT5cblx0XHRpbnB1dCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCcgY2xhc3M9J2lucHV0Jy8+XCIpICMgQWRkIGlucHV0XG5cdFx0aW5wdXQub24gXCJrZXl1cFwiLCAoZSkgPT4gIyBTZW5kIG9uIGVudGVyXG5cdFx0XHRpZiBlLmtleUNvZGUgPT0gMTNcblx0XHRcdFx0YnV0dG9uLnRyaWdnZXIgXCJjbGlja1wiICMgUmVzcG9uc2UgdG8gY29uZmlybVxuXHRcdGJvZHkuYXBwZW5kKGlucHV0KVxuXG5cdFx0YnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhcHRpb259JyBjbGFzcz0nek5vdGlmaWNhdGlvbnMtYnV0dG9uIHpOb3RpZmljYXRpb25zLWJ1dHRvbi1jb25maXJtJz4je2NhcHRpb259PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdGJ1dHRvbi5vbiBcImNsaWNrXCIsID0+ICMgUmVzcG9uc2Ugb24gYnV0dG9uIGNsaWNrXG5cdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixpbnB1dC52YWwoKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0Ym9keS5hcHBlbmQoYnV0dG9uKVxuXHRcdGlmIChjYW5jZWwpXG5cdFx0XHRjQnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhbmNlbH0nIGNsYXNzPSd6Tm90aWZpY2F0aW9ucy1idXR0b24gek5vdGlmaWNhdGlvbnMtYnV0dG9uLWNhbmNlbCc+I3tjYW5jZWx9PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdFx0Y0J1dHRvbi5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGZhbHNlXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0Ym9keS5hcHBlbmQoY0J1dHRvbilcblxuXHRcdGlucHV0LmZvY3VzKClcblx0XHQkKFwiLm5vdGlmaWNhdGlvblwiKS5zY3JvbGxMZWZ0KDApXG5cblx0c2V0UHJvZ3Jlc3M6IChwZXJjZW50XykgLT5cblx0XHRpZiB0eXBlb2YocGVyY2VudF8pICE9IFwibnVtYmVyXCJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlR5cGVFcnJvcjogUHJvZ3Jlc3MgbXVzdCBiZSBpbnRcIilcblx0XHRAcmVzaXplQm94KClcblx0XHRwZXJjZW50ID0gTWF0aC5taW4oMTAwLCBwZXJjZW50XykvMTAwXG5cdFx0b2Zmc2V0ID0gNzUtKHBlcmNlbnQqNzUpXG5cdFx0Y2lyY2xlID0gXCJcIlwiXG5cdFx0XHQ8ZGl2IGNsYXNzPVwiY2lyY2xlXCI+PHN2ZyBjbGFzcz1cImNpcmNsZS1zdmdcIiB3aWR0aD1cIjMwXCIgaGVpZ2h0PVwiMzBcIiB2aWV3cG9ydD1cIjAgMCAzMCAzMFwiIHZlcnNpb249XCIxLjFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+XG4gIFx0XHRcdFx0PGNpcmNsZSByPVwiMTJcIiBjeD1cIjE1XCIgY3k9XCIxNVwiIGZpbGw9XCJ0cmFuc3BhcmVudFwiIGNsYXNzPVwiY2lyY2xlLWJnXCI+PC9jaXJjbGU+XG4gIFx0XHRcdFx0PGNpcmNsZSByPVwiMTJcIiBjeD1cIjE1XCIgY3k9XCIxNVwiIGZpbGw9XCJ0cmFuc3BhcmVudFwiIGNsYXNzPVwiY2lyY2xlLWZnXCIgc3R5bGU9XCJzdHJva2UtZGFzaG9mZnNldDogI3tvZmZzZXR9XCI+PC9jaXJjbGU+XG5cdFx0XHQ8L3N2Zz48L2Rpdj5cblx0XHRcIlwiXCJcblx0XHR3aWR0aCA9ICQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkub3V0ZXJXaWR0aCgpXG5cdFx0IyQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuaHRtbChtZXNzYWdlLnBhcmFtc1sxXSlcblx0XHRpZiBub3QgJChcIi5jaXJjbGVcIiwgQGVsZW0pLmxlbmd0aFxuXHRcdFx0QHJlYnVpbGRNc2cgY2lyY2xlXG5cdFx0aWYgJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5jc3MoXCJ3aWR0aFwiKSA9PSBcIlwiXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmNzcyhcIndpZHRoXCIsIHdpZHRoKVxuXHRcdCQoXCIuYm9keSAuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJzdHJva2UtZGFzaG9mZnNldFwiLCBvZmZzZXQpXG5cdFx0aWYgcGVyY2VudCA+IDBcblx0XHRcdCQoXCIuYm9keSAuY2lyY2xlLWJnXCIsIEBlbGVtKS5jc3Mge1wiYW5pbWF0aW9uLXBsYXktc3RhdGVcIjogXCJwYXVzZWRcIiwgXCJzdHJva2UtZGFzaGFycmF5XCI6IFwiMTgwcHhcIn1cblxuXHRcdGlmICQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRlbHNlIGlmIHBlcmNlbnRfID49IDEwMCAgIyBEb25lXG5cdFx0XHQkKFwiLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwidHJhbnNpdGlvblwiLCBcImFsbCAwLjNzIGVhc2UtaW4tb3V0XCIpXG5cdFx0XHRzZXRUaW1lb3V0ICgtPlxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJzY2FsZSgxKVwiLCBvcGFjaXR5OiAxfVxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uIC5pY29uLXN1Y2Nlc3NcIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInJvdGF0ZSg0NWRlZykgc2NhbGUoMSlcIn1cblx0XHRcdCksIDMwMFxuXHRcdFx0aWYgQFJlYWxUaW1lb3V0XG5cdFx0XHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgSXQncyBhbHJlYWR5IGNsb3Npbmdcblx0XHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0XHRAY2xvc2UoXCJhdXRvXCIsdHJ1ZSlcblx0XHRcdFx0KSwgQFJlYWxUaW1lb3V0XG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiLCB0cnVlKVxuXHRcdGVsc2UgaWYgcGVyY2VudF8gPCAwICAjIEVycm9yXG5cdFx0XHQkKFwiLmJvZHkgLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwic3Ryb2tlXCIsIFwiI2VjNmY0N1wiKS5jc3MoXCJ0cmFuc2l0aW9uXCIsIFwidHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZS1pbi1vdXRcIilcblx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsIG9wYWNpdHk6IDF9XG5cdFx0XHRcdEBlbGVtLnJlbW92ZUNsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIikuYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tZXJyb3JcIilcblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvbiAuaWNvbi1zdWNjZXNzXCIsIEBlbGVtKS5yZW1vdmVDbGFzcyhcImljb24tc3VjY2Vzc1wiKS5odG1sKFwiIVwiKVxuXHRcdFx0KSwgMzAwXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiLCB0cnVlKVxuXHRcdHJldHVybiBAXG5cblx0c2V0RGVzaWduOiAoY2hhcix0eXBlKSAtPlxuXHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoY2hhcilcblx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1cIit0eXBlKVxuXG5cdHVwZGF0ZVRleHQ6ICh0eXBlKSAtPlxuXHRcdHN3aXRjaCh0eXBlKVxuXHRcdFx0d2hlbiBcImVycm9yXCIgdGhlbiBAc2V0RGVzaWduIFwiIVwiLFwiZXJyb3JcIlxuXHRcdFx0d2hlbiBcImRvbmVcIiB0aGVuIEBzZXREZXNpZ24gXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiLFwiZG9uZVwiXG5cdFx0XHR3aGVuIFwicHJvZ3Jlc3NcIiB0aGVuIEBzZXREZXNpZ24gXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiLFwicHJvZ3Jlc3NcIlxuXHRcdFx0d2hlbiBcImFza1wiLCBcImxpc3RcIiwgXCJwcm9tcHRcIiwgXCJjb25maXJtXCIgdGhlbiBAc2V0RGVzaWduIFwiP1wiLFwiYXNrXCJcblx0XHRcdHdoZW4gXCJpbmZvXCIgdGhlbiBAc2V0RGVzaWduIFwiaVwiLFwiaW5mb1wiXG5cdFx0XHRlbHNlIHRocm93IG5ldyBFcnJvcihcIlVua25vd25Ob3RpZmljYXRpb25UeXBlOiBUeXBlIFwiK3R5cGUrXCIgaXMgbm90IGtub3duXCIpXG5cblx0Y2xvc2U6IChldmVudD1cImF1dG9cIixjYj1mYWxzZSkgLT5cblx0XHRpZiBAY2xvc2VkXG5cdFx0XHRyZXR1cm5cblx0XHRAY2xvc2VkPXRydWVcblx0XHRpZiAoY2J8fCFAY2FsbGVkKVxuXHRcdFx0QGNhbGxCYWNrIGV2ZW50XG5cdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBJdCdzIGFscmVhZHkgY2xvc2luZ1xuXHRcdEBtYWluLnVucmVnaXN0ZXIoQGlkKVxuXHRcdEBlbGVtLnN0b3AoKS5hbmltYXRlIHtcIndpZHRoXCI6IDAsIFwib3BhY2l0eVwiOiAwfSwgNzAwLCBcImVhc2VJbk91dEN1YmljXCJcblx0XHRlbGVtPUBlbGVtXG5cdFx0QGVsZW0uc2xpZGVVcCAzMDAsICgtPiBlbGVtLnJlbW92ZSgpKVxuXHRcdHJldHVybiBAbWFpblxuXG53aW5kb3cuTm90aWZpY2F0aW9ucyA9IE5vdGlmaWNhdGlvbnNcbiIsImpRdWVyeS5jc3NIb29rcy5zY2FsZSA9IHtcblx0Z2V0OiAoZWxlbSwgY29tcHV0ZWQpIC0+XG5cdFx0bWF0Y2ggPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVt0cmFuc2Zvcm1fcHJvcGVydHldLm1hdGNoKFwiWzAtOVxcLl0rXCIpXG5cdFx0aWYgbWF0Y2hcblx0XHRcdHNjYWxlID0gcGFyc2VGbG9hdChtYXRjaFswXSlcblx0XHRcdHJldHVybiBzY2FsZVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAxLjBcblx0c2V0OiAoZWxlbSwgdmFsKSAtPlxuXHRcdHRyYW5zZm9ybXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVt0cmFuc2Zvcm1fcHJvcGVydHldLm1hdGNoKC9bMC05XFwuXSsvZylcblx0XHRpZiAodHJhbnNmb3Jtcylcblx0XHRcdHRyYW5zZm9ybXNbMF0gPSB2YWxcblx0XHRcdHRyYW5zZm9ybXNbM10gPSB2YWxcblx0XHRcdGVsZW0uc3R5bGVbdHJhbnNmb3JtX3Byb3BlcnR5XSA9ICdtYXRyaXgoJyt0cmFuc2Zvcm1zLmpvaW4oXCIsIFwiKSsnKSdcblx0XHRlbHNlXG5cdFx0XHRlbGVtLnN0eWxlW3RyYW5zZm9ybV9wcm9wZXJ0eV0gPSBcInNjYWxlKFwiK3ZhbCtcIilcIlxufVxuXG5qUXVlcnkuZnguc3RlcC5zY2FsZSA9IChmeCkgLT5cblx0alF1ZXJ5LmNzc0hvb2tzWydzY2FsZSddLnNldChmeC5lbGVtLCBmeC5ub3cpXG5cbmlmICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KS50cmFuc2Zvcm0pXG5cdHRyYW5zZm9ybV9wcm9wZXJ0eSA9IFwidHJhbnNmb3JtXCJcbmVsc2Vcblx0dHJhbnNmb3JtX3Byb3BlcnR5ID0gXCJ3ZWJraXRUcmFuc2Zvcm1cIlxuIiwialF1ZXJ5LmZuLnJlYWRkQ2xhc3MgPSAoY2xhc3NfbmFtZSkgLT5cblx0ZWxlbSA9IEBcblx0ZWxlbS5yZW1vdmVDbGFzcyBjbGFzc19uYW1lXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uYWRkQ2xhc3MgY2xhc3NfbmFtZVxuXHQpLCAxXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5yZW1vdmVMYXRlciA9ICh0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLnJlbW92ZSgpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmhpZGVMYXRlciA9ICh0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRpZiBlbGVtLmNzcyhcIm9wYWNpdHlcIikgPT0gMFxuXHRcdFx0ZWxlbS5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5hZGRDbGFzc0xhdGVyID0gKGNsYXNzX25hbWUsIHRpbWUgPSA1KSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmFkZENsYXNzKGNsYXNzX25hbWUpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmNzc0xhdGVyID0gKG5hbWUsIHZhbCwgdGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5jc3MgbmFtZSwgdmFsXG5cdCksIHRpbWVcblx0cmV0dXJuIEAiXX0=
