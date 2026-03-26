SHELL := /bin/sh

.PHONY: up down build run logs test test-unit test-integration test-functional lint ci

up:
	docker compose up -d --build

down:
	docker compose down --remove-orphans

build:
	npm run build

run:
	npm run start:dev

logs:
	docker compose logs -f app postgres

test:
	npm run test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-functional:
	npm run test:functional

lint:
	npm run lint

ci:
	npm run test:ci
