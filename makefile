# Load environment variables from .env if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: db

db:
	@echo Connecting to Supabase...
	@psql "$(SUPABASE_DB_URL_CLI_CONNECT)"