const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const allowedTypes = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["application/pdf", ".pdf"]
]);

const uploadDirectory = () =>
    path.resolve(
        process.env.UPLOAD_DIR ||
        path.join(__dirname, "..", "uploads")
    );

/* =================================
   FILE SIGNATURE VALIDATION
================================= */

const hasValidSignature = file => {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) {
        return false;
    }

    const buffer = file.buffer;

    switch (file.mimetype) {
        case "image/jpeg":
            return (
                buffer.length >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff
            );

        case "image/png":
            return (
                buffer.length >= 8 &&
                buffer
                    .subarray(0, 8)
                    .equals(
                        Buffer.from([
                            0x89, 0x50, 0x4e, 0x47,
                            0x0d, 0x0a, 0x1a, 0x0a
                        ])
                    )
            );

        case "image/webp":
            return (
                buffer.length >= 12 &&
                buffer.toString("ascii", 0, 4) === "RIFF" &&
                buffer.toString("ascii", 8, 12) === "WEBP"
            );

        case "application/pdf":
            return buffer.toString("ascii", 0, 5) === "%PDF-";

        default:
            return false;
    }
};

/* =================================
   SAVE ATTACHMENTS
================================= */

const saveUploads = async files => {
    if (!files?.length) {
        return [];
    }

    const stored = [];
    const directory = uploadDirectory();

    try {
        await fs.mkdir(directory, { recursive: true });

        for (const file of files) {
            const extension = allowedTypes.get(file.mimetype);

            if (!extension || !hasValidSignature(file)) {
                throw new Error(
                    "Attachment content does not match an allowed file type."
                );
            }

            if (
                typeof file.size !== "number" ||
                file.size > 5 * 1024 * 1024
            ) {
                throw new Error(
                    "Each attachment must be 5 MB or smaller."
                );
            }

            const filename = `${crypto.randomUUID()}${extension}`;
            const filePath = path.join(directory, filename);

            await fs.writeFile(filePath, file.buffer, {
                flag: "wx"
            });

            stored.push(`local:${filename}`);
        }

        return stored;

    } catch (error) {
        await deleteUploads(stored).catch(cleanupError => {
            console.error(
                "Attachment cleanup failed:",
                cleanupError.message
            );
        });

        throw error;
    }
};

/* =================================
   DELETE ATTACHMENTS
================================= */

const deleteUploads = async references => {
    if (!references?.length) {
        return;
    }

    for (const reference of references) {
        if (
            typeof reference !== "string" ||
            !reference.startsWith("local:")
        ) {
            continue;
        }

        const filename = path.basename(reference.slice(6));

        await fs.rm(
            path.join(uploadDirectory(), filename),
            { force: true }
        );
    }
};

/* =================================
   GET ATTACHMENT
================================= */

const getAttachment = async reference => {
    if (
        typeof reference !== "string" ||
        !reference.startsWith("local:")
    ) {
        throw new Error("Unsupported stored attachment reference.");
    }

    const filename = path.basename(reference.slice(6));
    const filePath = path.join(uploadDirectory(), filename);

    return {
        type: "file",
        filePath
    };
};

/* =================================
   STORAGE HEALTH CHECK
================================= */

const checkStorage = async () => {
    try {
        await fs.mkdir(uploadDirectory(), {
            recursive: true
        });

        await fs.access(uploadDirectory());

        return true;
    } catch (error) {
        console.error(
            "Local storage check failed:",
            error.message
        );

        return false;
    }
};

module.exports = {
    allowedTypes,
    saveUploads,
    deleteUploads,
    getAttachment,
    checkStorage
};