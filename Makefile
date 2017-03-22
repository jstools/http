# --- jstool-http

git_branch := $(shell git rev-parse --abbrev-ref HEAD)

install:
	@npm install

build: install
	$(shell npm bin)/rollup src/http-browser.js --format umd --output dist/browser.js -n \$http
	$(shell npm bin)/rollup src/http-node.js --format cjs --output dist/http-node.js

github.release: export RELEASE_URL=$(shell curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${GITHUB_TOKEN}" \
	-d '{"tag_name": "v$(shell npm view spears version)", "target_commitish": "$(git_branch)", "name": "v$(shell npm view spears version)", "body": "", "draft": false, "prerelease": false}' \
	-w '%{url_effective}' "https://api.github.com/repos/kiltjs/http/releases" )
github.release:
	@echo ${RELEASE_URL}
	@true

publish: build
	npm version patch
	git push origin $(git_branch)
	cp package.json dist/package.json
	cp LICENSE dist/LICENSE
	cp README.md dist/README.md
	cd dist && npm publish
	make github.release

master.increaseVersion:
	git checkout master
	@git pull origin master
	@node make pkg:increaseVersion

git.increaseVersion: master.increaseVersion
	git commit -a -n -m "increased version [$(shell node make pkg:version)]"
	@git push origin master

git.updateRelease:
	git checkout release
	@git pull origin release
	@git merge --no-edit master

release: auto.install test git.increaseVersion git.updateRelease build
	@git add dist -f --all
	-git commit -n -m "updating built versions"
	@git push origin release
	@echo "\n\trelease version $(shell node make pkg:version)\n"
	@git checkout master
	npm publish
	node make gh-release

echo:
	@echo "make options: test build dev live"

# DEFAULT TASKS

.DEFAULT_GOAL := build
