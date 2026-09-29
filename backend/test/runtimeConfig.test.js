const test = require("node:test");
const assert = require("node:assert/strict");
const { validateProductionConfig } = require("../config/runtimeConfig");

const productionEnv = {
    NODE_ENV: "production",
    JWT_SECRET: "this-is-a-valid-test-secret-that-is-long-enough-123",
    MONGO_URI: "mongodb+srv://db.example.test/ai-comply",
    FRONTEND_URL: "https://complaints.example.test",
    SMTP_HOST: "smtp.example.test",
    SMTP_USER: "mailer",
    SMTP_PASS: "test-password",
    EMAIL_FROM: "AI-COMPLY <noreply@example.test>",
    STORAGE_DRIVER: "s3",
    S3_BUCKET: "complaint-attachments",
    AWS_REGION: "us-east-1",
    AI_ENABLED: "true",
    OPENAI_API_KEY: "test-key"
};

test("production config accepts complete service settings", () => {
    assert.deepEqual(validateProductionConfig(productionEnv), []);
});

test("production config rejects development defaults and missing services", () => {
    const errors = validateProductionConfig({ NODE_ENV: "production" });
    assert.ok(errors.some(error => error.includes("JWT_SECRET")));
    assert.ok(errors.some(error => error.includes("MONGO_URI")));
    assert.ok(errors.some(error => error.includes("SMTP_HOST")));
    assert.ok(errors.some(error => error.includes("STORAGE_DRIVER")));
    assert.ok(errors.some(error => error.includes("OPENAI_API_KEY")));
});

test("non-production config does not require cloud service credentials", () => {
    assert.deepEqual(validateProductionConfig({ NODE_ENV: "development" }), []);
});

test("custom S3 endpoints require credentials as a pair", () => {
    const errors = validateProductionConfig({
        ...productionEnv,
        S3_ENDPOINT: "https://account.r2.cloudflarestorage.com",
        S3_ACCESS_KEY_ID: "only-one"
    });
    assert.ok(errors.some(error => error.includes("both S3_ACCESS_KEY_ID")));
});

test("production config rejects insecure custom S3 endpoints", () => {
    const errors = validateProductionConfig({
        ...productionEnv,
        S3_ENDPOINT: "http://storage.example.test",
        S3_ACCESS_KEY_ID: "access",
        S3_SECRET_ACCESS_KEY: "secret"
    });
    assert.ok(errors.some(error => error.includes("must use HTTPS")));
});
