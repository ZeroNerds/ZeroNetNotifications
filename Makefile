build:
	npm run build
	du -hs dist/*
clean:
	rm -rfv dist
watch:
	npx gulp w
