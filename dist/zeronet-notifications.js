(function() {
  var Notification, Notifications,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Notifications = (function() {
    function Notifications(elem1) {
      this.elem = elem1;
      this;
    }

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

    Notifications.prototype.add = function(id, type, body, timeout) {
      var elem, j, len, ref, width;
      if (timeout == null) {
        timeout = 0;
      }
      id = id.replace(/[^A-Za-z0-9]/g, "");
      ref = $(".notification-" + id);
      for (j = 0, len = ref.length; j < len; j++) {
        elem = ref[j];
        this.close($(elem));
      }
      elem = $(".notification.notificationTemplate", this.elem).clone().removeClass("notificationTemplate");
      elem.addClass("notification-" + type).addClass("notification-" + id);
      if (type === "progress") {
        elem.addClass("notification-done");
      }
      if (type === "error") {
        $(".notification-icon", elem).html("!");
      } else if (type === "done") {
        $(".notification-icon", elem).html("<div class='icon-success'></div>");
      } else if (type === "progress") {
        $(".notification-icon", elem).html("<div class='icon-success'></div>");
      } else if (type === "ask") {
        $(".notification-icon", elem).html("?");
      } else {
        $(".notification-icon", elem).html("i");
      }
      if (typeof body === "string") {
        $(".body", elem).html("<span class='message'>" + body + "</span>");
      } else {
        $(".body", elem).html("").append(body);
      }
      elem.appendTo(this.elem);
      if (timeout) {
        $(".close", elem).remove();
        setTimeout(((function(_this) {
          return function() {
            return _this.close(elem);
          };
        })(this)), timeout);
      }
      width = elem.outerWidth();
      if (!timeout) {
        width += 20;
      }
      if (elem.outerHeight() > 55) {
        elem.addClass("long");
      }
      elem.css({
        "width": "50px",
        "transform": "scale(0.01)"
      });
      elem.animate({
        "scale": 1
      }, 800, "easeOutElastic");
      elem.animate({
        "width": width
      }, 700, "easeInOutCubic");
      $(".body", elem).cssLater("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)", 1000);
      $(".close, .button", elem).on("click", (function(_this) {
        return function() {
          _this.close(elem);
          return false;
        };
      })(this));
      $(".select", elem).on("click", (function(_this) {
        return function() {
          return _this.close(elem);
        };
      })(this));
      return elem;
    };

    Notifications.prototype.close = function(elem) {
      elem.stop().animate({
        "width": 0,
        "opacity": 0
      }, 700, "easeInOutCubic");
      return elem.slideUp(300, (function() {
        return elem.remove();
      }));
    };

    Notifications.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return console.log.apply(console, ["[Notifications]"].concat(slice.call(args)));
    };

    Notifications.prototype.displayOpenerDialog = function() {
      var elem;
      elem = $("<div class='opener-overlay'><div class='dialog'>You have opened this page by clicking on a link. Please, confirm if you want to load this site.<a href='?' target='_blank' class='button'>Open site</a></div></div>");
      elem.find('a').on("click", function() {
        window.open("?", "_blank");
        window.close();
        return false;
      });
      return $("body").prepend(elem);
    };

    Notifications.prototype.actionOpenWindow = function(params) {
      var w;
      if (typeof params === "string") {
        w = window.open();
        w.opener = null;
        return w.location = params;
      } else {
        w = window.open(null, params[1], params[2]);
        w.opener = null;
        return w.location = params[0];
      }
    };

    Notifications.prototype.actionRequestFullscreen = function() {
      var elem, request_fullscreen;
      if (indexOf.call(this.site_info.settings.permissions, "Fullscreen") >= 0) {
        elem = document.getElementById("inner-iframe");
        request_fullscreen = elem.requestFullScreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullScreen;
        request_fullscreen.call(elem);
        return setTimeout(((function(_this) {
          return function() {
            if (window.innerHeight !== screen.height) {
              return _this.displayConfirm("This site requests permission:" + " <b>Fullscreen</b>", "Grant", function() {
                return request_fullscreen.call(elem);
              });
            }
          };
        })(this)), 100);
      } else {
        return this.displayConfirm("This site requests permission:" + " <b>Fullscreen</b>", "Grant", (function(_this) {
          return function() {
            _this.site_info.settings.permissions.push("Fullscreen");
            _this.actionRequestFullscreen();
            return _this.ws.cmd("permissionAdd", "Fullscreen");
          };
        })(this));
      }
    };

    Notifications.prototype.actionPermissionAdd = function(message) {
      var permission;
      permission = message.params;
      return this.displayConfirm("This site requests permission:" + (" <b>" + (this.toHtmlSafe(permission)) + "</b>"), "Grant", (function(_this) {
        return function() {
          return _this.ws.cmd("permissionAdd", permission, function() {
            return _this.sendInner({
              "cmd": "response",
              "to": message.id,
              "result": "Granted"
            });
          });
        };
      })(this));
    };

    Notifications.prototype.actionNotification = function(message) {
      var body;
      message.params = this.toHtmlSafe(message.params);
      body = $("<span class='message'>" + message.params[1] + "</span>");
      return this.add("notification-" + message.id, message.params[0], body, message.params[2]);
    };

    Notifications.prototype.displayConfirm = function(message, caption, cancel, cb) {
      var body, button, cButton;
      if (cancel == null) {
        cancel = false;
      }
      body = $("<span class='message'>" + message + "</span>");
      button = $("<a href='#" + caption + "' class='button button-" + caption + "'>" + caption + "</a>");
      button.on("click", (function(_this) {
        return function() {
          cb(true);
          return false;
        };
      })(this));
      body.append(button);
      if (cancel) {
        cButton = $("<a href='#" + cancel + "' class='button button-" + cancel + "'>" + cancel + "</a>");
        cButton.on("click", (function(_this) {
          return function() {
            cb(false);
            return false;
          };
        })(this));
        body.append(cButton);
      }
      this.add("notification-" + caption, "ask", body);
      button.focus();
      return $(".notification").scrollLeft(0);
    };

    Notifications.prototype.actionConfirm = function(message, cb) {
      var caption;
      if (cb == null) {
        cb = false;
      }
      message.params = this.toHtmlSafe(message.params);
      if (message.params[1]) {
        caption = message.params[1];
      } else {
        caption = "ok";
      }
      return this.displayConfirm(message.params[0], caption, (function(_this) {
        return function() {
          _this.sendInner({
            "cmd": "response",
            "to": message.id,
            "result": "boom"
          });
          return false;
        };
      })(this));
    };

    Notifications.prototype.displayPrompt = function(message, type, caption, cb) {
      var body, button, input;
      body = $("<span class='message'>" + message + "</span>");
      input = $("<input type='" + type + "' class='input button-" + type + "'/>");
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
          cb(input.val());
          return false;
        };
      })(this));
      body.append(button);
      this.add("notification-" + message.id, "ask", body);
      input.focus();
      return $(".notification").scrollLeft(0);
    };

    Notifications.prototype.actionPrompt = function(message) {
      var caption, type;
      message.params = this.toHtmlSafe(message.params);
      if (message.params[1]) {
        type = message.params[1];
      } else {
        type = "text";
      }
      caption = "OK";
      return this.displayPrompt(message.params[0], type, caption, (function(_this) {
        return function(res) {
          return _this.sendInner({
            "cmd": "response",
            "to": message.id,
            "result": res
          });
        };
      })(this));
    };

    Notifications.prototype.actionProgress = function(message) {
      var body, circle, elem, offset, percent, width;
      percent = Math.min(100, message.percent) / 100;
      offset = 75 - (percent * 75);
      circle = "<div class=\"circle\"><svg class=\"circle-svg\" width=\"30\" height=\"30\" viewport=\"0 0 30 30\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\">\n  				<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class=\"circle-bg\"></circle>\n  				<circle r=\"12\" cx=\"15\" cy=\"15\" fill=\"transparent\" class=\"circle-fg\" style=\"stroke-dashoffset: " + offset + "\"></circle>\n</svg></div>";
      body = "<span class='message'>" + message.content + "</span>" + circle;
      elem = $(".notification-" + message.id);
      if (elem.length) {
        width = $(".body .message", elem).outerWidth();
        $(".body .message", elem).html(message.content);
        if ($(".body .message", elem).css("width") === "") {
          $(".body .message", elem).css("width", width);
        }
        $(".body .circle-fg", elem).css("stroke-dashoffset", offset);
      } else {
        elem = this.add(message.id, "progress", $(body));
      }
      if (percent > 0) {
        $(".body .circle-bg", elem).css({
          "animation-play-state": "paused",
          "stroke-dasharray": "180px"
        });
      }
      if ($(".notification-icon", elem).data("done")) {
        return false;
      } else if (message.percent >= 100) {
        $(".circle-fg", elem).css("transition", "all 0.3s ease-in-out");
        setTimeout((function() {
          $(".notification-icon", elem).css({
            transform: "scale(1)",
            opacity: 1
          });
          return $(".notification-icon .icon-success", elem).css({
            transform: "rotate(45deg) scale(1)"
          });
        }), 300);
        if (message.autoClose) {
          setTimeout(((function(_this) {
            return function() {
              return _this.close(elem);
            };
          })(this)), 3000);
        }
        return $(".notification-icon", elem).data("done", true);
      } else if (message.percent < 0) {
        $(".body .circle-fg", elem).css("stroke", "#ec6f47").css("transition", "transition: all 0.3s ease-in-out");
        setTimeout(((function(_this) {
          return function() {
            $(".notification-icon", elem).css({
              transform: "scale(1)",
              opacity: 1
            });
            elem.removeClass("notification-done").addClass("notification-error");
            return $(".notification-icon .icon-success", elem).removeClass("icon-success").html("!");
          };
        })(this)), 300);
        return $(".notification-icon", elem).data("done", true);
      }
    };

    Notifications.prototype.toHtmlSafe = function(values) {
      var i, j, len, value;
      if (!(values instanceof Array)) {
        values = [values];
      }
      for (i = j = 0, len = values.length; j < len; i = ++j) {
        value = values[i];
        value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        value = value.replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>");
        values[i] = value;
      }
      return values;
    };

    return Notifications;

  })();

  Notification = (function() {
    function Notification(main, message) {
      var elem, j, len, ref, width;
      this.main = main;
      this.main_elem = this.main.elem;
      this.id = message.id.replace(/[^A-Za-z0-9]/g, "");
      ref = $(".notification-" + this.id);
      for (j = 0, len = ref.length; j < len; j++) {
        elem = ref[j];
        this.close($(elem));
      }
      this.elem = $(".notification.notificationTemplate", this.main_elem).clone().removeClass("notificationTemplate");
      this.elem.addClass("notification-" + type).addClass("notification-" + id);
      if (type === "progress") {
        this.elem.addClass("notification-done");
      }
      updateText(type);
      if (typeof body === "string") {
        $(".body", elem).html("<span class='message'>" + escape(message.body) + "</span>");
      } else {
        $(".body", elem).html("").append(body);
      }
      elem.appendTo(this.elem);
      if (timeout) {
        $(".close", elem).remove();
        setTimeout(((function(_this) {
          return function() {
            return _this.close(elem);
          };
        })(this)), timeout);
      }
      width = elem.outerWidth();
      if (!timeout) {
        width += 20;
      }
      if (elem.outerHeight() > 55) {
        elem.addClass("long");
      }
      elem.css({
        "width": "50px",
        "transform": "scale(0.01)"
      });
      elem.animate({
        "scale": 1
      }, 800, "easeOutElastic");
      elem.animate({
        "width": width
      }, 700, "easeInOutCubic");
      $(".body", elem).cssLater("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)", 1000);
      $(".close, .button", elem).on("click", (function(_this) {
        return function() {
          _this.close(elem);
          return false;
        };
      })(this));
      $(".select", elem).on("click", (function(_this) {
        return function() {
          return _this.close(elem);
        };
      })(this));
      this.elem = elem;
      this;
    }

    return Notification;

  })();

  ({
    escape: function(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>");
    },
    updateText: function(type) {
      if (type === "error") {
        return $(".notification-icon", this.elem).html("!");
      } else if (type === "done") {
        return $(".notification-icon", this.elem).html("<div class='icon-success'></div>");
      } else if (type === "progress") {
        return $(".notification-icon", this.elem).html("<div class='icon-success'></div>");
      } else if (type === "ask") {
        return $(".notification-icon", this.elem).html("?");
      } else {
        throw new Error("UnknownNotificationType: Type " + type + "is not known");
      }
    },
    close: function() {}
  });

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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk5vdGlmaWNhdGlvbnMuY29mZmVlIiwianF1ZXJ5LmNzc2FuaW0uY29mZmVlIiwianF1ZXJ5LmNzc2xhdGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkJBQUE7SUFBQTs7O0VBQU07SUFDUSx1QkFBQyxLQUFEO01BQUMsSUFBQyxDQUFBLE9BQUQ7TUFDYjtJQURZOzs0QkFJYixJQUFBLEdBQU0sU0FBQTtNQUNMLFVBQUEsQ0FBVyxDQUFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNYLEtBQUMsQ0FBQSxHQUFELENBQUssWUFBTCxFQUFtQixPQUFuQixFQUE0Qix5REFBNUI7aUJBQ0EsS0FBQyxDQUFBLEdBQUQsQ0FBSyxnQkFBTCxFQUF1QixNQUF2QixFQUErQiwwQkFBL0I7UUFGVztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBRCxDQUFYLEVBR0csSUFISDthQUlBLFVBQUEsQ0FBVyxDQUFDLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDWCxLQUFDLENBQUEsR0FBRCxDQUFLLFlBQUwsRUFBbUIsTUFBbkIsRUFBMkIsdUNBQTNCLEVBQW9FLElBQXBFO1FBRFc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQUQsQ0FBWCxFQUVHLElBRkg7SUFMSzs7NEJBVU4sR0FBQSxHQUFLLFNBQUMsRUFBRCxFQUFLLElBQUwsRUFBVyxJQUFYLEVBQWlCLE9BQWpCO0FBQ0osVUFBQTs7UUFEcUIsVUFBUTs7TUFDN0IsRUFBQSxHQUFLLEVBQUUsQ0FBQyxPQUFILENBQVcsZUFBWCxFQUE0QixFQUE1QjtBQUVMO0FBQUEsV0FBQSxxQ0FBQTs7UUFDQyxJQUFDLENBQUEsS0FBRCxDQUFPLENBQUEsQ0FBRSxJQUFGLENBQVA7QUFERDtNQUlBLElBQUEsR0FBTyxDQUFBLENBQUUsb0NBQUYsRUFBd0MsSUFBQyxDQUFBLElBQXpDLENBQThDLENBQUMsS0FBL0MsQ0FBQSxDQUFzRCxDQUFDLFdBQXZELENBQW1F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SUFGSDtBQUdBLFdBQU87RUFMa0I7O0VBTzFCLE1BQU0sQ0FBQyxFQUFFLENBQUMsUUFBVixHQUFxQixTQUFDLElBQUQsRUFBTyxHQUFQLEVBQVksSUFBWjtBQUNwQixRQUFBOztNQURnQyxPQUFPOztJQUN2QyxJQUFBLEdBQU87SUFDUCxVQUFBLENBQVcsQ0FBRSxTQUFBO2FBQ1osSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFULEVBQWUsR0FBZjtJQURZLENBQUYsQ0FBWCxFQUVHLElBRkg7QUFHQSxXQUFPO0VBTGE7QUE5QnJCIiwiZmlsZSI6Inplcm9uZXQtbm90aWZpY2F0aW9ucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIE5vdGlmaWNhdGlvbnNcblx0Y29uc3RydWN0b3I6IChAZWxlbSkgLT5cblx0XHRAXG5cblx0IyBUT0RPOiBhZGQgdW5pdCB0ZXN0c1xuXHR0ZXN0OiAtPlxuXHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRAYWRkKFwiY29ubmVjdGlvblwiLCBcImVycm9yXCIsIFwiQ29ubmVjdGlvbiBsb3N0IHRvIDxiPlVpU2VydmVyPC9iPiBvbiA8Yj5sb2NhbGhvc3Q8L2I+IVwiKVxuXHRcdFx0QGFkZChcIm1lc3NhZ2UtQW55b25lXCIsIFwiaW5mb1wiLCBcIk5ldyAgZnJvbSA8Yj5BbnlvbmU8L2I+LlwiKVxuXHRcdCksIDEwMDBcblx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0QGFkZChcImNvbm5lY3Rpb25cIiwgXCJkb25lXCIsIFwiPGI+VWlTZXJ2ZXI8L2I+IGNvbm5lY3Rpb24gcmVjb3ZlcmVkLlwiLCA1MDAwKVxuXHRcdCksIDMwMDBcblxuXG5cdGFkZDogKGlkLCB0eXBlLCBib2R5LCB0aW1lb3V0PTApIC0+XG5cdFx0aWQgPSBpZC5yZXBsYWNlIC9bXkEtWmEtejAtOV0vZywgXCJcIlxuXHRcdCMgQ2xvc2Ugbm90aWZpY2F0aW9ucyB3aXRoIHNhbWUgaWRcblx0XHRmb3IgZWxlbSBpbiAkKFwiLm5vdGlmaWNhdGlvbi0je2lkfVwiKVxuXHRcdFx0QGNsb3NlICQoZWxlbSlcblxuXHRcdCMgQ3JlYXRlIGVsZW1lbnRcblx0XHRlbGVtID0gJChcIi5ub3RpZmljYXRpb24ubm90aWZpY2F0aW9uVGVtcGxhdGVcIiwgQGVsZW0pLmNsb25lKCkucmVtb3ZlQ2xhc3MoXCJub3RpZmljYXRpb25UZW1wbGF0ZVwiKVxuXHRcdGVsZW0uYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tI3t0eXBlfVwiKS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi0je2lkfVwiKVxuXHRcdGlmIHR5cGUgPT0gXCJwcm9ncmVzc1wiXG5cdFx0XHRlbGVtLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIilcblxuXHRcdCMgVXBkYXRlIHRleHRcblx0XHRpZiB0eXBlID09IFwiZXJyb3JcIlxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBlbGVtKS5odG1sKFwiIVwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcImRvbmVcIlxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBlbGVtKS5odG1sKFwiPGRpdiBjbGFzcz0naWNvbi1zdWNjZXNzJz48L2Rpdj5cIilcblx0XHRlbHNlIGlmIHR5cGUgPT0gXCJwcm9ncmVzc1wiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIGVsZW0pLmh0bWwoXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcImFza1wiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIGVsZW0pLmh0bWwoXCI/XCIpXG5cdFx0ZWxzZVxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBlbGVtKS5odG1sKFwiaVwiKVxuXG5cdFx0aWYgdHlwZW9mKGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdCQoXCIuYm9keVwiLCBlbGVtKS5odG1sKFwiPHNwYW4gY2xhc3M9J21lc3NhZ2UnPlwiK2JvZHkrXCI8L3NwYW4+XCIpXG5cdFx0ZWxzZVxuXHRcdFx0JChcIi5ib2R5XCIsIGVsZW0pLmh0bWwoXCJcIikuYXBwZW5kKGJvZHkpXG5cblx0XHRlbGVtLmFwcGVuZFRvKEBlbGVtKVxuXG5cdFx0IyBUaW1lb3V0XG5cdFx0aWYgdGltZW91dFxuXHRcdFx0JChcIi5jbG9zZVwiLCBlbGVtKS5yZW1vdmUoKSAjIE5vIG5lZWQgb2YgY2xvc2UgYnV0dG9uXG5cdFx0XHRzZXRUaW1lb3V0ICg9PlxuXHRcdFx0XHRAY2xvc2UgZWxlbVxuXHRcdFx0KSwgdGltZW91dFxuXG5cdFx0IyBBbmltYXRlXG5cdFx0d2lkdGggPSBlbGVtLm91dGVyV2lkdGgoKVxuXHRcdGlmIG5vdCB0aW1lb3V0IHRoZW4gd2lkdGggKz0gMjAgIyBBZGQgc3BhY2UgZm9yIGNsb3NlIGJ1dHRvblxuXHRcdGlmIGVsZW0ub3V0ZXJIZWlnaHQoKSA+IDU1IHRoZW4gZWxlbS5hZGRDbGFzcyhcImxvbmdcIilcblx0XHRlbGVtLmNzcyh7XCJ3aWR0aFwiOiBcIjUwcHhcIiwgXCJ0cmFuc2Zvcm1cIjogXCJzY2FsZSgwLjAxKVwifSlcblx0XHRlbGVtLmFuaW1hdGUoe1wic2NhbGVcIjogMX0sIDgwMCwgXCJlYXNlT3V0RWxhc3RpY1wiKVxuXHRcdGVsZW0uYW5pbWF0ZSh7XCJ3aWR0aFwiOiB3aWR0aH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiKVxuXHRcdCQoXCIuYm9keVwiLCBlbGVtKS5jc3NMYXRlcihcImJveC1zaGFkb3dcIiwgXCIwcHggMHB4IDVweCByZ2JhKDAsMCwwLDAuMSlcIiwgMTAwMClcblxuXHRcdCMgQ2xvc2UgYnV0dG9uIG9yIENvbmZpcm0gYnV0dG9uXG5cdFx0JChcIi5jbG9zZSwgLmJ1dHRvblwiLCBlbGVtKS5vbiBcImNsaWNrXCIsID0+XG5cdFx0XHRAY2xvc2UgZWxlbVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHQjIFNlbGVjdCBsaXN0XG5cdFx0JChcIi5zZWxlY3RcIiwgZWxlbSkub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0QGNsb3NlIGVsZW1cblxuXHRcdHJldHVybiBlbGVtXG5cblxuXHRjbG9zZTogKGVsZW0pIC0+XG5cdFx0ZWxlbS5zdG9wKCkuYW5pbWF0ZSB7XCJ3aWR0aFwiOiAwLCBcIm9wYWNpdHlcIjogMH0sIDcwMCwgXCJlYXNlSW5PdXRDdWJpY1wiXG5cdFx0ZWxlbS5zbGlkZVVwIDMwMCwgKC0+IGVsZW0ucmVtb3ZlKCkpXG5cblxuXHRsb2c6IChhcmdzLi4uKSAtPlxuXHRcdGNvbnNvbGUubG9nIFwiW05vdGlmaWNhdGlvbnNdXCIsIGFyZ3MuLi5cblxuXHRkaXNwbGF5T3BlbmVyRGlhbG9nOiAtPlxuXHRcdGVsZW0gPSAkKFwiPGRpdiBjbGFzcz0nb3BlbmVyLW92ZXJsYXknPjxkaXYgY2xhc3M9J2RpYWxvZyc+WW91IGhhdmUgb3BlbmVkIHRoaXMgcGFnZSBieSBjbGlja2luZyBvbiBhIGxpbmsuIFBsZWFzZSwgY29uZmlybSBpZiB5b3Ugd2FudCB0byBsb2FkIHRoaXMgc2l0ZS48YSBocmVmPSc/JyB0YXJnZXQ9J19ibGFuaycgY2xhc3M9J2J1dHRvbic+T3BlbiBzaXRlPC9hPjwvZGl2PjwvZGl2PlwiKVxuXHRcdGVsZW0uZmluZCgnYScpLm9uIFwiY2xpY2tcIiwgLT5cblx0XHRcdHdpbmRvdy5vcGVuKFwiP1wiLCBcIl9ibGFua1wiKVxuXHRcdFx0d2luZG93LmNsb3NlKClcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdCQoXCJib2R5XCIpLnByZXBlbmQoZWxlbSlcblxuXHQjIC0gQWN0aW9ucyAtXG5cblx0YWN0aW9uT3BlbldpbmRvdzogKHBhcmFtcykgLT5cblx0XHRpZiB0eXBlb2YocGFyYW1zKSA9PSBcInN0cmluZ1wiXG5cdFx0XHR3ID0gd2luZG93Lm9wZW4oKVxuXHRcdFx0dy5vcGVuZXIgPSBudWxsXG5cdFx0XHR3LmxvY2F0aW9uID0gcGFyYW1zXG5cdFx0ZWxzZVxuXHRcdFx0dyA9IHdpbmRvdy5vcGVuKG51bGwsIHBhcmFtc1sxXSwgcGFyYW1zWzJdKVxuXHRcdFx0dy5vcGVuZXIgPSBudWxsXG5cdFx0XHR3LmxvY2F0aW9uID0gcGFyYW1zWzBdXG5cblx0YWN0aW9uUmVxdWVzdEZ1bGxzY3JlZW46IC0+XG5cdFx0aWYgXCJGdWxsc2NyZWVuXCIgaW4gQHNpdGVfaW5mby5zZXR0aW5ncy5wZXJtaXNzaW9uc1xuXHRcdFx0ZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaW5uZXItaWZyYW1lXCIpXG5cdFx0XHRyZXF1ZXN0X2Z1bGxzY3JlZW4gPSBlbGVtLnJlcXVlc3RGdWxsU2NyZWVuIHx8IGVsZW0ud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4gfHwgZWxlbS5tb3pSZXF1ZXN0RnVsbFNjcmVlbiB8fCBlbGVtLm1zUmVxdWVzdEZ1bGxTY3JlZW5cblx0XHRcdHJlcXVlc3RfZnVsbHNjcmVlbi5jYWxsKGVsZW0pXG5cdFx0XHRzZXRUaW1lb3V0ICggPT5cblx0XHRcdFx0aWYgd2luZG93LmlubmVySGVpZ2h0ICE9IHNjcmVlbi5oZWlnaHQgICMgRnVsbHNjcmVlbiBmYWlsZWQsIHByb2JhYmx5IG9ubHkgYWxsb3dlZCBvbiBjbGlja1xuXHRcdFx0XHRcdEBkaXNwbGF5Q29uZmlybSBcIlRoaXMgc2l0ZSByZXF1ZXN0cyBwZXJtaXNzaW9uOlwiICsgXCIgPGI+RnVsbHNjcmVlbjwvYj5cIiwgXCJHcmFudFwiLCA9PlxuXHRcdFx0XHRcdFx0cmVxdWVzdF9mdWxsc2NyZWVuLmNhbGwoZWxlbSlcblx0XHRcdCksIDEwMFxuXHRcdGVsc2Vcblx0XHRcdEBkaXNwbGF5Q29uZmlybSBcIlRoaXMgc2l0ZSByZXF1ZXN0cyBwZXJtaXNzaW9uOlwiICsgXCIgPGI+RnVsbHNjcmVlbjwvYj5cIiwgXCJHcmFudFwiLCA9PlxuXHRcdFx0XHRAc2l0ZV9pbmZvLnNldHRpbmdzLnBlcm1pc3Npb25zLnB1c2goXCJGdWxsc2NyZWVuXCIpXG5cdFx0XHRcdEBhY3Rpb25SZXF1ZXN0RnVsbHNjcmVlbigpXG5cdFx0XHRcdEB3cy5jbWQgXCJwZXJtaXNzaW9uQWRkXCIsIFwiRnVsbHNjcmVlblwiXG5cblx0YWN0aW9uUGVybWlzc2lvbkFkZDogKG1lc3NhZ2UpIC0+XG5cdFx0cGVybWlzc2lvbiA9IG1lc3NhZ2UucGFyYW1zXG5cdFx0QGRpc3BsYXlDb25maXJtIFwiVGhpcyBzaXRlIHJlcXVlc3RzIHBlcm1pc3Npb246XCIgKyBcIiA8Yj4je0B0b0h0bWxTYWZlKHBlcm1pc3Npb24pfTwvYj5cIiwgXCJHcmFudFwiLCA9PlxuXHRcdFx0QHdzLmNtZCBcInBlcm1pc3Npb25BZGRcIiwgcGVybWlzc2lvbiwgPT5cblx0XHRcdFx0QHNlbmRJbm5lciB7XCJjbWRcIjogXCJyZXNwb25zZVwiLCBcInRvXCI6IG1lc3NhZ2UuaWQsIFwicmVzdWx0XCI6IFwiR3JhbnRlZFwifVxuXG5cdGFjdGlvbk5vdGlmaWNhdGlvbjogKG1lc3NhZ2UpIC0+XG5cdFx0bWVzc2FnZS5wYXJhbXMgPSBAdG9IdG1sU2FmZShtZXNzYWdlLnBhcmFtcykgIyBFc2NhcGUgaHRtbFxuXHRcdGJvZHkgPSAgJChcIjxzcGFuIGNsYXNzPSdtZXNzYWdlJz5cIittZXNzYWdlLnBhcmFtc1sxXStcIjwvc3Bhbj5cIilcblx0XHRAYWRkKFwibm90aWZpY2F0aW9uLSN7bWVzc2FnZS5pZH1cIiwgbWVzc2FnZS5wYXJhbXNbMF0sIGJvZHksIG1lc3NhZ2UucGFyYW1zWzJdKVxuXG5cdGRpc3BsYXlDb25maXJtOiAobWVzc2FnZSwgY2FwdGlvbiwgY2FuY2VsPWZhbHNlLCBjYikgLT5cblx0XHRib2R5ID0gJChcIjxzcGFuIGNsYXNzPSdtZXNzYWdlJz5cIittZXNzYWdlK1wiPC9zcGFuPlwiKVxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0Y2IodHJ1ZSlcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblx0XHRpZiAoY2FuY2VsKVxuXHRcdFx0Y0J1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYW5jZWx9JyBjbGFzcz0nYnV0dG9uIGJ1dHRvbi0je2NhbmNlbH0nPiN7Y2FuY2VsfTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRcdGNCdXR0b24ub24gXCJjbGlja1wiLCA9PlxuXHRcdFx0XHRjYihmYWxzZSlcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHRib2R5LmFwcGVuZChjQnV0dG9uKVxuXHRcdEBhZGQoXCJub3RpZmljYXRpb24tI3tjYXB0aW9ufVwiLCBcImFza1wiLCBib2R5KVxuXG5cdFx0YnV0dG9uLmZvY3VzKClcblx0XHQkKFwiLm5vdGlmaWNhdGlvblwiKS5zY3JvbGxMZWZ0KDApXG5cblxuXHRhY3Rpb25Db25maXJtOiAobWVzc2FnZSwgY2I9ZmFsc2UpIC0+XG5cdFx0bWVzc2FnZS5wYXJhbXMgPSBAdG9IdG1sU2FmZShtZXNzYWdlLnBhcmFtcykgIyBFc2NhcGUgaHRtbFxuXHRcdGlmIG1lc3NhZ2UucGFyYW1zWzFdIHRoZW4gY2FwdGlvbiA9IG1lc3NhZ2UucGFyYW1zWzFdIGVsc2UgY2FwdGlvbiA9IFwib2tcIlxuXHRcdEBkaXNwbGF5Q29uZmlybSBtZXNzYWdlLnBhcmFtc1swXSwgY2FwdGlvbiwgPT5cblx0XHRcdEBzZW5kSW5uZXIge1wiY21kXCI6IFwicmVzcG9uc2VcIiwgXCJ0b1wiOiBtZXNzYWdlLmlkLCBcInJlc3VsdFwiOiBcImJvb21cIn0gIyBSZXNwb25zZSB0byBjb25maXJtXG5cdFx0XHRyZXR1cm4gZmFsc2VcblxuXG5cdGRpc3BsYXlQcm9tcHQ6IChtZXNzYWdlLCB0eXBlLCBjYXB0aW9uLCBjYikgLT5cblx0XHRib2R5ID0gJChcIjxzcGFuIGNsYXNzPSdtZXNzYWdlJz5cIittZXNzYWdlK1wiPC9zcGFuPlwiKVxuXG5cdFx0aW5wdXQgPSAkKFwiPGlucHV0IHR5cGU9JyN7dHlwZX0nIGNsYXNzPSdpbnB1dCBidXR0b24tI3t0eXBlfScvPlwiKSAjIEFkZCBpbnB1dFxuXHRcdGlucHV0Lm9uIFwia2V5dXBcIiwgKGUpID0+ICMgU2VuZCBvbiBlbnRlclxuXHRcdFx0aWYgZS5rZXlDb2RlID09IDEzXG5cdFx0XHRcdGJ1dHRvbi50cmlnZ2VyIFwiY2xpY2tcIiAjIFJlc3BvbnNlIHRvIGNvbmZpcm1cblx0XHRib2R5LmFwcGVuZChpbnB1dClcblxuXHRcdGJ1dHRvbiA9ICQoXCI8YSBocmVmPScjI3tjYXB0aW9ufScgY2xhc3M9J2J1dHRvbiBidXR0b24tI3tjYXB0aW9ufSc+I3tjYXB0aW9ufTwvYT5cIikgIyBBZGQgY29uZmlybSBidXR0b25cblx0XHRidXR0b24ub24gXCJjbGlja1wiLCA9PiAjIFJlc3BvbnNlIG9uIGJ1dHRvbiBjbGlja1xuXHRcdFx0Y2IgaW5wdXQudmFsKClcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGJvZHkuYXBwZW5kKGJ1dHRvbilcblxuXHRcdEBhZGQoXCJub3RpZmljYXRpb24tI3ttZXNzYWdlLmlkfVwiLCBcImFza1wiLCBib2R5KVxuXG5cdFx0aW5wdXQuZm9jdXMoKVxuXHRcdCQoXCIubm90aWZpY2F0aW9uXCIpLnNjcm9sbExlZnQoMClcblxuXG5cdGFjdGlvblByb21wdDogKG1lc3NhZ2UpIC0+XG5cdFx0bWVzc2FnZS5wYXJhbXMgPSBAdG9IdG1sU2FmZShtZXNzYWdlLnBhcmFtcykgIyBFc2NhcGUgaHRtbFxuXHRcdGlmIG1lc3NhZ2UucGFyYW1zWzFdIHRoZW4gdHlwZSA9IG1lc3NhZ2UucGFyYW1zWzFdIGVsc2UgdHlwZSA9IFwidGV4dFwiXG5cdFx0Y2FwdGlvbiA9IFwiT0tcIlxuXG5cdFx0QGRpc3BsYXlQcm9tcHQgbWVzc2FnZS5wYXJhbXNbMF0sIHR5cGUsIGNhcHRpb24sIChyZXMpID0+XG5cdFx0XHRAc2VuZElubmVyIHtcImNtZFwiOiBcInJlc3BvbnNlXCIsIFwidG9cIjogbWVzc2FnZS5pZCwgXCJyZXN1bHRcIjogcmVzfSAjIFJlc3BvbnNlIHRvIGNvbmZpcm1cblxuXHRhY3Rpb25Qcm9ncmVzczogKG1lc3NhZ2UpIC0+XG5cdFx0I21lc3NhZ2UucGFyYW1zID0gQHRvSHRtbFNhZmUobWVzc2FnZS5wYXJhbXMpICMgRXNjYXBlIGh0bWxcblx0XHRwZXJjZW50ID0gTWF0aC5taW4oMTAwLCBtZXNzYWdlLnBlcmNlbnQpLzEwMFxuXHRcdG9mZnNldCA9IDc1LShwZXJjZW50Kjc1KVxuXHRcdGNpcmNsZSA9IFwiXCJcIlxuXHRcdFx0PGRpdiBjbGFzcz1cImNpcmNsZVwiPjxzdmcgY2xhc3M9XCJjaXJjbGUtc3ZnXCIgd2lkdGg9XCIzMFwiIGhlaWdodD1cIjMwXCIgdmlld3BvcnQ9XCIwIDAgMzAgMzBcIiB2ZXJzaW9uPVwiMS4xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1iZ1wiPjwvY2lyY2xlPlxuICBcdFx0XHRcdDxjaXJjbGUgcj1cIjEyXCIgY3g9XCIxNVwiIGN5PVwiMTVcIiBmaWxsPVwidHJhbnNwYXJlbnRcIiBjbGFzcz1cImNpcmNsZS1mZ1wiIHN0eWxlPVwic3Ryb2tlLWRhc2hvZmZzZXQ6ICN7b2Zmc2V0fVwiPjwvY2lyY2xlPlxuXHRcdFx0PC9zdmc+PC9kaXY+XG5cdFx0XCJcIlwiXG5cdFx0Ym9keSA9IFwiPHNwYW4gY2xhc3M9J21lc3NhZ2UnPlwiK21lc3NhZ2UuY29udGVudCtcIjwvc3Bhbj5cIiArIGNpcmNsZVxuXHRcdGVsZW0gPSAkKFwiLm5vdGlmaWNhdGlvbi0je21lc3NhZ2UuaWR9XCIpXG5cdFx0aWYgZWxlbS5sZW5ndGhcblx0XHRcdHdpZHRoID0gJChcIi5ib2R5IC5tZXNzYWdlXCIsIGVsZW0pLm91dGVyV2lkdGgoKVxuXHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIGVsZW0pLmh0bWwobWVzc2FnZS5jb250ZW50KVxuXHRcdFx0aWYgJChcIi5ib2R5IC5tZXNzYWdlXCIsIGVsZW0pLmNzcyhcIndpZHRoXCIpID09IFwiXCJcblx0XHRcdFx0JChcIi5ib2R5IC5tZXNzYWdlXCIsIGVsZW0pLmNzcyhcIndpZHRoXCIsIHdpZHRoKVxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtZmdcIiwgZWxlbSkuY3NzKFwic3Ryb2tlLWRhc2hvZmZzZXRcIiwgb2Zmc2V0KVxuXHRcdGVsc2Vcblx0XHRcdGVsZW0gPSBAYWRkKG1lc3NhZ2UuaWQsIFwicHJvZ3Jlc3NcIiwgJChib2R5KSlcblx0XHRpZiBwZXJjZW50ID4gMFxuXHRcdFx0JChcIi5ib2R5IC5jaXJjbGUtYmdcIiwgZWxlbSkuY3NzIHtcImFuaW1hdGlvbi1wbGF5LXN0YXRlXCI6IFwicGF1c2VkXCIsIFwic3Ryb2tlLWRhc2hhcnJheVwiOiBcIjE4MHB4XCJ9XG5cblx0XHRpZiAkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIGVsZW0pLmRhdGEoXCJkb25lXCIpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRlbHNlIGlmIG1lc3NhZ2UucGVyY2VudCA+PSAxMDAgICMgRG9uZVxuXHRcdFx0JChcIi5jaXJjbGUtZmdcIiwgZWxlbSkuY3NzKFwidHJhbnNpdGlvblwiLCBcImFsbCAwLjNzIGVhc2UtaW4tb3V0XCIpXG5cdFx0XHRzZXRUaW1lb3V0ICgtPlxuXHRcdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIGVsZW0pLmNzcyB7dHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsIG9wYWNpdHk6IDF9XG5cdFx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb24gLmljb24tc3VjY2Vzc1wiLCBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJyb3RhdGUoNDVkZWcpIHNjYWxlKDEpXCJ9XG5cdFx0XHQpLCAzMDBcblx0XHRcdGlmIChtZXNzYWdlLmF1dG9DbG9zZSlcblx0XHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0XHRAY2xvc2UgZWxlbVxuXHRcdFx0XHQpLCAzMDAwXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIGVsZW0pLmRhdGEoXCJkb25lXCIsIHRydWUpXG5cdFx0ZWxzZSBpZiBtZXNzYWdlLnBlcmNlbnQgPCAwICAjIEVycm9yXG5cdFx0XHQkKFwiLmJvZHkgLmNpcmNsZS1mZ1wiLCBlbGVtKS5jc3MoXCJzdHJva2VcIiwgXCIjZWM2ZjQ3XCIpLmNzcyhcInRyYW5zaXRpb25cIiwgXCJ0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlLWluLW91dFwiKVxuXHRcdFx0c2V0VGltZW91dCAoPT5cblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBlbGVtKS5jc3Mge3RyYW5zZm9ybTogXCJzY2FsZSgxKVwiLCBvcGFjaXR5OiAxfVxuXHRcdFx0XHRlbGVtLnJlbW92ZUNsYXNzKFwibm90aWZpY2F0aW9uLWRvbmVcIikuYWRkQ2xhc3MoXCJub3RpZmljYXRpb24tZXJyb3JcIilcblx0XHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvbiAuaWNvbi1zdWNjZXNzXCIsIGVsZW0pLnJlbW92ZUNsYXNzKFwiaWNvbi1zdWNjZXNzXCIpLmh0bWwoXCIhXCIpXG5cdFx0XHQpLCAzMDBcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgZWxlbSkuZGF0YShcImRvbmVcIiwgdHJ1ZSlcblxuXHR0b0h0bWxTYWZlOiAodmFsdWVzKSAtPlxuXHRcdGlmIHZhbHVlcyBub3QgaW5zdGFuY2VvZiBBcnJheSB0aGVuIHZhbHVlcyA9IFt2YWx1ZXNdICMgQ29udmVydCB0byBhcnJheSBpZiBpdHMgbm90XG5cdFx0Zm9yIHZhbHVlLCBpIGluIHZhbHVlc1xuXHRcdFx0dmFsdWUgPSBTdHJpbmcodmFsdWUpLnJlcGxhY2UoLyYvZywgJyZhbXA7JykucmVwbGFjZSgvPC9nLCAnJmx0OycpLnJlcGxhY2UoLz4vZywgJyZndDsnKS5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JykgIyBFc2NhcGVcblx0XHRcdHZhbHVlID0gdmFsdWUucmVwbGFjZSgvJmx0OyhbXFwvXXswLDF9KGJyfGJ8dXxpKSkmZ3Q7L2csIFwiPCQxPlwiKSAjIFVuZXNjYXBlIGIsIGksIHUsIGJyIHRhZ3Ncblx0XHRcdHZhbHVlc1tpXSA9IHZhbHVlXG5cdFx0cmV0dXJuIHZhbHVlc1xuXG5jbGFzcyBOb3RpZmljYXRpb25cblx0XHRjb25zdHJ1Y3RvcjogKEBtYWluLG1lc3NhZ2UpIC0+ICMoQGlkLCBAdHlwZSwgQGJvZHksIEB0aW1lb3V0PTApIC0+XG5cdFx0XHRAbWFpbl9lbGVtPUBtYWluLmVsZW1cblx0XHRcdEBpZCA9IG1lc3NhZ2UuaWQucmVwbGFjZSAvW15BLVphLXowLTldL2csIFwiXCJcblx0XHRcdCMgQ2xvc2Ugbm90aWZpY2F0aW9ucyB3aXRoIHNhbWUgaWRcblx0XHRcdGZvciBlbGVtIGluICQoXCIubm90aWZpY2F0aW9uLSN7QGlkfVwiKVxuXHRcdFx0XHRAY2xvc2UgJChlbGVtKSAjIFRPRE86IGZpeCB0aGlzIHRvIHVzZSBOb3RpZmljYXRpb25zLmdldChpZCkgYW5kIHRocm93XG5cblx0XHRcdCMgQ3JlYXRlIGVsZW1lbnRcblx0XHRcdEBlbGVtID0gJChcIi5ub3RpZmljYXRpb24ubm90aWZpY2F0aW9uVGVtcGxhdGVcIiwgQG1haW5fZWxlbSkuY2xvbmUoKS5yZW1vdmVDbGFzcyhcIm5vdGlmaWNhdGlvblRlbXBsYXRlXCIpICMgVE9ETzogZ2V0IGVsZW0gZnJvbSBub3RpZmljYXRpb25zXG5cdFx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi0je3R5cGV9XCIpLmFkZENsYXNzKFwibm90aWZpY2F0aW9uLSN7aWR9XCIpXG5cdFx0XHRpZiB0eXBlID09IFwicHJvZ3Jlc3NcIlxuXHRcdFx0XHRAZWxlbS5hZGRDbGFzcyhcIm5vdGlmaWNhdGlvbi1kb25lXCIpXG5cblx0XHRcdCMgVXBkYXRlIHRleHRcblx0XHRcdHVwZGF0ZVRleHQodHlwZSlcblx0XHRcdFx0IyQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgZWxlbSkuaHRtbChcImlcIilcblxuXHRcdFx0aWYgdHlwZW9mKGJvZHkpID09IFwic3RyaW5nXCJcblx0XHRcdFx0JChcIi5ib2R5XCIsIGVsZW0pLmh0bWwoXCI8c3BhbiBjbGFzcz0nbWVzc2FnZSc+XCIrZXNjYXBlKG1lc3NhZ2UuYm9keSkrXCI8L3NwYW4+XCIpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdCQoXCIuYm9keVwiLCBlbGVtKS5odG1sKFwiXCIpLmFwcGVuZChib2R5KVxuXG5cdFx0XHRlbGVtLmFwcGVuZFRvKEBlbGVtKVxuXG5cdFx0XHQjIFRpbWVvdXRcblx0XHRcdGlmIHRpbWVvdXRcblx0XHRcdFx0JChcIi5jbG9zZVwiLCBlbGVtKS5yZW1vdmUoKSAjIE5vIG5lZWQgb2YgY2xvc2UgYnV0dG9uXG5cdFx0XHRcdHNldFRpbWVvdXQgKD0+XG5cdFx0XHRcdFx0QGNsb3NlIGVsZW1cblx0XHRcdFx0KSwgdGltZW91dFxuXG5cdFx0XHQjIEFuaW1hdGVcblx0XHRcdHdpZHRoID0gZWxlbS5vdXRlcldpZHRoKClcblx0XHRcdGlmIG5vdCB0aW1lb3V0IHRoZW4gd2lkdGggKz0gMjAgIyBBZGQgc3BhY2UgZm9yIGNsb3NlIGJ1dHRvblxuXHRcdFx0aWYgZWxlbS5vdXRlckhlaWdodCgpID4gNTUgdGhlbiBlbGVtLmFkZENsYXNzKFwibG9uZ1wiKVxuXHRcdFx0ZWxlbS5jc3Moe1wid2lkdGhcIjogXCI1MHB4XCIsIFwidHJhbnNmb3JtXCI6IFwic2NhbGUoMC4wMSlcIn0pXG5cdFx0XHRlbGVtLmFuaW1hdGUoe1wic2NhbGVcIjogMX0sIDgwMCwgXCJlYXNlT3V0RWxhc3RpY1wiKVxuXHRcdFx0ZWxlbS5hbmltYXRlKHtcIndpZHRoXCI6IHdpZHRofSwgNzAwLCBcImVhc2VJbk91dEN1YmljXCIpXG5cdFx0XHQkKFwiLmJvZHlcIiwgZWxlbSkuY3NzTGF0ZXIoXCJib3gtc2hhZG93XCIsIFwiMHB4IDBweCA1cHggcmdiYSgwLDAsMCwwLjEpXCIsIDEwMDApXG5cblx0XHRcdCMgQ2xvc2UgYnV0dG9uIG9yIENvbmZpcm0gYnV0dG9uXG5cdFx0XHQkKFwiLmNsb3NlLCAuYnV0dG9uXCIsIGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdFx0QGNsb3NlIGVsZW1cblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHRcdCMgU2VsZWN0IGxpc3Rcblx0XHRcdCQoXCIuc2VsZWN0XCIsIGVsZW0pLm9uIFwiY2xpY2tcIiwgPT5cblx0XHRcdFx0QGNsb3NlIGVsZW1cblxuXHRcdFx0QGVsZW09ZWxlbVxuXHRcdFx0QFxuXG5cdGVzY2FwZTogKHZhbHVlKSAtPlxuIFx0XHRyZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7JykucmVwbGFjZSgvXCIvZywgJyZxdW90OycpLnJlcGxhY2UoLyZsdDsoW1xcL117MCwxfShicnxifHV8aSkpJmd0Oy9nLCBcIjwkMT5cIikgIyBFc2NhcGUgYW5kIFVuZXNjYXBlIGIsIGksIHUsIGJyIHRhZ3NcblxuXHR1cGRhdGVUZXh0OiAodHlwZSkgLT5cblx0XHRpZiB0eXBlID09IFwiZXJyb3JcIlxuXHRcdFx0JChcIi5ub3RpZmljYXRpb24taWNvblwiLCBAZWxlbSkuaHRtbChcIiFcIilcblx0XHRlbHNlIGlmIHR5cGUgPT0gXCJkb25lXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcInByb2dyZXNzXCJcblx0XHRcdCQoXCIubm90aWZpY2F0aW9uLWljb25cIiwgQGVsZW0pLmh0bWwoXCI8ZGl2IGNsYXNzPSdpY29uLXN1Y2Nlc3MnPjwvZGl2PlwiKVxuXHRcdGVsc2UgaWYgdHlwZSA9PSBcImFza1wiXG5cdFx0XHQkKFwiLm5vdGlmaWNhdGlvbi1pY29uXCIsIEBlbGVtKS5odG1sKFwiP1wiKVxuXHRcdGVsc2Vcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlVua25vd25Ob3RpZmljYXRpb25UeXBlOiBUeXBlIFwiK3R5cGUrXCJpcyBub3Qga25vd25cIilcblxuXHRjbG9zZTogKCkgLT5cblxuXG5cbndpbmRvdy5Ob3RpZmljYXRpb25zID0gTm90aWZpY2F0aW9uc1xuIiwialF1ZXJ5LmNzc0hvb2tzLnNjYWxlID0ge1xuXHRnZXQ6IChlbGVtLCBjb21wdXRlZCkgLT5cblx0XHRtYXRjaCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pW3RyYW5zZm9ybV9wcm9wZXJ0eV0ubWF0Y2goXCJbMC05XFwuXStcIilcblx0XHRpZiBtYXRjaFxuXHRcdFx0c2NhbGUgPSBwYXJzZUZsb2F0KG1hdGNoWzBdKVxuXHRcdFx0cmV0dXJuIHNjYWxlXG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIDEuMFxuXHRzZXQ6IChlbGVtLCB2YWwpIC0+XG5cdFx0dHJhbnNmb3JtcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGVsZW0pW3RyYW5zZm9ybV9wcm9wZXJ0eV0ubWF0Y2goL1swLTlcXC5dKy9nKVxuXHRcdGlmICh0cmFuc2Zvcm1zKVxuXHRcdFx0dHJhbnNmb3Jtc1swXSA9IHZhbFxuXHRcdFx0dHJhbnNmb3Jtc1szXSA9IHZhbFxuXHRcdFx0ZWxlbS5zdHlsZVt0cmFuc2Zvcm1fcHJvcGVydHldID0gJ21hdHJpeCgnK3RyYW5zZm9ybXMuam9pbihcIiwgXCIpKycpJ1xuXHRcdGVsc2Vcblx0XHRcdGVsZW0uc3R5bGVbdHJhbnNmb3JtX3Byb3BlcnR5XSA9IFwic2NhbGUoXCIrdmFsK1wiKVwiXG59XG5cbmpRdWVyeS5meC5zdGVwLnNjYWxlID0gKGZ4KSAtPlxuXHRqUXVlcnkuY3NzSG9va3NbJ3NjYWxlJ10uc2V0KGZ4LmVsZW0sIGZ4Lm5vdylcblxuaWYgKHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpLnRyYW5zZm9ybSlcblx0dHJhbnNmb3JtX3Byb3BlcnR5ID0gXCJ0cmFuc2Zvcm1cIlxuZWxzZVxuXHR0cmFuc2Zvcm1fcHJvcGVydHkgPSBcIndlYmtpdFRyYW5zZm9ybVwiXG4iLCJqUXVlcnkuZm4ucmVhZGRDbGFzcyA9IChjbGFzc19uYW1lKSAtPlxuXHRlbGVtID0gQFxuXHRlbGVtLnJlbW92ZUNsYXNzIGNsYXNzX25hbWVcblx0c2V0VGltZW91dCAoIC0+XG5cdFx0ZWxlbS5hZGRDbGFzcyBjbGFzc19uYW1lXG5cdCksIDFcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLnJlbW92ZUxhdGVyID0gKHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0ucmVtb3ZlKClcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uaGlkZUxhdGVyID0gKHRpbWUgPSA1MDApIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGlmIGVsZW0uY3NzKFwib3BhY2l0eVwiKSA9PSAwXG5cdFx0XHRlbGVtLmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpXG5cdCksIHRpbWVcblx0cmV0dXJuIEBcblxualF1ZXJ5LmZuLmFkZENsYXNzTGF0ZXIgPSAoY2xhc3NfbmFtZSwgdGltZSA9IDUpIC0+XG5cdGVsZW0gPSBAXG5cdHNldFRpbWVvdXQgKCAtPlxuXHRcdGVsZW0uYWRkQ2xhc3MoY2xhc3NfbmFtZSlcblx0KSwgdGltZVxuXHRyZXR1cm4gQFxuXG5qUXVlcnkuZm4uY3NzTGF0ZXIgPSAobmFtZSwgdmFsLCB0aW1lID0gNTAwKSAtPlxuXHRlbGVtID0gQFxuXHRzZXRUaW1lb3V0ICggLT5cblx0XHRlbGVtLmNzcyBuYW1lLCB2YWxcblx0KSwgdGltZVxuXHRyZXR1cm4gQCJdfQ==
