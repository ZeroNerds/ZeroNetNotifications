(function() {
  var Notification, Notifications, template;

  template = "<div class=\"notification\"><span class=\"notification-icon\">!</span> <span class=\"body\">Test notification</span><a class=\"close\" href=\"#Close\">&times;</a>\n  <div style=\"clear: both\"></div>\n</div>";

  Notifications = (function() {
    function Notifications(elem1) {
      this.elem = elem1;
      if (typeof jQuery !== "function") {
        throw new Error("jQuery Required!");
      }
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFTOztFQU1IO0lBQ1EsdUJBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ2IsSUFBRyxPQUFPLE1BQVAsS0FBZ0IsVUFBbkI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFOLEVBRFg7O01BRUE7SUFIWTs7NEJBS2IsR0FBQSxHQUFLOzs0QkFFTCxRQUFBLEdBQVUsU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNULElBQUksSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQVQ7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGVBQUEsR0FBZ0IsRUFBaEIsR0FBbUIsd0JBQXpCLEVBRFg7O2FBRUEsSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQUwsR0FBUztJQUhBOzs0QkFLVixHQUFBLEdBQUssU0FBQyxFQUFELEVBQUksRUFBSjtNQUNKLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTixJQUFhLEVBQWpCO0FBQ0MsY0FBVSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBNUIsRUFEWDs7QUFFQSxhQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhSOzs0QkFLTCxVQUFBLEdBQVksU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNYLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVjtBQUNDLGNBQVUsSUFBQSxLQUFBLENBQU0sa0JBQUEsR0FBbUIsRUFBbkIsR0FBc0Isb0JBQTVCLEVBRFg7O2FBRUEsT0FBTyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUE7SUFIRDs7NEJBTVosSUFBQSxHQUFNLFNBQUE7TUFDTCxVQUFBLENBQVcsQ0FBQyxDQUFBLFNB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LENBQUMsR0FBTCxDQUFTLElBQVQsRUFBZSxHQUFmO0lBRFksQ0FBRixDQUFYLEVBRUcsSUFGSDtBQUdBLFdBQU87RUFMYTtBQTlCckIiLCJmaWxlIjoiemVyb25ldC1ub3RpZmljYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsidGVtcGxhdGU9XCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cIm5vdGlmaWNhdGlvblwiPjxzcGFuIGNsYXNzPVwibm90aWZpY2F0aW9uLWljb25cIj4hPC9zcGFuPiA8c3BhbiBjbGFzcz1cImJvZHlcIj5UZXN0IG5vdGlmaWNhdGlvbjwvc3Bhbj48YSBjbGFzcz1cImNsb3NlXCIgaHJlZj1cIiNDbG9zZVwiPiZ0aW1lczs8L2E+XG4gICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICA8L2Rpdj5cblwiXCJcIlxuXG5jbGFzcyBOb3RpZmljYXRpb25zXG5cdGNvbnN0cnVjdG9yOiAoQGVsZW0pIC0+XG5cdFx0aWYgdHlwZW9mKGpRdWVyeSkhPVwiZnVuY3Rpb25cIlxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IFJlcXVpcmVkIVwiKVxuXHRcdEBcblxuXHRpZHM6IHt9XG5cblx0cmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmIChAaWRzW2lkXSlcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuaXF1ZUVycm9yOiBcIitpZCtcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIilcblx0XHRAaWRzW2lkXT1vXG5cblx0Z2V0OiAoaWQsdGgpIC0+XG5cdFx0aWYgKCFAaWRzW2lkXSAmJiB0aClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZEVycm9yOiBcIitpZCtcIiBpcyBub3QgcmVnaXN0ZXJlZFwiKVxuXHRcdHJldHVybiBAaWRzW2lkXVxuXG5cdHVucmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmICghQGlkc1tpZF0pXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmRlZmluZWRFcnJvcjogXCIraWQrXCIgaXMgbm90IHJlZ2lzdGVyZWRcIilcblx0XHRkZWxldGUgQGlkc1tpZF1cblxuXHQjIFRPRE86IGFkZCB1bml0IHRlc3RzXG5cdHRlc3Q6IC0+XG5cdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdEBhZGQoXCJjb25uZWN0aW9uXCIsIFwiZXJyb3JcIiwgXCJDb25uZWN0aW9uIGxvc3QgdG8gPGI+VWlTZXJ2ZXI8L2I+IG9uIDxiPmxvY2FsaG9zdDwvYj4hXCIpXG5cdFx0XHRAYWRkKFwibWVzc2FnZS1BbnlvbmVcIiwgXCJpbmZvXCIsIFwiTmV3ICBmcm9tIDxiPkFueW9uZTwvYj4uXCIpXG5cdFx0KSwgMTAwMFxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImRvbmVcIiwgXCI8Yj5VaVNlcnZlcjwvYj4gY29ubmVjdGlvbiByZWNvdmVyZWQuXCIsIDUwMDApXG5cdFx0KSwgMzAwMFxuXG5cblx0YWRkOiAoaWQsIHR5cGUsIGJvZHksIHRpbWVvdXQ9MCwgb3B0aW9ucz17fSwgY2IpIC0+XG5cdFx0cmV0dXJuIG5ldyBOb3RpZmljYXRpb24gQCwge2lkLHR5cGUsYm9keSx0aW1lb3V0LG9wdGlvbnMsY2J9XG5cblx0Y2xvc2U6IChpZCkgLT5cblx0XHRAZ2V0KGlkLHRydWUpLmNsb3NlKFwic2NyaXB0XCIsdHJ1ZSlcblxuXHRjbG9zZUFsbDogKCkgLT5cblx0XHRtYWluPUBcblx0XHRPYmplY3Qua2V5cyhAaWRzKS5tYXAgKHApIC0+XG5cdFx0XHRtYWluLmNsb3NlIHBcblx0XHRyZXR1cm5cblxuXHRyYW5kb21JZDogLT5cblx0XHRyZXR1cm4gXCJtc2dcIitNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkucmVwbGFjZSgvMC9nLFwiXCIpLnJlcGxhY2UoLy4vZyxcIlwiKVxuXG5cdGRpc3BsYXlNZXNzYWdlOiAodHlwZSwgYm9keSwgdGltZW91dCxjYikgLT5cblx0XHRyZXR1cm4gYWRkKHJhbmRvbUlkKCksdHlwZSxib2R5LHRpbWVvdXQse30sY2IpXG5cblx0ZGlzcGxheUNvbmZpcm06IChtZXNzYWdlLCBjYXB0aW9uLCBjYW5jZWw9ZmFsc2UsIGNiKSAtPlxuXHRcdHJldHVybiBhZGQocmFuZG9tSWQoKSxcImNvbmZpcm1cIixtZXNzYWdlLCAwLCB7Y29uZmlybV9sYWJlbDpjYXB0aW9uLGNhbmNlbF9sYWJlbDpjYW5jZWx9LGNiKVxuXG5cdGRpc3BsYXlQcm9tcHQ6IChtZXNzYWdlLCBjYXB0aW9uLCBjYW5jZWw9ZmFsc2UsIGNiKSAtPlxuXHRcdHJldHVybiBhZGQocmFuZG9tSWQoKSxcInByb21wdFwiLG1lc3NhZ2UsIDAsIHtjb25maXJtX2xhYmVsOmNhcHRpb24sY2FuY2VsX2xhYmVsOmNhbmNlbH0sY2IpXG5cbmNsYXNzIE5vdGlmaWNhdGlvblxuXHRjb25zdHJ1Y3RvcjogKEBtYWluLG1lc3NhZ2UpIC0+ICMoQGlkLCBAdHlwZSwgQGJvZHksIEB0aW1lb3V0PTApIC0+XG5cdFx0QFxuXG5cdFx0QG1haW5fZWxlbT1AbWFpbi5lbGVtXG5cdFx0QG9wdGlvbnM9bWVzc2FnZS5vcHRpb25zXG5cdFx0QGNiPW1lc3NhZ2UuY2Jcblx0XHRAaWQgPSBtZXNzYWdlLmlkLnJlcGxhY2UgL1teQS1aYS16MC05XS9nLCBcIlwiXG5cblx0XHQjIENsb3NlIG5vdGlmaWNhdGlvbnMgd2l0aCBzYW1lIGlkXG5cdFx0aWYgQG1haW4uZ2V0KEBpZClcblx0XHRcdEBtYWluLmdldChAaWQpLmNsb3NlKClcblxuXG5cdFx0QHR5cGU9bWVzc2FnZS50eXBlXG5cdFx0QFtcImlzXCIrQHR5cGUuc3Vic3RyKDAsMSkudG9VcHBlckNhc2UoKStAdHlwZS5zdWJzdHIoMSldPXRydWVcblxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAUmVhbFRpbWVvdXQ9bWVzc2FnZS50aW1lb3V0ICNwcmV2ZW50IGZyb20gbGF1bmNoaW5nIHRvbyBlYXJseVxuXHRcdGVsc2UgaWYgQGlzSW5wdXQgb3IgQGlzQ29uZmlybSAjaWdub3JlXG5cdFx0ZWxzZVxuXHRcdFx0QFRpbWVvdXQ9bWVzc2FnZS50aW1lb3V0XG5cblx0XHRAbWFpbi5yZWdpc3RlcihAaWQsQCkgI3JlZ2lzdGVyXG5cblx0XHQjIENyZWF0ZSBlbGVtZW50XG5cdFx0QGVsZW0gPSAkKHRlbXBsYXRlKVxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpXG5cdFx0IyBVcGRhdGUgdGV4dFxuXHRcdEB1cGRhdGVUZXh0IEB0eXBlXG5cblx0XHRib2R5PW1lc3NhZ2UuYm9keVxuXHRcdEBib2R5PWJvZHlcblx0XHRAY2xvc2VkPWZhbHNlXG5cblx0XHRAcmVidWlsZE1zZyBcIlwiXG5cblx0XHRAZWxlbS5hcHBlbmRUbyhAbWFpbl9lbGVtKVxuXG5cdFx0IyBUaW1lb3V0XG5cdFx0aWYgQFRpbWVvdXRcblx0XHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgTm8gbmVlZCBvZiBjbG9zZSBidXR0b25cblx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdEBjbG9zZSgpXG5cdFx0XHQpLCBAVGltZW91dFxuXG5cdFx0I0luaXQgbWFpbiBzdHVmZlxuXHRcdGlmIEBpc1Byb2dyZXNzXG5cdFx0XHRAc2V0UHJvZ3Jlc3MoQG9wdGlvbnMucHJvZ3Jlc3N8fDApXG5cdFx0aWYgQGlzUHJvbXB0XG5cdFx0XHRAYnVpbGRQcm9tcHQoJChcIi5ib2R5XCIsIEBlbGVtKSwgQG9wdGlvbnMuY29uZmlybV9sYWJlbHx8XCJPa1wiLCBAb3B0aW9ucy5jYW5jZWxfbGFiZWx8fGZhbHNlKVxuXHRcdGlmIEBpc0NvbmZpcm1cblx0XHRcdEBidWlsZENvbmZpcm0oJChcIi5ib2R5XCIsIEBlbGVtKSwgQG9wdGlvbnMuY29uZmlybV9sYWJlbHx8XCJPa1wiLCBAb3B0aW9ucy5jYW5jZWxfbGFiZWx8fGZhbHNlKVxuXG5cdFx0IyBBbmltYXRlXG5cdFx0d2lkdGggPSBAZWxlbS5vdXRlcldpZHRoKClcblx0XHRpZiBub3QgQFRpbWVvdXQgdGhlbiB3aWR0aCArPSAyMCAjIEFkZCBzcGFjZSBmb3IgY2xvc2UgYnV0dG9uXG5cdFx0aWYgQGVsZW0ub3V0ZXJIZWlnaHQoKSA+IDU1IHRoZW4gQGVsZW0uYWRkQ2xhc3MoXCJsb25nXCIpXG5cdFx0QGVsZW0uY3NzKHtcIndpZHRoXCI6IFwiNTBweFwiLCBcInRyYW5zZm9ybVwiOiBcInNjYWxlKDAuMDEpXCJ9KVxuXHRcdEBlbGVtLmFuaW1hdGUoe1wic2NhbGVcIjogMX0sIDgwMCwgXCJlYXNlT3V0RWxhc3RpY1wiKVxuXHRcdEBlbGVtLmFuaW1hdGUoe1wid2lkdGhcIjogd2lkdGh9LCA3MDAsIFwiZWFzZUluT3V0Q3ViaWNcIilcblx0XHQkKFwiLmJvZHlcIiwgQGVsZW0pLmNzc0xhdGVyKFwiYm94LXNoYWRvd1wiLCBcIjBweCAwcHggNXB4IHJnYmEoMCwwLDAsMC4xKVwiLCAxMDAwKVxuXG5cdFx0IyBDbG9zZSBidXR0b24gb3IgQ29uZmlybSBidXR0b25cblx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoXCJ1c2VyXCIsdHJ1ZSlcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdCQoXCIuYnV0dG9uXCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHQjIFNlbGVjdCBsaXN0XG5cdFx0JChcIi5zZWxlY3RcIiwgQGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjbG9zZSgpXG5cblx0cmVzaXplQm94OiAtPlxuXHRcdEBlbGVtLmNzcyhcIndpZHRoXCIsXCJpbmhlcml0XCIpXG5cblx0Y2FsbEJhY2s6IChldmVudCxyZXMpIC0+XG5cdFx0aWYgQGNhbGxlZFxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FsYmFja0Vycm9yOiBDYWxsYmFjayB3YXMgY2FsbGVkIHR3aWNlXCIpXG5cdFx0QGNhbGxlZD10cnVlXG5cdFx0aWYgdHlwZW9mKEBjYikgIT0gXCJmdW5jdGlvblwiXG5cdFx0XHRjb25zb2xlLndhcm4oXCJTaWxlbnRseSBmYWlsaW5nIGNhbGxiYWNrIEAgJXM6ICVzICYgJyVzJ1wiLEBpZCxldmVudCxyZXMpXG5cdFx0XHRyZXR1cm5cblx0XHRjb25zb2xlLmluZm8oXCJFdmVudCBAICVzICVzICVzXCIsQGlkLGV2ZW50LHJlcylcblx0XHRAY2IoZXZlbnQscmVzKVxuXG5cdHJlYnVpbGRNc2c6IChhcHBlbmQpIC0+XG5cdFx0QGFwcGVuZD0kKGFwcGVuZClcblx0XHRpZiB0eXBlb2YoQGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuaHRtbChcIjxzcGFuIGNsYXNzPSdtZXNzYWdlJz5cIitAZXNjYXBlKEBib2R5KStcIjwvc3Bhbj5cIikuYXBwZW5kKEBhcHBlbmQpXG5cdFx0ZWxzZVxuXHRcdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5odG1sKFwiXCIpLmFwcGVuZChAYm9keSxAYXBwZW5kKVxuXG5cdGVzY2FwZTogKHZhbHVlKSAtPlxuIFx0XHRyZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpLnJlcGxhY2UoLyZsdDsoW1xcL117MCwxfShicnxifHV8aSkpJmd0Oy9nLCBcIjwkMT5cIikgIyBFc2NhcGUgYW5kIFVuZXNjYXBlIGIsIGksIHUsIGJyIHRhZ3NcblxuXHRzZXRCb2R5OiAoYm9keSkgLT5cblx0XHRAYm9keT1ib2R5XG5cdFx0aWYgdHlwZW9mKEBib2R5KSA9PSBcInN0cmluZ1wiXG5cdFx0XHRAYm9keT0kKFwiPHNwYW4+XCIrQGVzY2FwZShAYm9keSkrXCI8L3NwYW4+XCIpXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmVtcHR5KCkuYXBwZW5kKEBib2R5KVxuXHRcdGVsc2Vcblx0XHRcdCQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuZW1wdHkoKS5hcHBlbmQoQGJvZHkpXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cmV0dXJuIEBcblxuXHRidWlsZENvbmZpcm06IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsdHJ1ZVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0Ym9keS5hcHBlbmQoYnV0dG9uKVxuXHRcdGlmIChjYW5jZWwpXG5cdFx0XHRjQnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhbmNlbH0nIGNsYXNzPSdidXR0b24gYnV0dG9uLSN7Y2FuY2VsfSc+I3tjYW5jZWx9PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdFx0Y0J1dHRvbi5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGZhbHNlXG5cdFx0XHRcdHJldHVybiBmYWxzZVxuXHRcdFx0Ym9keS5hcHBlbmQoY0J1dHRvbilcblxuXHRcdGJ1dHRvbi5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cblx0YnVpbGRQcm9tcHQ6IChib2R5LGNhcHRpb24sY2FuY2VsPWZhbHNlKSAtPlxuXHRcdGlucHV0ID0gJChcIjxpbnB1dCB0eXBlPScje0B0eXBlfScgY2xhc3M9J2lucHV0IGJ1dHRvbi0je0B0eXBlfScvPlwiKSAjIEFkZCBpbnB1dFxuXHRcdGlucHV0Lm9uIFwia2V5dXBcIiwgKGUpID0+ICMgU2VuZCBvbiBlbnRlclxuXHRcdFx0aWYgZS5rZXlDb2RlID09IDEzXG5cdFx0XHRcdGJ1dHRvbi50cmlnZ2VyIFwiY2xpY2tcIiAjIFJlc3BvbnNlIHRvIGNvbmZpcm1cblx0XHRib2R5LmFwcGVuZChpbnB1dClcblxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PiAjIFJlc3BvbnNlIG9uIGJ1dHRvbiBjbGlja1xuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsaW5wdXQudmFsKClcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nYnV0dG9uIGJ1dHRvbi0je2NhbmNlbH0nPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGJvZHkuYXBwZW5kKGNCdXR0b24pXG5cblx0XHRpbnB1dC5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cdHNldFByb2dyZXNzOiAocGVyY2VudF8pIC0+XG5cdFx0aWYgdHlwZW9mKHBlcmNlbnRfKSAhPSBcIm51bWJlclwiXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUeXBlRXJyb3I6IFByb2dyZXNzIG11c3QgYmUgaW50XCIpXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cGVyY2VudCA9IE1hdGgubWluKDEwMCwgcGVyY2VudF8pLzEwMFxuXHRcdG9mZnNldCA9IDc1LShwZXJjZW50Kjc1KVxuXHRcdGNpcmNsZSA9IFwiXCJcIlxuXHRcdFx0PGRpdiBjbGFzcz1cImNpcmNsZVwiPjxzdmcgY2xhc3M9XCJjaXJjbGUtc3ZnXCIgd2lkdGg9XCIzMFwiIGhlaWdodD1cIjMwXCIgdmlld3BvcnQ9XCIwIDAgMzAgMzBcIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1iZ1wiPjwvY2lyY2xlPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1mZ1wiIHN0eWxlPVwic3Ryb2tlLWRhc2hvZmZzZXQ6ICN7b2Zmc2V0fVwiPjwvY2lyY2xlPlxuXHRcdFx0PC9zdmc+PC9kaXY+XG5cdFx0XCJcIlwiXG5cdFx0d2lkdGggPSAkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLm91dGVyV2lkdGgoKVxuXHRcdCMkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmh0bWwobWVzc2FnZS5wYXJhbXNbMV0pXG5cdFx0aWYgbm90ICQoXCIuY2lyY2xlXCIsIEBlbGVtKS5sZW5ndGhcblx0XHRcdEByZWJ1aWxkTXNnIGNpcmNsZVxuXHRcdGlmICQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuY3NzKFwid2lkdGhcIikgPT0gXCJcIlxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5jc3MoXCJ3aWR0aFwiLCB3aWR0aClcblx0XHQkKFwiLmJvZHkgLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwic3Ryb2tlLWRhc2hvZmZzZXRcIiwgb2Zmc2V0KVxuXHRcdGlmIHBlcmNlbnQgPiAwXG5cdFx0XHQkKFwiLmJvZHkgLmNpcmNsZS1iZ1wiLCBAZWxlbSkuY3NzIHtcImFuaW1hdGlvbi1wbGF5LXN0YXRlXCI6IFwicGF1c2VkXCIsIFwic3Ryb2tlLWRhc2hhcnJheVwiOiBcIjE4MHB4XCJ9XG5cblx0XHRpZiAkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0ZWxzZSBpZiBwZXJjZW50XyA+PSAxMDAgICMgRG9uZVxuXHRcdFx0JChcIi5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInRyYW5zaXRpb25cIiwgXCJhbGwgMC4zcyBlYXNlLWluLW91dFwiKVxuXHRcdFx0c2V0VGltZW91dCAoLT5cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwic2NhbGUoMSlcIiwgb3BhY2l0eTogMX1cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvbiAuaWNvbi1zdWNjZXNzXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJyb3RhdGUoNDVkZWcpIHNjYWxlKDEpXCJ9XG5cdFx0XHQpLCAzMDBcblx0XHRcdGlmIEBSZWFsVGltZW91dFxuXHRcdFx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5yZW1vdmUoKSAjIEl0J3MgYWxyZWFkeSBjbG9zaW5nXG5cdFx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdFx0QGNsb3NlKFwiYXV0b1wiLHRydWUpXG5cdFx0XHRcdCksIEBSZWFsVGltZW91dFxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIiwgdHJ1ZSlcblx0XHRlbHNlIGlmIHBlcmNlbnRfIDwgMCAgIyBFcnJvclxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInN0cm9rZVwiLCBcIiNlYzZmNDdcIikuY3NzKFwidHJhbnNpdGlvblwiLCBcInRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0XCIpXG5cdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJzY2FsZSgxKVwiLCBvcGFjaXR5OiAxfVxuXHRcdFx0XHRAZWxlbS5yZW1vdmVDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWVycm9yXCIpXG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb24gLmljb24tc3VjY2Vzc1wiLCBAZWxlbSkucmVtb3ZlQ2xhc3MoXCJpY29uLXN1Y2Nlc3NcIikuaHRtbChcIiFcIilcblx0XHRcdCksIDMwMFxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIiwgdHJ1ZSlcblx0XHRyZXR1cm4gQFxuXG5cdHNldERlc2lnbjogKGNoYXIsdHlwZSkgLT5cblx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKGNoYXIpXG5cdFx0QGVsZW0uYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tXCIrdHlwZSlcblxuXHR1cGRhdGVUZXh0OiAodHlwZSkgLT5cblx0XHRzd2l0Y2godHlwZSlcblx0XHRcdHdoZW4gXCJlcnJvclwiIHRoZW4gQHNldERlc2lnbiBcIiFcIixcImVycm9yXCJcblx0XHRcdHdoZW4gXCJkb25lXCIgdGhlbiBAc2V0RGVzaWduIFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIixcImRvbmVcIlxuXHRcdFx0d2hlbiBcInByb2dyZXNzXCIgdGhlbiBAc2V0RGVzaWduIFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIixcInByb2dyZXNzXCJcblx0XHRcdHdoZW4gXCJhc2tcIiwgXCJsaXN0XCIsIFwicHJvbXB0XCIsIFwiY29uZmlybVwiIHRoZW4gQHNldERlc2lnbiBcIj9cIixcImFza1wiXG5cdFx0XHR3aGVuIFwiaW5mb1wiIHRoZW4gQHNldERlc2lnbiBcImlcIixcImluZm9cIlxuXHRcdFx0ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duTm90aWZpY2F0aW9uVHlwZTogVHlwZSBcIit0eXBlK1wiIGlzIG5vdCBrbm93blwiKVxuXG5cdGNsb3NlOiAoZXZlbnQ9XCJhdXRvXCIsY2I9ZmFsc2UpIC0+XG5cdFx0aWYgQGNsb3NlZFxuXHRcdFx0cmV0dXJuXG5cdFx0QGNsb3NlZD10cnVlXG5cdFx0aWYgKGNifHwhQGNhbGxlZClcblx0XHRcdEBjYWxsQmFjayBldmVudFxuXHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgSXQncyBhbHJlYWR5IGNsb3Npbmdcblx0XHRAbWFpbi51bnJlZ2lzdGVyKEBpZClcblx0XHRAZWxlbS5zdG9wKCkuYW5pbWF0ZSB7XCJ3aWR0aFwiOiAwLCBcIm9wYWNpdHlcIjogMH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiXG5cdFx0ZWxlbT1AZWxlbVxuXHRcdEBlbGVtLnNsaWRlVXAgMzAwLCAoLT4gZWxlbS5yZW1vdmUoKSlcblx0XHRyZXR1cm4gQG1haW5cblxud2luZG93Lk5vdGlmaWNhdGlvbnMgPSBOb3RpZmljYXRpb25zXG4iLCJqUXVlcnkuY3NzSG9va3Muc2NhbGUgPSB7XG5cdGdldDogKGVsZW0sIGNvbXB1dGVkKSAtPlxuXHRcdG1hdGNoID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaChcIlswLTlcXC5dK1wiKVxuXHRcdGlmIG1hdGNoXG5cdFx0XHRzY2FsZSA9IHBhcnNlRmxvYXQobWF0Y2hbMF0pXG5cdFx0XHRyZXR1cm4gc2NhbGVcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gMS4wXG5cdHNldDogKGVsZW0sIHZhbCkgLT5cblx0XHR0cmFuc2Zvcm1zID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaCgvWzAtOVxcLl0rL2cpXG5cdFx0aWYgKHRyYW5zZm9ybXMpXG5cdFx0XHR0cmFuc2Zvcm1zWzBdID0gdmFsXG5cdFx0XHR0cmFuc2Zvcm1zWzNdID0gdmFsXG5cdFx0XHRlbGVtLnN0eWxlW3RyYW5zZm9ybV9wcm9wZXJ0eV0gPSAnbWF0cml4KCcrdHJhbnNmb3Jtcy5qb2luKFwiLCBcIikrJyknXG5cdFx0ZWxzZVxuXHRcdFx0ZWxlbS5zdHlsZVt0cmFuc2Zvcm1fcHJvcGVydHldID0gXCJzY2FsZShcIit2YWwrXCIpXCJcbn1cblxualF1ZXJ5LmZ4LnN0ZXAuc2NhbGUgPSAoZngpIC0+XG5cdGpRdWVyeS5jc3NIb29rc1snc2NhbGUnXS5zZXQoZnguZWxlbSwgZngubm93KVxuXG5pZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtKVxuXHR0cmFuc2Zvcm1fcHJvcGVydHkgPSBcInRyYW5zZm9ybVwiXG5lbHNlXG5cdHRyYW5zZm9ybV9wcm9wZXJ0eSA9IFwid2Via2l0VHJhbnNmb3JtXCJcbiIsImpRdWVyeS5mbi5yZWFkZENsYXNzID0gKGNsYXNzX25hbWUpIC0+XG5cdGVsZW0gPSBAXG5cdGVsZW0ucmVtb3ZlQ2xhc3MgY2xhc3NfbmFtZVxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmFkZENsYXNzIGNsYXNzX25hbWVcblx0KSwgMVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4ucmVtb3ZlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5yZW1vdmUoKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5oaWRlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0aWYgZWxlbS5jc3MoXCJvcGFjaXR5XCIpID09IDBcblx0XHRcdGVsZW0uY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uYWRkQ2xhc3NMYXRlciA9IChjbGFzc19uYW1lLCB0aW1lID0gNSkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5hZGRDbGFzcyhjbGFzc19uYW1lKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5jc3NMYXRlciA9IChuYW1lLCB2YWwsIHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uY3NzIG5hbWUsIHZhbFxuXHQpLCB0aW1lXG5cdHJldHVybiBAIl19
