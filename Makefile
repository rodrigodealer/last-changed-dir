default: build

.PHONY: build
build:
	@ncc build index.js --license licenses.txt

.PHONY: dev
dev:
	@npm init -y
	@npm install @actions/core
	@npm install @actions/github
