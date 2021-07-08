.PHONY: publish
publish:
	lerna run build
	lerna publish
