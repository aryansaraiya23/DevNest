/**
 * Global test setup file.
 *
 * Sets NODE_ENV=test *before* any module is imported so that:
 * - `env.ts` skips requiring MONGODB_URI / JWT_SECRET
 * - `server.ts` skips starting the HTTP listener and DB connection
 */
process.env.NODE_ENV = 'test';
// Provide a safe, deterministic JWT secret for unit tests
process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long_for_unit_tests';
