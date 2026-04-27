ALTER TABLE "pages" ADD CONSTRAINT "pages_status_check" CHECK ("status" IN ('draft', 'published', 'archived'));
ALTER TABLE "pages" ADD CONSTRAINT "pages_type_check" CHECK ("type" IN ('tutorial', 'tip', 'cheatsheet', 'note'));
ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_kind_check" CHECK ("kind" IN ('openai_compatible', 'openrouter', 'litellm_proxy'));
ALTER TABLE "ai_providers" ADD CONSTRAINT "ai_providers_discovery_mode_check" CHECK ("discovery_mode" IN ('v1-models', 'openrouter-models', 'litellm-model-info', 'static'));
