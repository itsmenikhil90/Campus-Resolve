const test = require("node:test");
const assert = require("node:assert/strict");
const { configured } = require("../services/emailService");

test("email service is not configured when SMTP credentials are missing", () => {
    const original = Object.fromEntries(["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"].map(key => [key, process.env[key]]));
    try {
        for (const key of Object.keys(original)) delete process.env[key];
        assert.equal(configured(), false);
    } finally {
        for (const [key, value] of Object.entries(original)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});

test("email service requires a sender as well as SMTP credentials", () => {
    const original = Object.fromEntries(["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "SMTP_FROM"].map(key => [key, process.env[key]]));
    try {
        process.env.SMTP_HOST = "smtp.example.test";
        process.env.SMTP_USER = "mailer";
        process.env.SMTP_PASS = "test-password";
        delete process.env.EMAIL_FROM;
        delete process.env.SMTP_FROM;
        assert.equal(configured(), false);
    } finally {
        for (const [key, value] of Object.entries(original)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
});
