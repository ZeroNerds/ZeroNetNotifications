clean:
	rm -fv src/*.js
	rm -rfv dist
watch:
	nodemon -i dist -e coffee,css -x make build
build:
	mkdir -p dist
	coffee --compile src/*.coffee
	cat src/*.js > dist/zeronet-notifications.js
	cp src/main.css dist/zeronet-notifications.css
