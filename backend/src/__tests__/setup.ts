process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_at_least_32_characters_long_!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'sk-test-fake-key-for-testing-only';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
