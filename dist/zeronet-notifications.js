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

    Notifications.prototype.randomId = function() {
      return "msg" + Math.random().toString().replace(/0/g, "").replace(/./g, "");
    };

    Notifications.prototype.displayMessage = function(type, body, timeout, cb) {
      return add(randomId(), type, body, timeout, {}, cb);
    };

    Notifications.prototype.displayConfirm = function(message, caption, cancel, cb) {
      if (cancel == null) {
        cancel = false;
      }
      return add(randomId(), "confirm", message, 0, {
        confirm_label: caption,
        cancel_label: cancel
      }, cb);
    };

    Notifications.prototype.displayPrompt = function(message, caption, cancel, cb) {
      if (cancel == null) {
        cancel = false;
      }
      return add(randomId(), "prompt", message, 0, {
        confirm_label: caption,
        cancel_label: cancel
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
      setTimeout((function() {
        return console.log(this.id);
      }).bind(this), 1500);
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFTOztFQU1IO0lBQ1EsdUJBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ2IsSUFBRyxPQUFPLE1BQVAsS0FBZ0IsVUFBbkI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFOLEVBRFg7O01BRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsOEJBQWY7TUFDQTtJQUpZOzs0QkFNYixHQUFBLEdBQUs7OzRCQUVMLFFBQUEsR0FBVSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1QsSUFBSSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVDtBQUNDLGNBQVUsSUFBQSxLQUFBLENBQU0sZUFBQSxHQUFnQixFQUFoQixHQUFtQix3QkFBekIsRUFEWDs7YUFFQSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTCxHQUFTO0lBSEE7OzRCQUtWLEdBQUEsR0FBSyxTQUFDLEVBQUQsRUFBSSxFQUFKO01BQ0osSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFOLElBQWEsRUFBakI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFBLEdBQW1CLEVBQW5CLEdBQXNCLG9CQUE1QixFQURYOztBQUVBLGFBQU8sSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBO0lBSFI7OzRCQUtMLFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1gsSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFWO0FBQ0MsY0FBVSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBNUIsRUFEWDs7YUFFQSxPQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhEOzs0QkFNWixJ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QUUsU0FBQTthQUNaLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBVCxFQUFlLEdBQWY7SUFEWSxDQUFGLENBQVgsRUFFRyxJQUZIO0FBR0EsV0FBTztFQUxhO0FBOUJyQiIsImZpbGUiOiJ6ZXJvbmV0LW5vdGlmaWNhdGlvbnMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ0ZW1wbGF0ZT1cIlwiXCJcbiAgICA8ZGl2IGNsYXNzPVwiek5vdGlmaWNhdGlvbnMtbm90aWZpY2F0aW9uXCI+PHNwYW4gY2xhc3M9XCJub3RpZmljYXRpb24taWNvblwiPiE8L3NwYW4+IDxzcGFuIGNsYXNzPVwiYm9keVwiPlRlc3Qgbm90aWZpY2F0aW9uPC9zcGFuPjxhIGNsYXNzPVwiY2xvc2VcIiBocmVmPVwiI0Nsb3NlXCI+JnRpbWVzOzwvYT5cbiAgICAgIDxkaXYgc3R5bGU9XCJjbGVhcjogYm90aFwiPjwvZGl2PlxuICAgIDwvZGl2PlxuXCJcIlwiXG5cbmNsYXNzIE5vdGlmaWNhdGlvbnNcblx0Y29uc3RydWN0b3I6IChAZWxlbSkgLT5cblx0XHRpZiB0eXBlb2YoalF1ZXJ5KSE9XCJmdW5jdGlvblwiXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJqUXVlcnkgUmVxdWlyZWQhXCIpXG5cdFx0QGVsZW0uYWRkQ2xhc3MoXCJ6Tm90aWZpY2F0aW9ucy1ub3RpZmljYXRpb25zXCIpXG5cdFx0QFxuXG5cdGlkczoge31cblxuXHRyZWdpc3RlcjogKGlkLG8pIC0+XG5cdFx0aWYgKEBpZHNbaWRdKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVW5pcXVlRXJyb3I6IFwiK2lkK1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKVxuXHRcdEBpZHNbaWRdPW9cblxuXHRnZXQ6IChpZCx0aCkgLT5cblx0XHRpZiAoIUBpZHNbaWRdICYmIHRoKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkRXJyb3I6IFwiK2lkK1wiIGlzIG5vdCByZWdpc3RlcmVkXCIpXG5cdFx0cmV0dXJuIEBpZHNbaWRdXG5cblx0dW5yZWdpc3RlcjogKGlkLG8pIC0+XG5cdFx0aWYgKCFAaWRzW2lkXSlcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZEVycm9yOiBcIitpZCtcIiBpcyBub3QgcmVnaXN0ZXJlZFwiKVxuXHRcdGRlbGV0ZSBAaWRzW2lkXVxuXG5cdCMgVE9ETzogYWRkIHVuaXQgdGVzdHNcblx0dGVzdDogLT5cblx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0QGFkZChcImNvbm5lY3Rpb25cIiwgXCJlcnJvclwiLCBcIkNvbm5lY3Rpb24gbG9zdCB0byA8Yj5VaVNlcnZlcjwvYj4gb24gPGI+bG9jYWxob3N0PC9iPiFcIilcblx0XHRcdEBhZGQoXCJtZXNzYWdlLUFueW9uZVwiLCBcImluZm9cIiwgXCJOZXcgIGZyb20gPGI+QW55b25lPC9iPi5cIilcblx0XHQpLCAxMDAwXG5cdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdEBhZGQoXCJjb25uZWN0aW9uXCIsIFwiZG9uZVwiLCBcIjxiPlVpU2VydmVyPC9iPiBjb25uZWN0aW9uIHJlY292ZXJlZC5cIiwgNTAwMClcblx0XHQpLCAzMDAwXG5cblxuXHRhZGQ6IChpZCwgdHlwZSwgYm9keSwgdGltZW91dD0wLCBvcHRpb25zPXt9LCBjYikgLT5cblx0XHRyZXR1cm4gbmV3IE5vdGlmaWNhdGlvbiBALCB7aWQsdHlwZSxib2R5LHRpbWVvdXQsb3B0aW9ucyxjYn1cblxuXHRjbG9zZTogKGlkKSAtPlxuXHRcdEBnZXQoaWQsdHJ1ZSkuY2xvc2UoXCJzY3JpcHRcIix0cnVlKVxuXG5cdGNsb3NlQWxsOiAoKSAtPlxuXHRcdG1haW49QFxuXHRcdE9iamVjdC5rZXlzKEBpZHMpLm1hcCAocCkgLT5cblx0XHRcdG1haW4uY2xvc2UgcFxuXHRcdHJldHVyblxuXG5cdHJhbmRvbUlkOiAtPlxuXHRcdHJldHVybiBcIm1zZ1wiK01hdGgucmFuZG9tKCkudG9TdHJpbmcoKS5yZXBsYWNlKC8wL2csXCJcIikucmVwbGFjZSgvLi9nLFwiXCIpXG5cblx0ZGlzcGxheU1lc3NhZ2U6ICh0eXBlLCBib2R5LCB0aW1lb3V0LGNiKSAtPlxuXHRcdHJldHVybiBhZGQocmFuZG9tSWQoKSx0eXBlLGJvZHksdGltZW91dCx7fSxjYilcblxuXHRkaXNwbGF5Q29uZmlybTogKG1lc3NhZ2UsIGNhcHRpb24sIGNhbmNlbD1mYWxzZSwgY2IpIC0+XG5cdFx0cmV0dXJuIGFkZChyYW5kb21JZCgpLFwiY29uZmlybVwiLG1lc3NhZ2UsIDAsIHtjb25maXJtX2xhYmVsOmNhcHRpb24sY2FuY2VsX2xhYmVsOmNhbmNlbH0sY2IpXG5cblx0ZGlzcGxheVByb21wdDogKG1lc3NhZ2UsIGNhcHRpb24sIGNhbmNlbD1mYWxzZSwgY2IpIC0+XG5cdFx0cmV0dXJuIGFkZChyYW5kb21JZCgpLFwicHJvbXB0XCIsbWVzc2FnZSwgMCwge2NvbmZpcm1fbGFiZWw6Y2FwdGlvbixjYW5jZWxfbGFiZWw6Y2FuY2VsfSxjYilcblxuY2xhc3MgTm90aWZpY2F0aW9uXG5cdGNvbnN0cnVjdG9yOiAoQG1haW4sbWVzc2FnZSkgLT4gIyhAaWQsIEB0eXBlLCBAYm9keSwgQHRpbWVvdXQ9MCkgLT5cblx0XHRAXG5cblx0XHRAbWFpbl9lbGVtPUBtYWluLmVsZW1cblx0XHRAb3B0aW9ucz1tZXNzYWdlLm9wdGlvbnNcblx0XHRAY2I9bWVzc2FnZS5jYlxuXHRcdEBpZCA9IG1lc3NhZ2UuaWQucmVwbGFjZSAvW15BLVphLXowLTldL2csIFwiXCJcblxuXHRcdCMgQ2xvc2Ugbm90aWZpY2F0aW9ucyB3aXRoIHNhbWUgaWRcblx0XHRpZiBAbWFpbi5nZXQoQGlkKVxuXHRcdFx0QG1haW4uZ2V0KEBpZCkuY2xvc2UoKVxuXG5cblx0XHRAdHlwZT1tZXNzYWdlLnR5cGVcblx0XHRAW1wiaXNcIitAdHlwZS5zdWJzdHIoMCwxKS50b1VwcGVyQ2FzZSgpK0B0eXBlLnN1YnN0cigxKV09dHJ1ZVxuXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBSZWFsVGltZW91dD1tZXNzYWdlLnRpbWVvdXQgI3ByZXZlbnQgZnJvbSBsYXVuY2hpbmcgdG9vIGVhcmx5XG5cdFx0ZWxzZSBpZiBAaXNJbnB1dCBvciBAaXNDb25maXJtICNpZ25vcmVcblx0XHRlbHNlXG5cdFx0XHRAVGltZW91dD1tZXNzYWdlLnRpbWVvdXRcblxuXHRcdEBtYWluLnJlZ2lzdGVyKEBpZCxAKSAjcmVnaXN0ZXJcblxuXHRcdCMgQ3JlYXRlIGVsZW1lbnRcblx0XHRAZWxlbSA9ICQodGVtcGxhdGUpXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBlbGVtLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIilcblx0XHQjIFVwZGF0ZSB0ZXh0XG5cdFx0QHVwZGF0ZVRleHQgQHR5cGVcblxuXHRcdGJvZHk9bWVzc2FnZS5ib2R5XG5cdFx0QGJvZHk9Ym9keVxuXHRcdEBjbG9zZWQ9ZmFsc2VcblxuXHRcdEByZWJ1aWxkTXNnIFwiXCJcblxuXHRcdEBlbGVtLmFwcGVuZFRvKEBtYWluX2VsZW0pXG5cblx0XHQjIFRpbWVvdXRcblx0XHRpZiBAVGltZW91dFxuXHRcdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBObyBuZWVkIG9mIGNsb3NlIGJ1dHRvblxuXHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0QGNsb3NlKClcblx0XHRcdCksIEBUaW1lb3V0XG5cblx0XHQjSW5pdCBtYWluIHN0dWZmXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBzZXRQcm9ncmVzcyhAb3B0aW9ucy5wcm9ncmVzc3x8MClcblx0XHRpZiBAaXNQcm9tcHRcblx0XHRcdEBidWlsZFByb21wdCgkKFwiLmJvZHlcIiwgQGVsZW0pLCBAb3B0aW9ucy5jb25maXJtX2xhYmVsfHxcIk9rXCIsIEBvcHRpb25zLmNhbmNlbF9sYWJlbHx8ZmFsc2UpXG5cdFx0aWYgQGlzQ29uZmlybVxuXHRcdFx0QGJ1aWxkQ29uZmlybSgkKFwiLmJvZHlcIiwgQGVsZW0pLCBAb3B0aW9ucy5jb25maXJtX2xhYmVsfHxcIk9rXCIsIEBvcHRpb25zLmNhbmNlbF9sYWJlbHx8ZmFsc2UpXG5cblx0XHQjIEFuaW1hdGVcblx0XHR3aWR0aCA9IEBlbGVtLm91dGVyV2lkdGgoKVxuXHRcdCNpZiBub3QgQFRpbWVvdXQgdGhlbiB3aWR0aCArPSAyMCAjIEFkZCBzcGFjZSBmb3IgY2xvc2UgYnV0dG9uXG5cdFx0aWYgQGVsZW0ub3V0ZXJIZWlnaHQoKSA+IDU1IHRoZW4gQGVsZW0uYWRkQ2xhc3MoXCJsb25nXCIpXG5cdFx0QGVsZW0uY3NzKHtcIndpZHRoXCI6IFwiNTBweFwiLCBcInRyYW5zZm9ybVwiOiBcInNjYWxlKDAuMDEpXCJ9KVxuXHRcdEBlbGVtLmFuaW1hdGUoe1wic2NhbGVcIjogMX0sIDgwMCwgXCJlYXNlT3V0RWxhc3RpY1wiKVxuXHRcdEBlbGVtLmFuaW1hdGUoe1wid2lkdGhcIjogd2lkdGh9LCA3MDAsIFwiZWFzZUluT3V0Q3ViaWNcIilcblx0XHQkKFwiLmJvZHlcIiwgQGVsZW0pLmNzc0xhdGVyKFwiYm94LXNoYWRvd1wiLCBcIjBweCAwcHggNXB4IHJnYmEoMCwwLDAsMC4xKVwiLCAxMDAwKVxuXHRcdHNldFRpbWVvdXQoQHJlc2l6ZUJveC5iaW5kKEApLDE1MDApXG5cdFx0c2V0VGltZW91dCgoIC0+IGNvbnNvbGUubG9nIEBpZCkuYmluZChAKSwxNTAwKVxuXG5cdFx0IyBDbG9zZSBidXR0b24gb3IgQ29uZmlybSBidXR0b25cblx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoXCJ1c2VyXCIsdHJ1ZSlcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdCQoXCIuek5vdGlmaWNhdGlvbnMtYnV0dG9uXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHQjIFNlbGVjdCBsaXN0XG5cdFx0JChcIi5zZWxlY3RcIiwgQGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjbG9zZSgpXG5cblx0cmVzaXplQm94OiAtPlxuXHRcdEBlbGVtLmNzcyhcIndpZHRoXCIsXCJpbmhlcml0XCIpXG5cblx0Y2FsbEJhY2s6IChldmVudCxyZXMpIC0+XG5cdFx0aWYgQGNhbGxlZFxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FsYmFja0Vycm9yOiBDYWxsYmFjayB3YXMgY2FsbGVkIHR3aWNlXCIpXG5cdFx0QGNhbGxlZD10cnVlXG5cdFx0aWYgdHlwZW9mKEBjYikgIT0gXCJmdW5jdGlvblwiXG5cdFx0XHRjb25zb2xlLndhcm4oXCJTaWxlbnRseSBmYWlsaW5nIGNhbGxiYWNrIEAgJXM6ICVzICYgJyVzJ1wiLEBpZCxldmVudCxyZXMpXG5cdFx0XHRyZXR1cm5cblx0XHRjb25zb2xlLmluZm8oXCJFdmVudCBAICVzICVzICVzXCIsQGlkLGV2ZW50LHJlcylcblx0XHRAY2IoZXZlbnQscmVzKVxuXG5cdHJlYnVpbGRNc2c6IChhcHBlbmQpIC0+XG5cdFx0QGFwcGVuZD0kKGFwcGVuZClcblx0XHRpZiB0eXBlb2YoQGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuaHRtbChcIjxzcGFuIGNsYXNzPSdtZXNzYWdlJz5cIitAZXNjYXBlKEBib2R5KStcIjwvc3Bhbj5cIikuYXBwZW5kKEBhcHBlbmQpXG5cdFx0ZWxzZVxuXHRcdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5odG1sKFwiXCIpLmFwcGVuZChAYm9keSxAYXBwZW5kKVxuXG5cdGVzY2FwZTogKHZhbHVlKSAtPlxuIFx0XHRyZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpLnJlcGxhY2UoLyZsdDsoW1xcL117MCwxfShicnxifHV8aSkpJmd0Oy9nLCBcIjwkMT5cIikgIyBFc2NhcGUgYW5kIFVuZXNjYXBlIGIsIGksIHUsIGJyIHRhZ3NcblxuXHRzZXRCb2R5OiAoYm9keSkgLT5cblx0XHRAYm9keT1ib2R5XG5cdFx0aWYgdHlwZW9mKEBib2R5KSA9PSBcInN0cmluZ1wiXG5cdFx0XHRAYm9keT0kKFwiPHNwYW4+XCIrQGVzY2FwZShAYm9keSkrXCI8L3NwYW4+XCIpXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmVtcHR5KCkuYXBwZW5kKEBib2R5KVxuXHRcdGVsc2Vcblx0XHRcdCQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuZW1wdHkoKS5hcHBlbmQoQGJvZHkpXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cmV0dXJuIEBcblxuXHRidWlsZENvbmZpcm06IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J3pOb3RpZmljYXRpb25zLWJ1dHRvbiB6Tm90aWZpY2F0aW9ucy1idXR0b24tY29uZmlybSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsdHJ1ZVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0Ym9keS5hcHBlbmQoYnV0dG9uKVxuXHRcdGlmIChjYW5jZWwpXG5cdFx0XHRjQnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhbmNlbH0nIGNsYXNzPSd6Tm90aWZpY2F0aW9ucy1idXR0b24gek5vdGlmaWNhdGlvbnMtYnV0dG9uLWNhbmNlbCc+I3tjYW5jZWx9PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdFx0Y0J1dHRvbi5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGZhbHNlXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0Ym9keS5hcHBlbmQoY0J1dHRvbilcblxuXHRcdGJ1dHRvbi5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cblx0YnVpbGRQcm9tcHQ6IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGlucHV0ID0gJChcIjxpbnB1dCB0eXBlPSd0ZXh0JyBjbGFzcz0naW5wdXQnLz5cIikgIyBBZGQgaW5wdXRcblx0XHRpbnB1dC5vbiBcImtleXVwXCIsIChlKSA9PiAjIFNlbmQgb24gZW50ZXJcblx0XHRcdGlmIGUua2V5Q29kZSA9PSAxM1xuXHRcdFx0XHRidXR0b24udHJpZ2dlciBcImNsaWNrXCIgIyBSZXNwb25zZSB0byBjb25maXJtXG5cdFx0Ym9keS5hcHBlbmQoaW5wdXQpXG5cblx0XHRidXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FwdGlvbn0nIGNsYXNzPSd6Tm90aWZpY2F0aW9ucy1idXR0b24gek5vdGlmaWNhdGlvbnMtYnV0dG9uLWNvbmZpcm0nPiN7Y2FwdGlvbn08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0YnV0dG9uLm9uIFwiY2xpY2tcIiwgPT4gIyBSZXNwb25zZSBvbiBidXR0b24gY2xpY2tcblx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGlucHV0LnZhbCgpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRib2R5LmFwcGVuZChidXR0b24pXG5cdFx0aWYgKGNhbmNlbClcblx0XHRcdGNCdXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FuY2VsfScgY2xhc3M9J3pOb3RpZmljYXRpb25zLWJ1dHRvbiB6Tm90aWZpY2F0aW9ucy1idXR0b24tY2FuY2VsJz4je2NhbmNlbH08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0XHRjQnV0dG9uLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsZmFsc2Vcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRib2R5LmFwcGVuZChjQnV0dG9uKVxuXG5cdFx0aW5wdXQuZm9jdXMoKVxuXHRcdCQoXCIubm90aWZpY2F0aW9uXCIpLnNjcm9sbExlZnQoMClcblxuXHRzZXRQcm9ncmVzczogKHBlcmNlbnRfKSAtPlxuXHRcdGlmIHR5cGVvZihwZXJjZW50XykgIT0gXCJudW1iZXJcIlxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVHlwZUVycm9yOiBQcm9ncmVzcyBtdXN0IGJlIGludFwiKVxuXHRcdEByZXNpemVCb3goKVxuXHRcdHBlcmNlbnQgPSBNYXRoLm1pbigxMDAsIHBlcmNlbnRfKS8xMDBcblx0XHRvZmZzZXQgPSA3NS0ocGVyY2VudCo3NSlcblx0XHRjaXJjbGUgPSBcIlwiXCJcblx0XHRcdDxkaXYgY2xhc3M9XCJjaXJjbGVcIj48c3ZnIGNsYXNzPVwiY2lyY2xlLXN2Z1wiIHdpZHRoPVwiMzBcIiBoZWlnaHQ9XCIzMFwiIHZpZXdwb3J0PVwiMCAwIDMwIDMwXCIgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgXHRcdFx0XHQ8Y2lyY2xlIHI9XCIxMlwiIGN4PVwiMTVcIiBjeT1cIjE1XCIgZmlsbD1cInRyYW5zcGFyZW50XCIgY2xhc3M9XCJjaXJjbGUtYmdcIj48L2NpcmNsZT5cbiAgXHRcdFx0XHQ8Y2lyY2xlIHI9XCIxMlwiIGN4PVwiMTVcIiBjeT1cIjE1XCIgZmlsbD1cInRyYW5zcGFyZW50XCIgY2xhc3M9XCJjaXJjbGUtZmdcIiBzdHlsZT1cInN0cm9rZS1kYXNob2Zmc2V0OiAje29mZnNldH1cIj48L2NpcmNsZT5cblx0XHRcdDwvc3ZnPjwvZGl2PlxuXHRcdFwiXCJcIlxuXHRcdHdpZHRoID0gJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5vdXRlcldpZHRoKClcblx0XHQjJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5odG1sKG1lc3NhZ2UucGFyYW1zWzFdKVxuXHRcdGlmIG5vdCAkKFwiLmNpcmNsZVwiLCBAZWxlbSkubGVuZ3RoXG5cdFx0XHRAcmVidWlsZE1zZyBjaXJjbGVcblx0XHRpZiAkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmNzcyhcIndpZHRoXCIpID09IFwiXCJcblx0XHRcdCQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuY3NzKFwid2lkdGhcIiwgd2lkdGgpXG5cdFx0JChcIi5ib2R5IC5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInN0cm9rZS1kYXNob2Zmc2V0XCIsIG9mZnNldClcblx0XHRpZiBwZXJjZW50ID4gMFxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtYmdcIiwgQGVsZW0pLmNzcyB7XCJhbmltYXRpb24tcGxheS1zdGF0ZVwiOiBcInBhdXNlZFwiLCBcInN0cm9rZS1kYXNoYXJyYXlcIjogXCIxODBweFwifVxuXG5cdFx0aWYgJChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIilcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGVsc2UgaWYgcGVyY2VudF8gPj0gMTAwICAjIERvbmVcblx0XHRcdCQoXCIuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDAuM3MgZWFzZS1pbi1vdXRcIilcblx0XHRcdHNldFRpbWVvdXQgKC0+XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsIG9wYWNpdHk6IDF9XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb24gLmljb24tc3VjY2Vzc1wiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwicm90YXRlKDQ1ZGVnKSBzY2FsZSgxKVwifVxuXHRcdFx0KSwgMzAwXG5cdFx0XHRpZiBAUmVhbFRpbWVvdXRcblx0XHRcdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBJdCdzIGFscmVhZHkgY2xvc2luZ1xuXHRcdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHRcdEBjbG9zZShcImF1dG9cIix0cnVlKVxuXHRcdFx0XHQpLCBAUmVhbFRpbWVvdXRcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIsIHRydWUpXG5cdFx0ZWxzZSBpZiBwZXJjZW50XyA8IDAgICMgRXJyb3Jcblx0XHRcdCQoXCIuYm9keSAuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJzdHJva2VcIiwgXCIjZWM2ZjQ3XCIpLmNzcyhcInRyYW5zaXRpb25cIiwgXCJ0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlLWluLW91dFwiKVxuXHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwic2NhbGUoMSlcIiwgb3BhY2l0eTogMX1cblx0XHRcdFx0QGVsZW0ucmVtb3ZlQ2xhc3MoXCJub3RpZmljYXRpb24tZG9uZVwiKS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1lcnJvclwiKVxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uIC5pY29uLXN1Y2Nlc3NcIiwgQGVsZW0pLnJlbW92ZUNsYXNzKFwiaWNvbi1zdWNjZXNzXCIpLmh0bWwoXCIhXCIpXG5cdFx0XHQpLCAzMDBcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIsIHRydWUpXG5cdFx0cmV0dXJuIEBcblxuXHRzZXREZXNpZ246IChjaGFyLHR5cGUpIC0+XG5cdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuaHRtbChjaGFyKVxuXHRcdEBlbGVtLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLVwiK3R5cGUpXG5cblx0dXBkYXRlVGV4dDogKHR5cGUpIC0+XG5cdFx0c3dpdGNoKHR5cGUpXG5cdFx0XHR3aGVuIFwiZXJyb3JcIiB0aGVuIEBzZXREZXNpZ24gXCIhXCIsXCJlcnJvclwiXG5cdFx0XHR3aGVuIFwiZG9uZVwiIHRoZW4gQHNldERlc2lnbiBcIjxkaXYgY2xhc3M9J2ljb24tc3VjY2Vzcyc+PC9kaXY+XCIsXCJkb25lXCJcblx0XHRcdHdoZW4gXCJwcm9ncmVzc1wiIHRoZW4gQHNldERlc2lnbiBcIjxkaXYgY2xhc3M9J2ljb24tc3VjY2Vzcyc+PC9kaXY+XCIsXCJwcm9ncmVzc1wiXG5cdFx0XHR3aGVuIFwiYXNrXCIsIFwibGlzdFwiLCBcInByb21wdFwiLCBcImNvbmZpcm1cIiB0aGVuIEBzZXREZXNpZ24gXCI/XCIsXCJhc2tcIlxuXHRcdFx0d2hlbiBcImluZm9cIiB0aGVuIEBzZXREZXNpZ24gXCJpXCIsXCJpbmZvXCJcblx0XHRcdGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93bk5vdGlmaWNhdGlvblR5cGU6IFR5cGUgXCIrdHlwZStcIiBpcyBub3Qga25vd25cIilcblxuXHRjbG9zZTogKGV2ZW50PVwiYXV0b1wiLGNiPWZhbHNlKSAtPlxuXHRcdGlmIEBjbG9zZWRcblx0XHRcdHJldHVyblxuXHRcdEBjbG9zZWQ9dHJ1ZVxuXHRcdGlmIChjYnx8IUBjYWxsZWQpXG5cdFx0XHRAY2FsbEJhY2sgZXZlbnRcblx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5yZW1vdmUoKSAjIEl0J3MgYWxyZWFkeSBjbG9zaW5nXG5cdFx0QG1haW4udW5yZWdpc3RlcihAaWQpXG5cdFx0QGVsZW0uc3RvcCgpLmFuaW1hdGUge1wid2lkdGhcIjogMCwgXCJvcGFjaXR5XCI6IDB9LCA3MDAsIFwiZWFzZUluT3V0Q3ViaWNcIlxuXHRcdGVsZW09QGVsZW1cblx0XHRAZWxlbS5zbGlkZVVwIDMwMCwgKC0+IGVsZW0ucmVtb3ZlKCkpXG5cdFx0cmV0dXJuIEBtYWluXG5cbndpbmRvdy5Ob3RpZmljYXRpb25zID0gTm90aWZpY2F0aW9uc1xuIiwialF1ZXJ5LmNzc0hvb2tzLnNjYWxlID0ge1xuXHRnZXQ6IChlbGVtLCBjb21wdXRlZCkgLT5cblx0XHRtYXRjaCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pW3RyYW5zZm9ybV9wcm9wZXJ0eV0ubWF0Y2goXCJbMC05XFwuXStcIilcblx0XHRpZiBtYXRjaFxuXHRcdFx0c2NhbGUgPSBwYXJzZUZsb2F0KG1hdGNoWzBdKVxuXHRcdFx0cmV0dXJuIHNjYWxlXG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIDEuMFxuXHRzZXQ6IChlbGVtLCB2YWwpIC0+XG5cdFx0dHJhbnNmb3JtcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pW3RyYW5zZm9ybV9wcm9wZXJ0eV0ubWF0Y2goL1swLTlcXC5dKy9nKVxuXHRcdGlmICh0cmFuc2Zvcm1zKVxuXHRcdFx0dHJhbnNmb3Jtc1swXSA9IHZhbFxuXHRcdFx0dHJhbnNmb3Jtc1szXSA9IHZhbFxuXHRcdFx0ZWxlbS5zdHlsZVt0cmFuc2Zvcm1fcHJvcGVydHldID0gJ21hdHJpeCgnK3RyYW5zZm9ybXMuam9pbihcIiwgXCIpKycpJ1xuXHRcdGVsc2Vcblx0XHRcdGVsZW0uc3R5bGVbdHJhbnNmb3JtX3Byb3BlcnR5XSA9IFwic2NhbGUoXCIrdmFsK1wiKVwiXG59XG5cbmpRdWVyeS5meC5zdGVwLnNjYWxlID0gKGZ4KSAtPlxuXHRqUXVlcnkuY3NzSG9va3NbJ3NjYWxlJ10uc2V0KGZ4LmVsZW0sIGZ4Lm5vdylcblxuaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpLnRyYW5zZm9ybSlcblx0dHJhbnNmb3JtX3Byb3BlcnR5ID0gXCJ0cmFuc2Zvcm1cIlxuZWxzZVxuXHR0cmFuc2Zvcm1fcHJvcGVydHkgPSBcIndlYmtpdFRyYW5zZm9ybVwiXG4iLCJqUXVlcnkuZm4ucmVhZGRDbGFzcyA9IChjbGFzc19uYW1lKSAtPlxuXHRlbGVtID0gQFxuXHRlbGVtLnJlbW92ZUNsYXNzIGNsYXNzX25hbWVcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5hZGRDbGFzcyBjbGFzc19uYW1lXG5cdCksIDFcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLnJlbW92ZUxhdGVyID0gKHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0ucmVtb3ZlKClcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uaGlkZUxhdGVyID0gKHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGlmIGVsZW0uY3NzKFwib3BhY2l0eVwiKSA9PSAwXG5cdFx0XHRlbGVtLmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmFkZENsYXNzTGF0ZXIgPSAoY2xhc3NfbmFtZSwgdGltZSA9IDUpIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uYWRkQ2xhc3MoY2xhc3NfbmFtZSlcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uY3NzTGF0ZXIgPSAobmFtZSwgdmFsLCB0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmNzcyBuYW1lLCB2YWxcblx0KSwgdGltZVxuXHRyZXR1cm4gQCJdfQ==
