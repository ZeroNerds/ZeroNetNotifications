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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQU07SUFDUSx1QkFBQyxLQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFDYjtJQURZOzs0QkFHYixHQUFBLEdBQUs7OzRCQUVMLFFBQUEsR0FBVSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1QsSUFBSSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBVDtBQUNDLGNBQVUsSUFBQSxLQUFBLENBQU0sZUFBQSxHQUFnQixFQUFoQixHQUFtQix3QkFBekIsRUFEWDs7YUFFQSxJQUFDLENBQUEsR0FBSSxDQUFBLEVBQUEsQ0FBTCxHQUFTO0lBSEE7OzRCQUtWLEdBQUEsR0FBSyxTQUFDLEVBQUQsRUFBSSxFQUFKO01BQ0osSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFOLElBQWEsRUFBakI7QUFDQyxjQUFVLElBQUEsS0FBQSxDQUFNLGtCQUFBLEdBQW1CLEVBQW5CLEdBQXNCLG9CQUE1QixFQURYOztBQUVBLGFBQU8sSUFBQyxDQUFBLEdBQUksQ0FBQSxFQUFBO0lBSFI7OzRCQUtMLFVBQUEsR0FBWSxTQUFDLEVBQUQsRUFBSSxDQUFKO01BQ1gsSUFBSSxDQUFDLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQSxDQUFWO0FBQ0MsY0FBVSxJQUFBLEtBQUEsQ0FBTSxrQkFBQSxHQUFtQixFQUFuQixHQUFzQixvQkFBNUIsRUFEWDs7YUFFQSxPQUFPLElBQUMsQ0FBQSxHQUFJLENBQUEsRUFBQTtJQUhEOzs0QkFNWixJQUFBLEdBQU0sU0FBQTtNQUNMLFVBQUEsQ0FBVyxDQUFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNYLEtBQUMsQ0FBQSxHQUFELENBQUssWUFBTCxFQUFtQixPQUFuQixFQUE0Qix5REFBNUI7aUJBQ0EsS0FBQyxD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LElBQUEsR0FBTztJQUNQLFVBQUEsQ0FBVyxDQUFFLFNBQUE7YUFDWixJQUFJLENBQUMsR0FBTCxDQUFTLElBQVQsRUFBZSxHQUFmO0lBRFksQ0FBRixDQUFYLEVBRUcsSUFGSDtBQUdBLFdBQU87RUFMYTtBQTlCckIiLCJmaWxlIjoiemVyb25ldC1ub3RpZmljYXRpb25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgTm90aWZpY2F0aW9uc1xuXHRjb25zdHJ1Y3RvcjogKEBlbGVtKSAtPlxuXHRcdEBcblxuXHRpZHM6IHt9XG5cblx0cmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmIChAaWRzW2lkXSlcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuaXF1ZUVycm9yOiBcIitpZCtcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIilcblx0XHRAaWRzW2lkXT1vXG5cblx0Z2V0OiAoaWQsdGgpIC0+XG5cdFx0aWYgKCFAaWRzW2lkXSAmJiB0aClcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVuZGVmaW5lZEVycm9yOiBcIitpZCtcIiBpcyBub3QgcmVnaXN0ZXJlZFwiKVxuXHRcdHJldHVybiBAaWRzW2lkXVxuXG5cdHVucmVnaXN0ZXI6IChpZCxvKSAtPlxuXHRcdGlmICghQGlkc1tpZF0pXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJVbmRlZmluZWRFcnJvcjogXCIraWQrXCIgaXMgbm90IHJlZ2lzdGVyZWRcIilcblx0XHRkZWxldGUgQGlkc1tpZF1cblxuXHQjIFRPRE86IGFkZCB1bml0IHRlc3RzXG5cdHRlc3Q6IC0+XG5cdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdEBhZGQoXCJjb25uZWN0aW9uXCIsIFwiZXJyb3JcIiwgXCJDb25uZWN0aW9uIGxvc3QgdG8gPGI+VWlTZXJ2ZXI8L2I+IG9uIDxiPmxvY2FsaG9zdDwvYj4hXCIpXG5cdFx0XHRAYWRkKFwibWVzc2FnZS1BbnlvbmVcIiwgXCJpbmZvXCIsIFwiTmV3ICBmcm9tIDxiPkFueW9uZTwvYj4uXCIpXG5cdFx0KSwgMTAwMFxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImRvbmVcIiwgXCI8Yj5VaVNlcnZlcjwvYj4gY29ubmVjdGlvbiByZWNvdmVyZWQuXCIsIDUwMDApXG5cdFx0KSwgMzAwMFxuXG5cblx0YWRkOiAoaWQsIHR5cGUsIGJvZHksIHRpbWVvdXQ9MCwgb3B0aW9ucz17fSwgY2IpIC0+XG5cdFx0cmV0dXJuIG5ldyBOb3RpZmljYXRpb24gQCwge2lkLHR5cGUsYm9keSx0aW1lb3V0LG9wdGlvbnMsY2J9XG5cblx0Y2xvc2U6IChpZCkgLT5cblx0XHRAZ2V0KGlkLHRydWUpLmNsb3NlKClcblxuI1x0ZGlzcGxheUNvbmZpcm06IChtZXNzYWdlLCBjYXB0aW9uLCBjYW5jZWw9ZmFsc2UsIGNiKSAtPlxuI1x0ZGlzcGxheVByb21wdDogKG1lc3NhZ2UsIHR5cGUsIGNhcHRpb24sIGNiKSAtPlxuXG5jbGFzcyBOb3RpZmljYXRpb25cblx0Y29uc3RydWN0b3I6IChAbWFpbixtZXNzYWdlKSAtPiAjKEBpZCwgQHR5cGUsIEBib2R5LCBAdGltZW91dD0wKSAtPlxuXHRcdEBtYWluX2VsZW09QG1haW4uZWxlbVxuXHRcdEBvcHRpb25zPW1lc3NhZ2Uub3B0aW9uc1xuXHRcdEBjYj1tZXNzYWdlLmNiXG5cdFx0QGlkID0gbWVzc2FnZS5pZC5yZXBsYWNlIC9bXkEtWmEtejAtOV0vZywgXCJcIlxuXG5cdFx0IyBDbG9zZSBub3RpZmljYXRpb25zIHdpdGggc2FtZSBpZFxuXHRcdGlmIEBtYWluLmdldChAaWQpXG5cdFx0XHRAbWFpbi5nZXQoQGlkKS5jbG9zZSgpXG5cblxuXHRcdEB0eXBlPW1lc3NhZ2UudHlwZVxuXHRcdEBbXCJpc1wiK0B0eXBlLnN1YnN0cigwLDEpLnRvVXBwZXJDYXNlKCkrQHR5cGUuc3Vic3RyKDEpXT10cnVlXG5cblx0XHRpZiBAaXNQcm9ncmVzc1xuXHRcdFx0QFJlYWxUaW1lb3V0PW1lc3NhZ2UudGltZW91dCAjcHJldmVudCBmcm9tIGxhdW5jaGluZyB0b28gZWFybHlcblx0XHRlbHNlIGlmIEBpc0lucHV0IG9yIEBpc0NvbmZpcm0gI2lnbm9yZVxuXHRcdGVsc2Vcblx0XHRcdEBUaW1lb3V0PW1lc3NhZ2UudGltZW91dFxuXG5cdFx0QG1haW4ucmVnaXN0ZXIoQGlkLEApICNyZWdpc3RlclxuXG5cdFx0QFxuXG5cdFx0IyBDcmVhdGUgZWxlbWVudFxuXHRcdEBlbGVtID0gJChcIi5ub3RpZmljYXRpb24ubm90aWZpY2F0aW9uVGVtcGxhdGVcIiwgQG1haW5fZWxlbSkuY2xvbmUoKS5yZW1vdmVDbGFzcyhcIm5vdGlmaWNhdGlvblRlbXBsYXRlXCIpICMgVE9ETzogZ2V0IGVsZW0gZnJvbSBub3RpZmljYXRpb25zXG5cdFx0QGVsZW0uYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tI3tAdHlwZX1cIikuYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tI3tAaWR9XCIpXG5cdFx0aWYgQGlzUHJvZ3Jlc3Ncblx0XHRcdEBlbGVtLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIilcblx0XHQjIFVwZGF0ZSB0ZXh0XG5cdFx0QHVwZGF0ZVRleHQgQHR5cGVcblxuXHRcdGJvZHk9bWVzc2FnZS5ib2R5XG5cdFx0QGJvZHk9Ym9keVxuXG5cdFx0QHJlYnVpbGRNc2cgXCJcIlxuXG5cdFx0QGVsZW0uYXBwZW5kVG8oQG1haW5fZWxlbSlcblxuXHRcdCMgVGltZW91dFxuXHRcdGlmIEBUaW1lb3V0XG5cdFx0XHQkKFwiLmNsb3NlXCIsIEBlbGVtKS5yZW1vdmUoKSAjIE5vIG5lZWQgb2YgY2xvc2UgYnV0dG9uXG5cdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHRAY2xvc2UoKVxuXHRcdFx0KSwgQFRpbWVvdXRcblxuXHRcdCNJbml0IG1haW4gc3R1ZmZcblx0XHRpZiBAaXNQcm9ncmVzc1xuXHRcdFx0QHNldFByb2dyZXNzKEBvcHRpb25zLnByb2dyZXNzfHwwKVxuXHRcdGlmIEBpc1Byb21wdFxuXHRcdFx0QGJ1aWxkUHJvbXB0KCQoXCIuYm9keVwiLCBAZWxlbSksIEBvcHRpb25zLmNvbmZpcm1fbGFiZWx8fFwiT2tcIiwgQG9wdGlvbnMuY2FuY2VsX2xhYmVsfHxmYWxzZSlcblx0XHRpZiBAaXNDb25maXJtXG5cdFx0XHRAYnVpbGRDb25maXJtKCQoXCIuYm9keVwiLCBAZWxlbSksIEBvcHRpb25zLmNvbmZpcm1fbGFiZWx8fFwiT2tcIiwgQG9wdGlvbnMuY2FuY2VsX2xhYmVsfHxmYWxzZSlcblxuXHRcdCMgQW5pbWF0ZVxuXHRcdHdpZHRoID0gQGVsZW0ub3V0ZXJXaWR0aCgpXG5cdFx0aWYgbm90IEBUaW1lb3V0IHRoZW4gd2lkdGggKz0gMjAgIyBBZGQgc3BhY2UgZm9yIGNsb3NlIGJ1dHRvblxuXHRcdGlmIEBlbGVtLm91dGVySGVpZ2h0KCkgPiA1NSB0aGVuIEBlbGVtLmFkZENsYXNzKFwibG9uZ1wiKVxuXHRcdEBlbGVtLmNzcyh7XCJ3aWR0aFwiOiBcIjUwcHhcIiwgXCJ0cmFuc2Zvcm1cIjogXCJzY2FsZSgwLjAxKVwifSlcblx0XHRAZWxlbS5hbmltYXRlKHtcInNjYWxlXCI6IDF9LCA4MDAsIFwiZWFzZU91dEVsYXN0aWNcIilcblx0XHRAZWxlbS5hbmltYXRlKHtcIndpZHRoXCI6IHdpZHRofSwgNzAwLCBcImVhc2VJbk91dEN1YmljXCIpXG5cdFx0JChcIi5ib2R5XCIsIEBlbGVtKS5jc3NMYXRlcihcImJveC1zaGFkb3dcIiwgXCIwcHggMHB4IDVweCByZ2JhKDAsMCwwLDAuMSlcIiwgMTAwMClcblxuXHRcdCMgQ2xvc2UgYnV0dG9uIG9yIENvbmZpcm0gYnV0dG9uXG5cdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlKFwidXNlclwiLHRydWUpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHQkKFwiLmJ1dHRvblwiLCBAZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlKClcblx0XHRcdHJldHVybiBmYWxzZVxuXG5cdFx0IyBTZWxlY3QgbGlzdFxuXHRcdCQoXCIuc2VsZWN0XCIsIEBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UoKVxuXG5cdHJlc2l6ZUJveDogLT5cblx0XHRAZWxlbS5jc3MoXCJ3aWR0aFwiLFwiaW5oZXJpdFwiKVxuXG5cdGNhbGxCYWNrOiAoZXZlbnQscmVzKSAtPlxuXHRcdGlmIEBjYWxsZWRcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkNhbGJhY2tFcnJvcjogQ2FsbGJhY2sgd2FzIGNhbGxlZCB0d2ljZVwiKVxuXHRcdEBjYWxsZWQ9dHJ1ZVxuXHRcdGlmIHR5cGVvZihAY2IpICE9IFwiZnVuY3Rpb25cIlxuXHRcdFx0Y29uc29sZS53YXJuKFwiU2lsZW50bHkgZmFpbGluZyBjYWxsYmFjayBAICVzOiAlcyAmICclcydcIixAaWQsZXZlbnQscmVzKVxuXHRcdFx0cmV0dXJuXG5cdFx0Y29uc29sZS5pbmZvKFwiRXZlbnQgQCAlcyAlcyAlc1wiLEBpZCxldmVudCxyZXMpXG5cdFx0QGNiKGV2ZW50LHJlcylcblxuXHRyZWJ1aWxkTXNnOiAoYXBwZW5kKSAtPlxuXHRcdEBhcHBlbmQ9JChhcHBlbmQpXG5cdFx0aWYgdHlwZW9mKEBib2R5KSA9PSBcInN0cmluZ1wiXG5cdFx0XHQkKFwiLmJvZHlcIiwgQGVsZW0pLmh0bWwoXCI8c3BhbiBjbGFzcz0nbWVzc2FnZSc+XCIrQGVzY2FwZShAYm9keSkrXCI8L3NwYW4+XCIpLmFwcGVuZChAYXBwZW5kKVxuXHRcdGVsc2Vcblx0XHRcdCQoXCIuYm9keVwiLCBAZWxlbSkuaHRtbChcIlwiKS5hcHBlbmQoQGJvZHksQGFwcGVuZClcblxuXHRlc2NhcGU6ICh2YWx1ZSkgLT5cbiBcdFx0cmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvJi9nLCAnJmFtcDsnKS5yZXBsYWNlKC88L2csICcmbHQ7JykucmVwbGFjZSgvPi9nLCAnJmd0OycpLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKS5yZXBsYWNlKC8mbHQ7KFtcXC9dezAsMX0oYnJ8Ynx1fGkpKSZndDsvZywgXCI8JDE+XCIpICMgRXNjYXBlIGFuZCBVbmVzY2FwZSBiLCBpLCB1LCBiciB0YWdzXG5cblx0c2V0Qm9keTogKGJvZHkpIC0+XG5cdFx0QGJvZHk9Ym9keVxuXHRcdGlmIHR5cGVvZihAYm9keSkgPT0gXCJzdHJpbmdcIlxuXHRcdFx0QGJvZHk9JChcIjxzcGFuPlwiK0Blc2NhcGUoQGJvZHkpK1wiPC9zcGFuPlwiKVxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5lbXB0eSgpLmFwcGVuZChAYm9keSlcblx0XHRlbHNlXG5cdFx0XHQkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmVtcHR5KCkuYXBwZW5kKEBib2R5KVxuXHRcdEByZXNpemVCb3goKVxuXHRcdHJldHVybiBAXG5cblx0YnVpbGRDb25maXJtOiAoYm9keSxjYXB0aW9uLGNhbmNlbD1mYWxzZSkgLT5cblx0XHRidXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FwdGlvbn0nIGNsYXNzPSdidXR0b24gYnV0dG9uLSN7Y2FwdGlvbn0nPiN7Y2FwdGlvbn08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0YnV0dG9uLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLHRydWVcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nYnV0dG9uIGJ1dHRvbi0je2NhbmNlbH0nPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRAY2FsbEJhY2sgXCJhY3Rpb25cIixmYWxzZVxuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdGJvZHkuYXBwZW5kKGNCdXR0b24pXG5cblx0XHRidXR0b24uZm9jdXMoKVxuXHRcdCQoXCIubm90aWZpY2F0aW9uXCIpLnNjcm9sbExlZnQoMClcblxuXG5cdGJ1aWxkUHJvbXB0OiAoYm9keSxjYXB0aW9uLGNhbmNlbD1mYWxzZSkgLT5cblx0XHRpbnB1dCA9ICQoXCI8aW5wdXQgdHlwZT0nI3tAdHlwZX0nIGNsYXNzPSdpbnB1dCBidXR0b24tI3tAdHlwZX0nLz5cIikgIyBBZGQgaW5wdXRcblx0XHRpbnB1dC5vbiBcImtleXVwXCIsIChlKSA9PiAjIFNlbmQgb24gZW50ZXJcblx0XHRcdGlmIGUua2V5Q29kZSA9PSAxM1xuXHRcdFx0XHRidXR0b24udHJpZ2dlciBcImNsaWNrXCIgIyBSZXNwb25zZSB0byBjb25maXJtXG5cdFx0Ym9keS5hcHBlbmQoaW5wdXQpXG5cblx0XHRidXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FwdGlvbn0nIGNsYXNzPSdidXR0b24gYnV0dG9uLSN7Y2FwdGlvbn0nPiN7Y2FwdGlvbn08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0YnV0dG9uLm9uIFwiY2xpY2tcIiwgPT4gIyBSZXNwb25zZSBvbiBidXR0b24gY2xpY2tcblx0XHRcdEBjYWxsQmFjayBcImFjdGlvblwiLGlucHV0LnZhbCgpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRib2R5LmFwcGVuZChidXR0b24pXG5cdFx0aWYgKGNhbmNlbClcblx0XHRcdGNCdXR0b24gPSAkKFwiPGEgaHJlZj0nIyN7Y2FuY2VsfScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYW5jZWx9Jz4je2NhbmNlbH08L2E+XCIpICMgQWRkIGNvbmZpcm0gYnV0dG9uXG5cdFx0XHRjQnV0dG9uLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdFx0QGNhbGxCYWNrIFwiYWN0aW9uXCIsZmFsc2Vcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRib2R5LmFwcGVuZChjQnV0dG9uKVxuXG5cdFx0aW5wdXQuZm9jdXMoKVxuXHRcdCQoXCIubm90aWZpY2F0aW9uXCIpLnNjcm9sbExlZnQoMClcblxuXHRzZXRQcm9ncmVzczogKHBlcmNlbnRfKSAtPlxuXHRcdGlmIHR5cGVvZihwZXJjZW50XykgIT0gXCJudW1iZXJcIlxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiVHlwZUVycm9yOiBQcm9ncmVzcyBtdXN0IGJlIGludFwiKVxuXHRcdEByZXNpemVCb3goKVxuXHRcdHBlcmNlbnQgPSBNYXRoLm1pbigxMDAsIHBlcmNlbnRfKS8xMDBcblx0XHRvZmZzZXQgPSA3NS0ocGVyY2VudCo3NSlcblx0XHRjaXJjbGUgPSBcIlwiXCJcblx0XHRcdDxkaXYgY2xhc3M9XCJjaXJjbGVcIj48c3ZnIGNsYXNzPVwiY2lyY2xlLXN2Z1wiIHdpZHRoPVwiMzBcIiBoZWlnaHQ9XCIzMFwiIHZpZXdwb3J0PVwiMCAwIDMwIDMwXCIgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj5cbiAgXHRcdFx0XHQ8Y2lyY2xlIHI9XCIxMlwiIGN4PVwiMTVcIiBjeT1cIjE1XCIgZmlsbD1cInRyYW5zcGFyZW50XCIgY2xhc3M9XCJjaXJjbGUtYmdcIj48L2NpcmNsZT5cbiAgXHRcdFx0XHQ8Y2lyY2xlIHI9XCIxMlwiIGN4PVwiMTVcIiBjeT1cIjE1XCIgZmlsbD1cInRyYW5zcGFyZW50XCIgY2xhc3M9XCJjaXJjbGUtZmdcIiBzdHlsZT1cInN0cm9rZS1kYXNob2Zmc2V0OiAje29mZnNldH1cIj48L2NpcmNsZT5cblx0XHRcdDwvc3ZnPjwvZGl2PlxuXHRcdFwiXCJcIlxuXHRcdHdpZHRoID0gJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5vdXRlcldpZHRoKClcblx0XHQjJChcIi5ib2R5IC5tZXNzYWdlXCIsIEBlbGVtKS5odG1sKG1lc3NhZ2UucGFyYW1zWzFdKVxuXHRcdGlmIG5vdCAkKFwiLmNpcmNsZVwiLCBAZWxlbSkubGVuZ3RoXG5cdFx0XHRAcmVidWlsZE1zZyBjaXJjbGVcblx0XHRpZiAkKFwiLmJvZHkgLm1lc3NhZ2VcIiwgQGVsZW0pLmNzcyhcIndpZHRoXCIpID09IFwiXCJcblx0XHRcdCQoXCIuYm9keSAubWVzc2FnZVwiLCBAZWxlbSkuY3NzKFwid2lkdGhcIiwgd2lkdGgpXG5cdFx0JChcIi5ib2R5IC5jaXJjbGUtZmdcIiwgQGVsZW0pLmNzcyhcInN0cm9rZS1kYXNob2Zmc2V0XCIsIG9mZnNldClcblx0XHRpZiBwZXJjZW50ID4gMFxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtYmdcIiwgQGVsZW0pLmNzcyB7XCJhbmltYXRpb24tcGxheS1zdGF0ZVwiOiBcInBhdXNlZFwiLCBcInN0cm9rZS1kYXNoYXJyYXlcIjogXCIxODBweFwifVxuXG5cdFx0aWYgJChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuZGF0YShcImRvbmVcIilcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGVsc2UgaWYgcGVyY2VudF8gPj0gMTAwICAjIERvbmVcblx0XHRcdCQoXCIuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJ0cmFuc2l0aW9uXCIsIFwiYWxsIDAuM3MgZWFzZS1pbi1vdXRcIilcblx0XHRcdHNldFRpbWVvdXQgKC0+XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsIG9wYWNpdHk6IDF9XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb24gLmljb24tc3VjY2Vzc1wiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwicm90YXRlKDQ1ZGVnKSBzY2FsZSgxKVwifVxuXHRcdFx0KSwgMzAwXG5cdFx0XHRpZiBAUmVhbFRpbWVvdXRcblx0XHRcdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBJdCdzIGFscmVhZHkgY2xvc2luZ1xuXHRcdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHRcdEBjbG9zZShcImF1dG9cIix0cnVlKVxuXHRcdFx0XHQpLCBAUmVhbFRpbWVvdXRcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIsIHRydWUpXG5cdFx0ZWxzZSBpZiBwZXJjZW50XyA8IDAgICMgRXJyb3Jcblx0XHRcdCQoXCIuYm9keSAuY2lyY2xlLWZnXCIsIEBlbGVtKS5jc3MoXCJzdHJva2VcIiwgXCIjZWM2ZjQ3XCIpLmNzcyhcInRyYW5zaXRpb25cIiwgXCJ0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlLWluLW91dFwiKVxuXHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuY3NzIHt0cmFuc2Zvcm06IFwic2NhbGUoMSlcIiwgb3BhY2l0eTogMX1cblx0XHRcdFx0QGVsZW0ucmVtb3ZlQ2xhc3MoXCJub3RpZmljYXRpb24tZG9uZVwiKS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1lcnJvclwiKVxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uIC5pY29uLXN1Y2Nlc3NcIiwgQGVsZW0pLnJlbW92ZUNsYXNzKFwiaWNvbi1zdWNjZXNzXCIpLmh0bWwoXCIhXCIpXG5cdFx0XHQpLCAzMDBcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmRhdGEoXCJkb25lXCIsIHRydWUpXG5cdFx0cmV0dXJuIEBcblxuXHR1cGRhdGVUZXh0OiAodHlwZSkgLT5cblx0XHRpZiB0eXBlID09IFwiZXJyb3JcIlxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuaHRtbChcIiFcIilcblx0XHRlbHNlIGlmIHR5cGUgPT0gXCJkb25lXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcInByb2dyZXNzXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcImFza1wiIHx8IHR5cGUgPT0gXCJsaXN0XCIgfHwgdHlwZSA9PSBcInByb21wdFwiIHx8IHR5cGUgPT0gXCJjb25maXJtXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCI/XCIpXG5cdFx0ZWxzZSBpZiB0eXBlID09IFwiaW5mb1wiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKFwiaVwiKVxuXHRcdGVsc2Vcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVua25vd25Ob3RpZmljYXRpb25UeXBlOiBUeXBlIFwiK3R5cGUrXCIgaXMgbm90IGtub3duXCIpXG5cblx0Y2xvc2U6IChldmVudD1cImF1dG9cIixjYj1mYWxzZSkgLT5cblx0XHRpZiAoY2J8fCFAY2FsbGVkKVxuXHRcdFx0QGNhbGxCYWNrIGV2ZW50XG5cdFx0JChcIi5jbG9zZVwiLCBAZWxlbSkucmVtb3ZlKCkgIyBJdCdzIGFscmVhZHkgY2xvc2luZ1xuXHRcdEBtYWluLnVucmVnaXN0ZXIoQGlkKVxuXHRcdEBlbGVtLnN0b3AoKS5hbmltYXRlIHtcIndpZHRoXCI6IDAsIFwib3BhY2l0eVwiOiAwfSwgNzAwLCBcImVhc2VJbk91dEN1YmljXCJcblx0XHRlbGVtPUBlbGVtXG5cdFx0QGVsZW0uc2xpZGVVcCAzMDAsICgtPiBlbGVtLnJlbW92ZSgpKVxuXHRcdHJldHVybiBAbWFpblxuXG53aW5kb3cuTm90aWZpY2F0aW9ucyA9IE5vdGlmaWNhdGlvbnNcbiIsImpRdWVyeS5jc3NIb29rcy5zY2FsZSA9IHtcblx0Z2V0OiAoZWxlbSwgY29tcHV0ZWQpIC0+XG5cdFx0bWF0Y2ggPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVt0cmFuc2Zvcm1fcHJvcGVydHldLm1hdGNoKFwiWzAtOVxcLl0rXCIpXG5cdFx0aWYgbWF0Y2hcblx0XHRcdHNjYWxlID0gcGFyc2VGbG9hdChtYXRjaFswXSlcblx0XHRcdHJldHVybiBzY2FsZVxuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAxLjBcblx0c2V0OiAoZWxlbSwgdmFsKSAtPlxuXHRcdHRyYW5zZm9ybXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtKVt0cmFuc2Zvcm1fcHJvcGVydHldLm1hdGNoKC9bMC05XFwuXSsvZylcblx0XHRpZiAodHJhbnNmb3Jtcylcblx0XHRcdHRyYW5zZm9ybXNbMF0gPSB2YWxcblx0XHRcdHRyYW5zZm9ybXNbM10gPSB2YWxcblx0XHRcdGVsZW0uc3R5bGVbdHJhbnNmb3JtX3Byb3BlcnR5XSA9ICdtYXRyaXgoJyt0cmFuc2Zvcm1zLmpvaW4oXCIsIFwiKSsnKSdcblx0XHRlbHNlXG5cdFx0XHRlbGVtLnN0eWxlW3RyYW5zZm9ybV9wcm9wZXJ0eV0gPSBcInNjYWxlKFwiK3ZhbCtcIilcIlxufVxuXG5qUXVlcnkuZnguc3RlcC5zY2FsZSA9IChmeCkgLT5cblx0alF1ZXJ5LmNzc0hvb2tzWydzY2FsZSddLnNldChmeC5lbGVtLCBmeC5ub3cpXG5cbmlmICh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5ib2R5KS50cmFuc2Zvcm0pXG5cdHRyYW5zZm9ybV9wcm9wZXJ0eSA9IFwidHJhbnNmb3JtXCJcbmVsc2Vcblx0dHJhbnNmb3JtX3Byb3BlcnR5ID0gXCJ3ZWJraXRUcmFuc2Zvcm1cIlxuIiwialF1ZXJ5LmZuLnJlYWRkQ2xhc3MgPSAoY2xhc3NfbmFtZSkgLT5cblx0ZWxlbSA9IEBcblx0ZWxlbS5yZW1vdmVDbGFzcyBjbGFzc19uYW1lXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uYWRkQ2xhc3MgY2xhc3NfbmFtZVxuXHQpLCAxXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5yZW1vdmVMYXRlciA9ICh0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLnJlbW92ZSgpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmhpZGVMYXRlciA9ICh0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRpZiBlbGVtLmNzcyhcIm9wYWNpdHlcIikgPT0gMFxuXHRcdFx0ZWxlbS5jc3MoXCJkaXNwbGF5XCIsIFwibm9uZVwiKVxuXHQpLCB0aW1lXG5cdHJldHVybiBAXG5cbmpRdWVyeS5mbi5hZGRDbGFzc0xhdGVyID0gKGNsYXNzX25hbWUsIHRpbWUgPSA1KSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmFkZENsYXNzKGNsYXNzX25hbWUpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmNzc0xhdGVyID0gKG5hbWUsIHZhbCwgdGltZSA9IDUwMCkgLT5cblx0ZWxlbSA9IEBcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5jc3MgbmFtZSwgdmFsXG5cdCksIHRpbWVcblx0cmV0dXJuIEAiXX0=
