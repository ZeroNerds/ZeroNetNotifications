clean:
	rm -fv src/*.js
	rm -fv src/*.js.map
	rm -rfv dist
watch:
	nodemon -e coffee,css -i dist -x make dev-build
build:
	gulp
dev-build:
	gulp dev
