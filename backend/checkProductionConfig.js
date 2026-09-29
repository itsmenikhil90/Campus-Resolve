const dotenv = require("dotenv");
const { validateProductionConfig } = require("./config/runtimeConfig");

dotenv.config();

const errors = validateProductionConfig({ ...process.env, NODE_ENV: "production" });
if (errors.length) {
    console.error("Production configuration is incomplete:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
} else {
    console.log("Production configuration is complete.");
}
