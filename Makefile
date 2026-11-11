# Convenience targets for Learn by Heart.
.PHONY: all install start build preview test lint clean help

all: install start

install: ## Install dependencies
	npm install

start: ## Start the dev server
	npm run dev

build: ## Build for production into ./build
	npm run build

preview: ## Serve the production build locally
	npm run preview

test: ## Run the test suite
	npm test

lint: ## Lint the source
	npm run lint

clean: ## Remove node_modules and build output
	rm -rf ./node_modules ./build

help: ## Show this help
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-8s %s\n", $$1, $$2}'
