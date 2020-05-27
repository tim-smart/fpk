.PHONY: docs
docs:
	lerna run docs
	git reset
	git add packages/k8s/docs
	git commit -m "[Makefile] update docs" || true
