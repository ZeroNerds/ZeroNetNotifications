class Notifications
	constructor: (@elem) ->
		@

	# TODO: add unit tests
	test: ->
		setTimeout (=>
			@add("connection", "error", "Connection lost to <b>UiServer</b> on <b>localhost</b>!")
			@add("message-Anyone", "info", "New  from <b>Anyone</b>.")
		), 1000
		setTimeout (=>
			@add("connection", "done", "<b>UiServer</b> connection recovered.", 5000)
		), 3000


	add: (id, type, body, timeout=0) ->
		id = id.replace /[^A-Za-z0-9]/g, ""
		# Close notifications with same id
		for elem in $(".notification-#{id}")
			@close $(elem)

		# Create element
		elem = $(".notification.notificationTemplate", @elem).clone().removeClass("notificationTemplate")
		elem.addClass("notification-#{type}").addClass("notification-#{id}")
		if type == "progress"
			elem.addClass("notification-done")

		# Update text
		if type == "error"
			$(".notification-icon", elem).html("!")
		else if type == "done"
			$(".notification-icon", elem).html("<div class='icon-success'></div>")
		else if type == "progress"
			$(".notification-icon", elem).html("<div class='icon-success'></div>")
		else if type == "ask"
			$(".notification-icon", elem).html("?")
		else
			$(".notification-icon", elem).html("i")

		if typeof(body) == "string"
			$(".body", elem).html("<span class='message'>"+body+"</span>")
		else
			$(".body", elem).html("").append(body)

		elem.appendTo(@elem)

		# Timeout
		if timeout
			$(".close", elem).remove() # No need of close button
			setTimeout (=>
				@close elem
			), timeout

		# Animate
		width = elem.outerWidth()
		if not timeout then width += 20 # Add space for close button
		if elem.outerHeight() > 55 then elem.addClass("long")
		elem.css({"width": "50px", "transform": "scale(0.01)"})
		elem.animate({"scale": 1}, 800, "easeOutElastic")
		elem.animate({"width": width}, 700, "easeInOutCubic")
		$(".body", elem).cssLater("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)", 1000)

		# Close button or Confirm button
		$(".close, .button", elem).on "click", =>
			@close elem
			return false

		# Select list
		$(".select", elem).on "click", =>
			@close elem

		return elem


	close: (elem) ->
		elem.stop().animate {"width": 0, "opacity": 0}, 700, "easeInOutCubic"
		elem.slideUp 300, (-> elem.remove())


	log: (args...) ->
		console.log "[Notifications]", args...

	displayOpenerDialog: ->
		elem = $("<div class='opener-overlay'><div class='dialog'>You have opened this page by clicking on a link. Please, confirm if you want to load this site.<a href='?' target='_blank' class='button'>Open site</a></div></div>")
		elem.find('a').on "click", ->
			window.open("?", "_blank")
			window.close()
			return false
		$("body").prepend(elem)

	# - Actions -

	actionOpenWindow: (params) ->
		if typeof(params) == "string"
			w = window.open()
			w.opener = null
			w.location = params
		else
			w = window.open(null, params[1], params[2])
			w.opener = null
			w.location = params[0]

	actionRequestFullscreen: ->
		if "Fullscreen" in @site_info.settings.permissions
			elem = document.getElementById("inner-iframe")
			request_fullscreen = elem.requestFullScreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullScreen
			request_fullscreen.call(elem)
			setTimeout ( =>
				if window.innerHeight != screen.height  # Fullscreen failed, probably only allowed on click
					@displayConfirm "This site requests permission:" + " <b>Fullscreen</b>", "Grant", =>
						request_fullscreen.call(elem)
			), 100
		else
			@displayConfirm "This site requests permission:" + " <b>Fullscreen</b>", "Grant", =>
				@site_info.settings.permissions.push("Fullscreen")
				@actionRequestFullscreen()
				@ws.cmd "permissionAdd", "Fullscreen"

	actionPermissionAdd: (message) ->
		permission = message.params
		@displayConfirm "This site requests permission:" + " <b>#{@toHtmlSafe(permission)}</b>", "Grant", =>
			@ws.cmd "permissionAdd", permission, =>
				@sendInner {"cmd": "response", "to": message.id, "result": "Granted"}

	actionNotification: (message) ->
		message.params = @toHtmlSafe(message.params) # Escape html
		body =  $("<span class='message'>"+message.params[1]+"</span>")
		@add("notification-#{message.id}", message.params[0], body, message.params[2])

	displayConfirm: (message, caption, cancel=false, cb) ->
		body = $("<span class='message'>"+message+"</span>")
		button = $("<a href='##{caption}' class='button button-#{caption}'>#{caption}</a>") # Add confirm button
		button.on "click", =>
			cb(true)
			return false
		body.append(button)
		if (cancel)
			cButton = $("<a href='##{cancel}' class='button button-#{cancel}'>#{cancel}</a>") # Add confirm button
			cButton.on "click", =>
				cb(false)
				return false
			body.append(cButton)
		@add("notification-#{caption}", "ask", body)

		button.focus()
		$(".notification").scrollLeft(0)


	actionConfirm: (message, cb=false) ->
		message.params = @toHtmlSafe(message.params) # Escape html
		if message.params[1] then caption = message.params[1] else caption = "ok"
		@displayConfirm message.params[0], caption, =>
			@sendInner {"cmd": "response", "to": message.id, "result": "boom"} # Response to confirm
			return false


	displayPrompt: (message, type, caption, cb) ->
		body = $("<span class='message'>"+message+"</span>")

		input = $("<input type='#{type}' class='input button-#{type}'/>") # Add input
		input.on "keyup", (e) => # Send on enter
			if e.keyCode == 13
				button.trigger "click" # Response to confirm
		body.append(input)

		button = $("<a href='##{caption}' class='button button-#{caption}'>#{caption}</a>") # Add confirm button
		button.on "click", => # Response on button click
			cb input.val()
			return false
		body.append(button)

		@add("notification-#{message.id}", "ask", body)

		input.focus()
		$(".notification").scrollLeft(0)


	actionPrompt: (message) ->
		message.params = @toHtmlSafe(message.params) # Escape html
		if message.params[1] then type = message.params[1] else type = "text"
		caption = "OK"

		@displayPrompt message.params[0], type, caption, (res) =>
			@sendInner {"cmd": "response", "to": message.id, "result": res} # Response to confirm

	actionProgress: (message) ->
		#message.params = @toHtmlSafe(message.params) # Escape html
		percent = Math.min(100, message.percent)/100
		offset = 75-(percent*75)
		circle = """
			<div class="circle"><svg class="circle-svg" width="30" height="30" viewport="0 0 30 30" version="1.1" xmlns="http://www.w3.org/2000/svg">
  				<circle r="12" cx="15" cy="15" fill="transparent" class="circle-bg"></circle>
  				<circle r="12" cx="15" cy="15" fill="transparent" class="circle-fg" style="stroke-dashoffset: #{offset}"></circle>
			</svg></div>
		"""
		body = "<span class='message'>"+message.content+"</span>" + circle
		elem = $(".notification-#{message.id}")
		if elem.length
			width = $(".body .message", elem).outerWidth()
			$(".body .message", elem).html(message.content)
			if $(".body .message", elem).css("width") == ""
				$(".body .message", elem).css("width", width)
			$(".body .circle-fg", elem).css("stroke-dashoffset", offset)
		else
			elem = @add(message.id, "progress", $(body))
		if percent > 0
			$(".body .circle-bg", elem).css {"animation-play-state": "paused", "stroke-dasharray": "180px"}

		if $(".notification-icon", elem).data("done")
			return false
		else if message.percent >= 100  # Done
			$(".circle-fg", elem).css("transition", "all 0.3s ease-in-out")
			setTimeout (->
				$(".notification-icon", elem).css {transform: "scale(1)", opacity: 1}
				$(".notification-icon .icon-success", elem).css {transform: "rotate(45deg) scale(1)"}
			), 300
			if (message.autoClose)
				setTimeout (=>
					@close elem
				), 3000
			$(".notification-icon", elem).data("done", true)
		else if message.percent < 0  # Error
			$(".body .circle-fg", elem).css("stroke", "#ec6f47").css("transition", "transition: all 0.3s ease-in-out")
			setTimeout (=>
				$(".notification-icon", elem).css {transform: "scale(1)", opacity: 1}
				elem.removeClass("notification-done").addClass("notification-error")
				$(".notification-icon .icon-success", elem).removeClass("icon-success").html("!")
			), 300
			$(".notification-icon", elem).data("done", true)

	toHtmlSafe: (values) ->
		if values not instanceof Array then values = [values] # Convert to array if its not
		for value, i in values
			value = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') # Escape
			value = value.replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>") # Unescape b, i, u, br tags
			values[i] = value
		return values

