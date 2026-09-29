const isPlaceholder = value => /replace_with|change_me|example|your[_ -]/i.test(value);

const validateProductionConfig = (env = process.env) => {
    if (env.NODE_ENV !== "production") return [];

    const errors = [];
    const jwtSecret = env.JWT_SECRET || "";
    if (jwtSecret.length < 32 || isPlaceholder(jwtSecret)) {
        errors.push("JWT_SECRET must be a non-placeholder secret of at least 32 characters.");
    }

    if (!env.MONGO_URI || /localhost|127\.0\.0\.1/i.test(env.MONGO_URI)) {
        errors.push("MONGO_URI must point to a reachable production MongoDB deployment.");
    }

    if (!env.FRONTEND_URL?.trim()) {
        errors.push("FRONTEND_URL must include the deployed frontend origin.");
    } else {
        for (const origin of env.FRONTEND_URL.split(",").map(value => value.trim()).filter(Boolean)) {
            try {
                const parsed = new URL(origin);
                if (parsed.protocol !== "https:" || parsed.origin !== origin.replace(/\/$/, "")) {
                    errors.push("Every FRONTEND_URL entry must be an HTTPS origin without a path.");
                    break;
                }
            } catch {
                errors.push("FRONTEND_URL must contain valid HTTPS origins.");
                break;
            }
        }
    }

    

    if (env.STORAGE_DRIVER !== "s3") {
        errors.push("STORAGE_DRIVER must be set to s3 for durable production attachment storage.");
    }
    if (!env.S3_BUCKET?.trim()) errors.push("S3_BUCKET must be configured.");
    if (!env.AWS_REGION?.trim()) errors.push("AWS_REGION must be configured.");
    if (env.S3_ENDPOINT) {
        try {
            if (new URL(env.S3_ENDPOINT).protocol !== "https:") errors.push("S3_ENDPOINT must use HTTPS in production.");
        } catch {
            errors.push("S3_ENDPOINT must be a valid HTTPS URL.");
        }
    }
    if (env.S3_ENDPOINT && (!env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)) {
        errors.push("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY are required for custom S3 endpoints.");
    }
    if (Boolean(env.S3_ACCESS_KEY_ID) !== Boolean(env.S3_SECRET_ACCESS_KEY)) {
        errors.push("Configure both S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY, or neither to use the host IAM role.");
    }

    if (env.AI_ENABLED !== "true" || !env.OPENAI_API_KEY?.trim()) {
        errors.push("Set AI_ENABLED=true and configure OPENAI_API_KEY to enable complaint AI analysis.");
    }

    return errors;
};

module.exports = { validateProductionConfig };
