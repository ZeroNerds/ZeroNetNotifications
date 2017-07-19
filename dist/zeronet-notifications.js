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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFTOztFQU1IO0lBQ1EsdUJBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ2IsSUFBRyxPQUFPLE1BQVAsS0FBZ0IsVUFBbkI7QUFDQyxjQUFNLElBQUksS0FBSixDQUFVLGtCQUFWLEVBRFA7O01BRUEsSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFOLENBQWUsOEJBQWY7TUFDQSxDQUFBLENBQUUsTUFBRixDQUFTLENBQUMsRUFBVixDQUFhLFFBQWIsRUFBc0IsSUFBQyxDQUFBLFNBQVMsQ0FBQyxJQUFYLENBQWdCLElBQWhCLENBQXRCO01BQ0E7SUFMWTs7NEJBT2IsR0FBQSxHQUFLOzs0QkFFTCxRQUFBLEdBQVUsU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNULElBQUksSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQVQ7QUFDQyxjQUFNLElBQUksS0FBSixDQUFVLGVBQUEsR0FBZ0IsRUFBaEIsR0FBbUIsd0JBQTdCLEVBRFA7O2FBRUEsSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBLENBQUwsR0FBUztJQUhBOzs0QkFLVixHQUFBLEdBQUssU0FBQyxFQUFELEVBQUksRUFBSjtNQUNKLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTixJQUFhLEVBQWpCO0FBQ0MsY0FBTSxJQUFJLEtBQUosQ0FBVSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBaEMsRUFEUDs7QUFFQSxhQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhSOzs0QkFLTCxVQUFBLEdBQVksU0FBQyxFQUFELEVBQUksQ0FBSjtNQUNYLElBQUksQ0FBQyxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVjtBQUNDLGNBQU0sSUFBSSxL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QyxFQUFFLENBQUMsYUFBVixHQUEwQixTQUFDLFVBQUQsRUFBYSxJQUFiO0FBQ3pCLFFBQUE7O01BRHNDLE9BQU87O0lBQzdDLElBQUEsR0FBTztJQUNQLFVBQUEsQ0FBVyxDQUFFLFNBQUE7YUFDWixJQUFJLENBQUMsUUFBTCxDQUFjLFVBQWQ7SUFEWSxDQUFGLENBQVgsRUFFRyxJQUZIO0FBR0EsV0FBTztFQUxrQjs7RUFPMUIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFWLEdBQXFCLFNBQUMsSUFBRCxFQUFPLEdBQVAsRUFBWSxJQUFaO0FBQ3BCLFFBQUE7O01BRGdDLE9BQU87O0lBQ3ZDLElBQUEsR0FBTztJQUNQLFVBQUEsQ0FBVyxDQUFFLFNBQUE7YUFDWixJQUFJLENBQUMsR0FBTCxDQUFTLElBQVQsRUFBZSxHQUFmO0lBRFksQ0FBRixDQUFYLEVBRUcsSUFGSDtBQUdBLFdBQU87RUFMYTtBQTlCckIiLCJmaWxlIjoiemVyb25ldC1ub3RpZmljYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsidGVtcGxhdGU9XCJcIlwiXG4gICAgPGRpdiBjbGFzcz1cInpOb3RpZmljYXRpb25zLW5vdGlmaWNhdGlvblwiPjxzcGFuIGNsYXNzPVwibm90aWZpY2F0aW9uLWljb25cIj4hPC9zcGFuPiA8c3BhbiBjbGFzcz1cImJvZHlcIj5UZXN0IG5vdGlmaWNhdGlvbjwvc3Bhbj48YSBjbGFzcz1cImNsb3NlXCIgaHJlZj1cIiNDbG9zZVwiPiZ0aW1lczs8L2E+XG4gICAgICA8ZGl2IHN0eWxlPVwiY2xlYXI6IGJvdGhcIj48L2Rpdj5cbiAgICA8L2Rpdj5cblwiXCJcIlxuXG5jbGFzcyBOb3RpZmljYXRpb25zXG5cdGNvbnN0cnVjdG9yOiAoQGVsZW0pIC0+XG5cdFx0aWYgdHlwZW9mKGpRdWVyeSkhPVwiZnVuY3Rpb25cIlxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwialF1ZXJ5IFJlcXVpcmVkIVwiKVxuXHRcdEBlbGVtLmFkZENsYXNzKFwiek5vdGlmaWNhdGlvbnMtbm90aWZpY2F0aW9uc1wiKVxuXHRcdCQod2luZG93KS5vbihcInJlc2l6ZVwiLEByZXNpemVBbGwuYmluZChAKSlcblx0XHRAXG5cblx0aWRzOiB7fVxuXG5cdHJlZ2lzdGVyOiAoaWQsbykgLT5cblx0XHRpZiAoQGlkc1tpZF0pXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmlxdWVFcnJvcjogXCIraWQrXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkXCIpXG5cdFx0QGlkc1tpZF09b1xuXG5cdGdldDogKGlkLHRoKSAtPlxuXHRcdGlmICghQGlkc1tpZF0gJiYgdGgpXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmRlZmluZWRFcnJvcjogXCIraWQrXCIgaXMgbm90IHJlZ2lzdGVyZWRcIilcblx0XHRyZXR1cm4gQGlkc1tpZF1cblxuXHR1bnJlZ2lzdGVyOiAoaWQsbykgLT5cblx0XHRpZiAoIUBpZHNbaWRdKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVW5kZWZpbmVkRXJyb3I6IFwiK2lkK1wiIGlzIG5vdCByZWdpc3RlcmVkXCIpXG5cdFx0ZGVsZXRlIEBpZHNbaWRdXG5cblx0IyBUT0RPOiBhZGQgdW5pdCB0ZXN0c1xuXHR0ZXN0OiAtPlxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImVycm9yXCIsIFwiQ29ubmVjdGlvbiBsb3N0IHRvIDxiPlVpU2VydmVyPC9iPiBvbiA8Yj5sb2NhbGhvc3Q8L2I+IVwiKVxuXHRcdFx0QGFkZChcIm1lc3NhZ2UtQW55b25lXCIsIFwiaW5mb1wiLCBcIk5ldyAgZnJvbSA8Yj5BbnlvbmU8L2I+LlwiKVxuXHRcdCksIDEwMDBcblx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0QGFkZChcImNvbm5lY3Rpb25cIiwgXCJkb25lXCIsIFwiPGI+VWlTZXJ2ZXI8L2I+IGNvbm5lY3Rpb24gcmVjb3ZlcmVkLlwiLCA1MDAwKVxuXHRcdCksIDMwMDBcblxuXG5cdGFkZDogKGlkLCB0eXBlLCBib2R5LCB0aW1lb3V0PTAsIG9wdGlvbnM9e30sIGNiKSAtPlxuXHRcdHJldHVybiBuZXcgTm90aWZpY2F0aW9uIEAsIHtpZCx0eXBlLGJvZHksdGltZW91dCxvcHRpb25zLGNifVxuXG5cdGNsb3NlOiAoaWQpIC0+XG5cdFx0QGdldChpZCx0cnVlKS5jbG9zZShcInNjcmlwdFwiLHRydWUpXG5cblx0Y2xvc2VBbGw6ICgpIC0+XG5cdFx0bWFpbj1AXG5cdFx0T2JqZWN0LmtleXMoQGlkcykubWFwIChwKSAtPlxuXHRcdFx0bWFpbi5jbG9zZSBwXG5cdFx0cmV0dXJuXG5cblx0cmVzaXplQWxsOiAoKSAtPlxuXHRcdG1haW49QFxuXHRcdE9iamVjdC5rZXlzKEBpZHMpLm1hcCAocCkgLT5cblx0XHRcdG1haW4uZ2V0KHAsdHJ1ZSkucmVzaXplQm94KClcblx0XHRyZXR1cm5cblxuXHRyYW5kb21JZDogLT5cblx0XHRyZXR1cm4gXCJtc2dcIitNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKCkucmVwbGFjZSgvMC9nLFwiXCIpLnJlcGxhY2UoL1xcLi9nLFwiXCIpXG5cblx0ZGlzcGxheU1lc3NhZ2U6ICh0eXBlLCBib2R5LCB0aW1lb3V0PTAsY2IpIC0+XG5cdFx0cmV0dXJuIGFkZChyYW5kb21JZCgpLHR5cGUsYm9keSx0aW1lb3V0LHt9LGNiKVxuXG5cdGRpc3BsYXlDb25maXJtOiAobWVzc2FnZSwgY29uZmlybV9sYWJlbCwgY2FuY2VsX2xhYmVsPWZhbHNlLCBjYikgLT5cblx0XHRyZXR1cm4gYWRkKHJhbmRvbUlkKCksXCJjb25maXJtXCIsbWVzc2FnZSwgMCwge2NvbmZpcm1fbGFiZWwsY2FuY2VsX2xhYmVsfSxjYilcblxuXHRkaXNwbGF5UHJvbXB0OiAobWVzc2FnZSwgY29uZmlybV9sYWJlbCwgY2FuY2VsX2xhYmVsPWZhbHNlLCBjYikgLT5cblx0XHRyZXR1cm4gYWRkKHJhbmRvbUlkKCksXCJwcm9tcHRcIixtZXNzYWdlLCAwLCB7Y29uZmlybV9sYWJlbCxjYW5jZWxfbGFiZWx9LGNiKVxuXG5jbGFzcyBOb3RpZmljYXRpb25cblx0Y29uc3RydWN0b3I6IChAbWFpbixtZXNzYWdlKSAtPiAjKEBpZCwgQHR5cGUsIEBib2R5LCBAdGltZW91dD0wKSAtPlxuXHRcdEBcblxuXHRcdEBtYWluX2VsZW09QG1haW4uZWxlbVxuXHRcdEBvcHRpb25zPW1lc3NhZ2Uub3B0aW9uc1xuXHRcdEBjYj1tZXNzYWdlLmNiXG5cdFx0QGlkID0gbWVzc2FnZS5pZC5yZXBsYWNlIC9bXkEtWmEtejAtOV0vZywgXCJcIlxuXG5cdFx0IyBDbG9zZSBub3RpZmljYXRpb25zIHdpdGggc2FtZSBpZFxuXHRcdGlmIEBtYWluLmdldChAaWQpXG5cdFx0XHRAbWFpbi5nZXQoQGlkKS5jbG9zZSgpXG5cblxuXHRcdEB0eXBlPW1lc3NhZ2UudHlwZVxuXHRcdEBbXCJpc1wiK0B0eXBlLnN1YnN0cigwLDEpLnRvVXBwZXJDYXNlKCkrQHR5cGUuc3Vic3RyKDEpXT10cnVlXG5cblx0XHRpZiBAaXNQcm9ncmVzc1xuXHRcdFx0QFJlYWxUaW1lb3V0PW1lc3NhZ2UudGltZW91dCAjcHJldmVudCBmcm9tIGxhdW5jaGluZyB0b28gZWFybHlcblx0XHRlbHNlIGlmIEBpc0lucHV0IG9yIEBpc0NvbmZpcm0gI2lnbm9yZVxuXHRcdGVsc2Vcblx0XHRcdEBUaW1lb3V0PW1lc3NhZ2UudGltZW91dFxuXG5cdFx0QG1haW4ucmVnaXN0ZXIoQGlkLEApICNyZWdpc3RlclxuXG5cdFx0IyBDcmVhdGUgZWxlbWVudFxuXHRcdEBlbGVtID0gJCh0ZW1wbGF0ZSlcblx0XHRpZiBAaXNQcm9ncmVzc1xuXHRcdFx0QGVsZW0uYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tZG9uZVwiKVxuXHRcdCMgVXBkYXRlIHRleHRcblx0XHRAdXBkYXRlVGV4dCBAdHlwZVxuXG5cdFx0Ym9keT1tZXNzYWdlLmJvZHlcblx0XHRAYm9keT1ib2R5XG5cdFx0QGNsb3NlZD1mYWxzZVxuXG5cdFx0QHJlYnVpbGRNc2cgXCJcIlxuXG5cdFx0QGVsZW0uYXBwZW5kVG8oQG1haW5fZWxlbSlcblxuXHRcdCMgVGltZW91dFxuXHRcdGlmIEBUaW1lb3V0XG5cdFx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5yZW1vdmUoKSAjIE5vIG5lZWQgb2YgY2xvc2UgYnV0dG9uXG5cdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHRAY2xvc2UoKVxuXHRcdFx0KSwgQFRpbWVvdXRcblxuXHRcdCNJbml0IG1haW4gc3R1ZmZcblx0XHRpZiBAaXNQcm9ncmVzc1xuXHRcdFx0QHNldFByb2dyZXNzKEBvcHRpb25zLnByb2dyZXNzfHwwKVxuXHRcdGlmIEBpc1Byb21wdFxuXHRcdFx0QGJ1aWxkUHJvbXB0KCQoXCIuYm9keVwiLCBAZWxlbSksIEBvcHRpb25zLmNvbmZpcm1fbGFiZWx8fFwiT2tcIiwgQG9wdGlvbnMuY2FuY2VsX2xhYmVsfHxmYWxzZSlcblx0XHRpZiBAaXNDb25maXJtXG5cdFx0XHRAYnVpbGRDb25maXJtKCQoXCIuYm9keVwiLCBAZWxlbSksIEBvcHRpb25zLmNvbmZpcm1fbGFiZWx8fFwiT2tcIiwgQG9wdGlvbnMuY2FuY2VsX2xhYmVsfHxmYWxzZSlcblxuXHRcdCMgQW5pbWF0ZVxuXHRcdHdpZHRoID0gQGVsZW0ub3V0ZXJXaWR0aCgpXG5cdFx0I2lmIG5vdCBAVGltZW91dCB0aGVuIHdpZHRoICs9IDIwICMgQWRkIHNwYWNlIGZvciBjbG9zZSBidXR0b25cblx0XHRpZiBAZWxlbS5vdXRlckhlaWdodCgpID4gNTUgdGhlbiBAZWxlbS5hZGRDbGFzcyhcImxvbmdcIilcblx0XHRAZWxlbS5jc3Moe1wid2lkdGhcIjogXCI1MHB4XCIsIFwidHJhbnNmb3JtXCI6IFwic2NhbGUoMC4wMSlcIn0pXG5cdFx0QGVsZW0uYW5pbWF0ZSh7XCJzY2FsZVwiOiAxfSwgODAwLCBcImVhc2VPdXRFbGFzdGljXCIpXG5cdFx0QGVsZW0uYW5pbWF0ZSh7XCJ3aWR0aFwiOiB3aWR0aH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiKVxuXHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuY3NzTGF0ZXIoXCJib3gtc2hhZG93XCIsIFwiMHB4IDBweCA1cHggcmdiYSgwLDAsMCwwLjEpXCIsIDEwMDApXG5cdFx0c2V0VGltZW91dChAcmVzaXplQm94LmJpbmQoQCksMTUwMClcblxuXHRcdCMgQ2xvc2UgYnV0dG9uIG9yIENvbmZpcm0gYnV0dG9uXG5cdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlKFwidXNlclwiLHRydWUpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHQkKFwiLnpOb3RpZmljYXRpb25zLWJ1dHRvblwiLCBAZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlKClcblx0XHRcdHJldHVybiBmYWxzZVxuXG5cdFx0IyBTZWxlY3QgbGlzdFxuXHRcdCQoXCIuc2VsZWN0XCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoKVxuXG5cdHJlc2l6ZUJveDogLT5cblx0XHRAZWxlbVswXS5zdHlsZT1cIlwiXG5cdFx0I0BlbGVtLmNzcyhcIndpZHRoXCIsXCJpbmhlcml0XCIpXG5cblx0Y2FsbEJhY2s6IChldmVudCxyZXMpIC0+XG5cdFx0aWYgQGNhbGxlZFxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiQ2FsYmFja0Vycm9yOiBDYWxsYmFjayB3YXMgY2FsbGVkIHR3aWNlXCIpXG5cdFx0QGNhbGxlZD10cnVlXG5cdFx0aWYgdHlwZW9mKEBjYikgIT0gXCJmdW5jdGlvblwiXG5cdFx0XHRjb25zb2xlLndhcm4oXCJTaWxlbnRseSBmYWlsaW5nIGNhbGxiYWNrIEAgJXM6ICVzICYgJyVzJ1wiLEBpZCxldmVudCxyZXMpXG5cdFx0XHRyZXR1cm5cblx0XHRjb25zb2xlLmluZm8oXCJFdmVudCBAICVzICVzICVzXCIsQGlkLGV2ZW50LHJlcylcblx0XHRAY2IoZXZlbnQscmVzKVxuXG5cdHJlYnVpbGRNc2c6IChhcHBlbmQpIC0+XG5cdFx0QGFwcGVuZD0kKGFwcGVuZClcblx0XHRpZiB0eXBlb2YoQGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuaHRtbChcIjxzcGFuIGNsYXNzPVxcXCJtZXNzYWdlXFxcIj5cIitAZXNjYXBlKEBib2R5KStcIjwvc3Bhbj5cIikuYXBwZW5kKEBhcHBlbmQpXG5cdFx0XHRpZiBAaXNMaXN0IG9yIEBpc1Byb21wdCBvciBAaXNDb25maXJtXG5cdFx0XHRcdCQoXCIubWVzc2FnZVwiLCBAZWxlbSkuYWRkQ2xhc3MoXCJtZXNzYWdlLW5vbi1jZW50ZXJcIilcblx0XHRlbHNlXG5cdFx0XHQkKFwiLmJvZHlcIiwgQGVsZW0pLmh0bWwoXCJcIikuYXBwZW5kKEBib2R5LEBhcHBlbmQpXG5cblx0ZXNjYXBlOiAodmFsdWUpIC0+XG4gXHRcdHJldHVybiBTdHJpbmcodmFsdWUpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JykucmVwbGFjZSgvJmx0OyhbXFwvXXswLDF9KGJyfGJ8dXxpKSkmZ3Q7L2csIFwiPCQxPlwiKSAjIEVzY2FwZSBhbmQgVW5lc2NhcGUgYiwgaSwgdSwgYnIgdGFnc1xuXG5cdHNldEJvZHk6IChib2R5KSAtPlxuXHRcdEBib2R5PWJvZHlcblx0XHRpZiB0eXBlb2YoQGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdEBib2R5PSQoXCI8c3Bhbj5cIitAZXNjYXBlKEBib2R5KStcIjwvc3Bhbj5cIilcblx0XHRcdCQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuZW1wdHkoKS5hcHBlbmQoQGJvZHkpXG5cdFx0ZWxzZVxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5lbXB0eSgpLmFwcGVuZChAYm9keSlcblx0XHRAcmVzaXplQm94KClcblx0XHRyZXR1cm4gQFxuXG5cdGJ1aWxkQ29uZmlybTogKGJvZHksY2FwdGlvbixjYW5jZWw9ZmFsc2UpIC0+XG5cdFx0YnV0dG9uID0gJChcIjxhIGhyZWY9JyMje2NhcHRpb259JyBjbGFzcz0nek5vdGlmaWNhdGlvbnMtYnV0dG9uIHpOb3RpZmljYXRpb25zLWJ1dHRvbi1jb25maXJtJz4je2NhcHRpb259PC9hPlwiKSAjIEFkZCBjb25maXJtIGJ1dHRvblxuXHRcdGJ1dHRvbi5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIix0cnVlXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRib2R5LmFwcGVuZChidXR0b24pXG5cdFx0aWYgKGNhbmNlbClcblx0XHRcdGNCdXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FuY2VsfScgY2xhc3M9J3pOb3RpZmljYXRpb25zLWJ1dHRvbiB6Tm90aWZpY2F0aW9ucy1idXR0b24tY2FuY2VsJz4je2NhbmNlbH08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0XHRjQnV0dG9uLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsZmFsc2Vcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRib2R5LmFwcGVuZChjQnV0dG9uKVxuXG5cdFx0YnV0dG9uLmZvY3VzKClcblx0XHQkKFwiLm5vdGlmaWNhdGlvblwiKS5zY3JvbGxMZWZ0KDApXG5cblxuXHRidWlsZFByb21wdDogKGJvZHksY2FwdGlvbixjYW5jZWw9ZmFsc2UpIC0+XG5cdFx0aW5wdXQgPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnIGNsYXNzPSdpbnB1dCcvPlwiKSAjIEFkZCBpbnB1dFxuXHRcdGlucHV0Lm9uIFwia2V5dXBcIiwgKGUpID0+ICMgU2VuZCBvbiBlbnRlclxuXHRcdFx0aWYgZS5rZXlDb2RlID09IDEzXG5cdFx0XHRcdGJ1dHRvbi50cmlnZ2VyIFwiY2xpY2tcIiAjIFJlc3BvbnNlIHRvIGNvbmZpcm1cblx0XHRib2R5LmFwcGVuZChpbnB1dClcblxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J3pOb3RpZmljYXRpb25zLWJ1dHRvbiB6Tm90aWZpY2F0aW9ucy1idXR0b24tY29uZmlybSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PiAjIFJlc3BvbnNlIG9uIGJ1dHRvbiBjbGlja1xuXHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsaW5wdXQudmFsKClcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nek5vdGlmaWNhdGlvbnMtYnV0dG9uIHpOb3RpZmljYXRpb25zLWJ1dHRvbi1jYW5jZWwnPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGJvZHkuYXBwZW5kKGNCdXR0b24pXG5cblx0XHRpbnB1dC5mb2N1cygpXG5cdFx0JChcIi5ub3RpZmljYXRpb25cIikuc2Nyb2xsTGVmdCgwKVxuXG5cdHNldFByb2dyZXNzOiAocGVyY2VudF8pIC0+XG5cdFx0aWYgdHlwZW9mKHBlcmNlbnRfKSAhPSBcIm51bWJlclwiXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUeXBlRXJyb3I6IFByb2dyZXNzIG11c3QgYmUgaW50XCIpXG5cdFx0QHJlc2l6ZUJveCgpXG5cdFx0cGVyY2VudCA9IE1hdGgubWluKDEwMCwgcGVyY2VudF8pLzEwMFxuXHRcdG9mZnNldCA9IDc1LShwZXJjZW50Kjc1KVxuXHRcdGNpcmNsZSA9IFwiXCJcIlxuXHRcdFx0PGRpdiBjbGFzcz1cImNpcmNsZVwiPjxzdmcgY2xhc3M9XCJjaXJjbGUtc3ZnXCIgd2lkdGg9XCIzMFwiIGhlaWdodD1cIjMwXCIgdmlld3BvcnQ9XCIwIDAgMzAgMzBcIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1iZ1wiPjwvY2lyY2xlPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1mZ1wiIHN0eWxlPVwic3Ryb2tlLWRhc2hvZmZzZXQ6ICN7b2Zmc2V0fVwiPjwvY2lyY2xlPlxuXHRcdFx0PC9zdmc+PC9kaXY+XG5cdFx0XCJcIlwiXG5cdFx0d2lkdGggPSAkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLm91dGVyV2lkdGgoKVxuXHRcdCMkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmh0bWwobWVzc2FnZS5wYXJhbXNbMV0pXG5cdFx0aWYgbm90ICQoXCIuY2lyY2xlXCIsIEBlbGVtKS5sZW5ndGhcblx0XHRcdEByZWJ1aWxkTXNnIGNpcmNsZVxuXHRcdGlmICQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuY3NzKFwid2lkdGhcIikgPT0gXCJcIlxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5jc3MoXCJ3aWR0aFwiLCB3aWR0aClcblx0XHQkKFwiLmJvZHkgLmNpcmNsZS1mZ1wiLCBAZWxlbSkuY3NzKFwic3Ryb2tlLWRhc2hvZmZzZXRcIiwgb2Zmc2V0KVxuXHRcdGlmIHBlcmNlbnQgPiAwXG5cdFx0XHQkKFwiLmJvZHkgLmNpcmNsZS1iZ1wiLCBAZWxlbSkuY3NzIHtcImFuaW1hdGlvbi1wbGF5LXN0YXRlXCI6IFwicGF1c2VkXCIsIFwic3Ryb2tlLWRhc2hhcnJheVwiOiBcIjE4MHB4XCJ9XG5cblx0XHRpZiAkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5kYXRhKFwiZG9uZVwiKVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0ZWxzZSBpZiBwZXJjZW50XyA+PSAxMDAgICMgRG9uZVxuXHRcdFx0JChcIi5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInRyYW5zaXRpb25cIiwgXCJhbGwgMC4zcyBlYXNlLWluLW91dFwiKVxuXHRcdFx0c2V0VGltZW91dCAoLT5cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwic2NhbGUoMSlcIiwgb3BhY2l0eTogMX1cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvbiAuaWNvbi1zdWNjZXNzXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJyb3RhdGUoNDVkZWcpIHNjYWxlKDEpXCJ9XG5cdFx0XHQpLCAzMDBcblx0XHRcdGlmIEBSZWFsVGltZW91dFxuXHRcdFx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5yZW1vdmUoKSAjIEl0J3MgYWxyZWFkeSBjbG9zaW5nXG5cdFx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdFx0QGNsb3NlKFwiYXV0b1wiLHRydWUpXG5cdFx0XHRcdCksIEBSZWFsVGltZW91dFxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIiwgdHJ1ZSlcblx0XHRlbHNlIGlmIHBlcmNlbnRfIDwgMCAgIyBFcnJvclxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInN0cm9rZVwiLCBcIiNlYzZmNDdcIikuY3NzKFwidHJhbnNpdGlvblwiLCBcInRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2UtaW4tb3V0XCIpXG5cdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJzY2FsZSgxKVwiLCBvcGFjaXR5OiAxfVxuXHRcdFx0XHRAZWxlbS5yZW1vdmVDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWVycm9yXCIpXG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb24gLmljb24tc3VjY2Vzc1wiLCBAZWxlbSkucmVtb3ZlQ2xhc3MoXCJpY29uLXN1Y2Nlc3NcIikuaHRtbChcIiFcIilcblx0XHRcdCksIDMwMFxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIiwgdHJ1ZSlcblx0XHRyZXR1cm4gQFxuXG5cdHNldERlc2lnbjogKGNoYXIsdHlwZSkgLT5cblx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKGNoYXIpXG5cdFx0QGVsZW0uYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tXCIrdHlwZSlcblxuXHR1cGRhdGVUZXh0OiAodHlwZSkgLT5cblx0XHRzd2l0Y2godHlwZSlcblx0XHRcdHdoZW4gXCJlcnJvclwiIHRoZW4gQHNldERlc2lnbiBcIiFcIixcImVycm9yXCJcblx0XHRcdHdoZW4gXCJkb25lXCIgdGhlbiBAc2V0RGVzaWduIFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIixcImRvbmVcIlxuXHRcdFx0d2hlbiBcInByb2dyZXNzXCIgdGhlbiBAc2V0RGVzaWduIFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIixcInByb2dyZXNzXCJcblx0XHRcdHdoZW4gXCJhc2tcIiwgXCJsaXN0XCIsIFwicHJvbXB0XCIsIFwiY29uZmlybVwiIHRoZW4gQHNldERlc2lnbiBcIj9cIixcImFza1wiXG5cdFx0XHR3aGVuIFwiaW5mb1wiIHRoZW4gQHNldERlc2lnbiBcImlcIixcImluZm9cIlxuXHRcdFx0ZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbmtub3duTm90aWZpY2F0aW9uVHlwZTogVHlwZSBcIit0eXBlK1wiIGlzIG5vdCBrbm93blwiKVxuXG5cdGNsb3NlOiAoZXZlbnQ9XCJhdXRvXCIsY2I9ZmFsc2UpIC0+XG5cdFx0aWYgQGNsb3NlZFxuXHRcdFx0cmV0dXJuXG5cdFx0QGNsb3NlZD10cnVlXG5cdFx0aWYgKGNifHwhQGNhbGxlZClcblx0XHRcdEBjYWxsQmFjayBldmVudFxuXHRcdCQoXCIuY2xvc2VcIiwgQGVsZW0pLnJlbW92ZSgpICMgSXQncyBhbHJlYWR5IGNsb3Npbmdcblx0XHRAbWFpbi51bnJlZ2lzdGVyKEBpZClcblx0XHRAZWxlbS5zdG9wKCkuYW5pbWF0ZSB7XCJ3aWR0aFwiOiAwLCBcIm9wYWNpdHlcIjogMH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiXG5cdFx0ZWxlbT1AZWxlbVxuXHRcdEBlbGVtLnNsaWRlVXAgMzAwLCAoLT4gZWxlbS5yZW1vdmUoKSlcblx0XHRyZXR1cm4gQG1haW5cblxud2luZG93Lk5vdGlmaWNhdGlvbnMgPSBOb3RpZmljYXRpb25zXG4iLCJqUXVlcnkuY3NzSG9va3Muc2NhbGUgPSB7XG5cdGdldDogKGVsZW0sIGNvbXB1dGVkKSAtPlxuXHRcdG1hdGNoID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaChcIlswLTlcXC5dK1wiKVxuXHRcdGlmIG1hdGNoXG5cdFx0XHRzY2FsZSA9IHBhcnNlRmxvYXQobWF0Y2hbMF0pXG5cdFx0XHRyZXR1cm4gc2NhbGVcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gMS4wXG5cdHNldDogKGVsZW0sIHZhbCkgLT5cblx0XHR0cmFuc2Zvcm1zID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbSlbdHJhbnNmb3JtX3Byb3BlcnR5XS5tYXRjaCgvWzAtOVxcLl0rL2cpXG5cdFx0aWYgKHRyYW5zZm9ybXMpXG5cdFx0XHR0cmFuc2Zvcm1zWzBdID0gdmFsXG5cdFx0XHR0cmFuc2Zvcm1zWzNdID0gdmFsXG5cdFx0XHRlbGVtLnN0eWxlW3RyYW5zZm9ybV9wcm9wZXJ0eV0gPSAnbWF0cml4KCcrdHJhbnNmb3Jtcy5qb2luKFwiLCBcIikrJyknXG5cdFx0ZWxzZVxuXHRcdFx0ZWxlbS5zdHlsZVt0cmFuc2Zvcm1fcHJvcGVydHldID0gXCJzY2FsZShcIit2YWwrXCIpXCJcbn1cblxualF1ZXJ5LmZ4LnN0ZXAuc2NhbGUgPSAoZngpIC0+XG5cdGpRdWVyeS5jc3NIb29rc1snc2NhbGUnXS5zZXQoZnguZWxlbSwgZngubm93KVxuXG5pZiAod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtKVxuXHR0cmFuc2Zvcm1fcHJvcGVydHkgPSBcInRyYW5zZm9ybVwiXG5lbHNlXG5cdHRyYW5zZm9ybV9wcm9wZXJ0eSA9IFwid2Via2l0VHJhbnNmb3JtXCJcbiIsImpRdWVyeS5mbi5yZWFkZENsYXNzID0gKGNsYXNzX25hbWUpIC0+XG5cdGVsZW0gPSBAXG5cdGVsZW0ucmVtb3ZlQ2xhc3MgY2xhc3NfbmFtZVxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmFkZENsYXNzIGNsYXNzX25hbWVcblx0KSwgMVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4ucmVtb3ZlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5yZW1vdmUoKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5oaWRlTGF0ZXIgPSAodGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0aWYgZWxlbS5jc3MoXCJvcGFjaXR5XCIpID09IDBcblx0XHRcdGVsZW0uY3NzKFwiZGlzcGxheVwiLCBcIm5vbmVcIilcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uYWRkQ2xhc3NMYXRlciA9IChjbGFzc19uYW1lLCB0aW1lID0gNSkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5hZGRDbGFzcyhjbGFzc19uYW1lKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5jc3NMYXRlciA9IChuYW1lLCB2YWwsIHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uY3NzIG5hbWUsIHZhbFxuXHQpLCB0aW1lXG5cdHJldHVybiBAIl19
