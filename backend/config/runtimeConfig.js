const isPlaceholder = value =>
    /replace_with|change_me|example|your[_ -]/i.test(value || "");

const validateProductionConfig = (env = process.env) => {
    if (env.NODE_ENV !== "production") return [];

    const errors = [];

    // JWT Secret
    const jwtSecret = env.JWT_SECRET || "";

    if (jwtSecret.length < 32 || isPlaceholder(jwtSecret)) {
        errors.push(
            "JWT_SECRET must be a non-placeholder secret of at least 32 characters."
        );
    }

    // MongoDB
    if (
        !env.MONGO_URI ||
        /localhost|127\.0\.0\.1/i.test(env.MONGO_URI)
    ) {
        errors.push(
            "MONGO_URI must point to a reachable production MongoDB deployment."
        );
    }

    // Frontend URL
    if (!env.FRONTEND_URL?.trim()) {
        errors.push(
            "FRONTEND_URL must include the deployed frontend origin."
        );
    } else {
        const origins = env.FRONTEND_URL
            .split(",")
            .map(value => value.trim())
            .filter(Boolean);

        for (const origin of origins) {
            try {
                const parsed = new URL(origin);

                if (
                    parsed.protocol !== "https:" ||
                    parsed.origin !== origin.replace(/\/+$/, "")
                ) {
                    errors.push(
                        "Every FRONTEND_URL entry must be an HTTPS origin without a path."
                    );
                    break;
                }
            } catch {
                errors.push(
                    "FRONTEND_URL must contain valid HTTPS origins."
                );
                break;
            }
        }
    }

    // Email configuration remains required
    if (!env.SMTP_HOST?.trim()) {
        errors.push("SMTP_HOST must be configured.");
    }

    if (!env.SMTP_USER?.trim()) {
        errors.push("SMTP_USER must be configured.");
    }

    if (!env.SMTP_PASS?.trim()) {
        errors.push("SMTP_PASS must be configured.");
    }

    if (!(env.EMAIL_FROM || env.SMTP_FROM)?.trim()) {
        errors.push(
            "EMAIL_FROM or SMTP_FROM must be configured."
        );
    }

    // AWS S3 validation removed.
    // OpenAI validation removed.

    return errors;
};

module.exports = { validateProductionConfig };