class Notification
		constructor: (@main,message) -> #(@id, @type, @body, @timeout=0) ->
			@main_elem=@main.elem
			@id = message.id.replace /[^A-Za-z0-9]/g, ""
			# Close notifications with same id
			for elem in $(".notification-#{@id}")
				@close $(elem) # TODO: fix this to use Notifications.get(id) and throw

			# Create element
			@elem = $(".notification.notificationTemplate", @main_elem).clone().removeClass("notificationTemplate") # TODO: get elem from notifications
			@elem.addClass("notification-#{type}").addClass("notification-#{id}")
			if type == "progress"
				@elem.addClass("notification-done")

			# Update text
			updateText(type)
				#$(".notification-icon", elem).html("i")

			if typeof(body) == "string"
				$(".body", elem).html("<span class='message'>"+escape(message.body)+"</span>")
			else
				$(".body", elem).html("").append(body)

			elem.appendTo(@elem)

			# Timeout
			if timeout
				$(".close", elem).remove() # No need of close button
				setTimeout (=>
					@close elem
				), timeout

			# Animate
			width = elem.outerWidth()
			if not timeout then width += 20 # Add space for close button
			if elem.outerHeight() > 55 then elem.addClass("long")
			elem.css({"width": "50px", "transform": "scale(0.01)"})
			elem.animate({"scale": 1}, 800, "easeOutElastic")
			elem.animate({"width": width}, 700, "easeInOutCubic")
			$(".body", elem).cssLater("box-shadow", "0px 0px 5px rgba(0,0,0,0.1)", 1000)

			# Close button or Confirm button
			$(".close, .button", elem).on "click", =>
				@close elem
				return false

			# Select list
			$(".select", elem).on "click", =>
				@close elem

			@elem=elem
			@

	escape: (value) ->
 		return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&lt;([\/]{0,1}(br|b|u|i))&gt;/g, "<$1>") # Escape and Unescape b, i, u, br tags

	updateText: (type) ->
		if type == "error"
			$(".notification-icon", @elem).html("!")
		else if type == "done"
			$(".notification-icon", @elem).html("<div class='icon-success'></div>")
		else if type == "progress"
			$(".notification-icon", @elem).html("<div class='icon-success'></div>")
		else if type == "ask"
			$(".notification-icon", @elem).html("?")
		else
			throw new Error("UnknownNotificationType: Type "+type+"is not known")

	close: () ->



window.Notifications = Notifications
