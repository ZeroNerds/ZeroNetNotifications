jQuery.cssHooks.scale = {
	get: (elem, computed) ->
		match = window.getComputedStyle(elem)[transform_property].match("[0-9\.]+")
		if match
			scale = parseFloat(match[0])
			return scale
		else
			return 1.0
	set: (elem, val) ->
		transforms = window.getComputedStyle(elem)[transform_property].match(/[0-9\.]+/g)
		if (transforms)
			transforms[0] = val
			transforms[3] = val
			elem.style[transform_property] = 'matrix('+transforms.join(", ")+')'
		else
			elem.style[transform_property] = "scale("+val+")"
}

jQuery.fx.step.scale = (fx) ->
	jQuery.cssHooks['scale'].set(fx.elem, fx.now)

if (window.getComputedStyle(document.body).transform)
	transform_property = "transform"
else
	transform_property = "webkitTransform"
