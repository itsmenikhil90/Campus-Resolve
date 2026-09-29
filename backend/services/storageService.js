const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { S3Client, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand, HeadBucketCommand } = require("@aws-sdk/client-s3");

const allowedTypes = new Map([
    ["image/jpeg", ".jpg"],
    ["image/png", ".png"],
    ["image/webp", ".webp"],
    ["application/pdf", ".pdf"]
]);

const uploadDirectory = () => path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"));
const driver = () => process.env.STORAGE_DRIVER || "local";

const hasValidSignature = file => {
    const buffer = file.buffer;
    switch (file.mimetype) {
        case "image/jpeg":
            return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        case "image/png":
            return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        case "image/webp":
            return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
        case "application/pdf":
            return buffer.toString("ascii", 0, 5) === "%PDF-";
        default:
            return false;
    }
};

let client;
const getS3Client = () => {
    if (!client) {
        const options = {
            region: process.env.AWS_REGION,
            ...(process.env.S3_ENDPOINT ? {
                endpoint: process.env.S3_ENDPOINT,
                forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
            } : {}),
            ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
                }
            } : {})
        };
        client = new S3Client(options);
    }
    return client;
};

const saveUploads = async files => {
    if (!files?.length) return [];

    const stored = [];
    try {
        if (driver() === "s3") {
            const s3 = getS3Client();
            for (const file of files) {
                const extension = allowedTypes.get(file.mimetype);
                if (!extension || !hasValidSignature(file)) throw new Error("Attachment content does not match an allowed file type.");
                const key = `complaints/${crypto.randomUUID()}${extension}`;
                await s3.send(new PutObjectCommand({
                    Bucket: process.env.S3_BUCKET,
                    Key: key,
                    Body: file.buffer,
                    ContentLength: file.size,
                    ContentType: file.mimetype
                }));
                stored.push(`s3:${key}`);
            }
            return stored;
        }

        const directory = uploadDirectory();
        await fs.mkdir(directory, { recursive: true });
        for (const file of files) {
            const extension = allowedTypes.get(file.mimetype);
            if (!extension || !hasValidSignature(file)) throw new Error("Attachment content does not match an allowed file type.");
            const filename = `${crypto.randomUUID()}${extension}`;
            await fs.writeFile(path.join(directory, filename), file.buffer, { flag: "wx" });
            stored.push(`local:${filename}`);
        }
        return stored;
    } catch (error) {
        await deleteUploads(stored);
        throw error;
    }
};

const deleteUploads = async references => {
    if (!references?.length) return;

    const keys = references.filter(reference => reference.startsWith("s3:")).map(reference => reference.slice(3));
    if (keys.length) {
        await getS3Client().send(new DeleteObjectsCommand({
            Bucket: process.env.S3_BUCKET,
            Delete: { Objects: keys.map(Key => ({ Key })), Quiet: true }
        }));
    }

    const localFiles = references.filter(reference => reference.startsWith("local:") || reference.startsWith("/uploads/"));
    for (const reference of localFiles) {
        const filename = path.basename(reference.startsWith("local:") ? reference.slice(6) : reference);
        await fs.rm(path.join(uploadDirectory(), filename), { force: true });
    }
};

const getAttachment = async reference => {
    if (reference.startsWith("s3:")) {
        const key = reference.slice(3);
        const result = await getS3Client().send(new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key
        }));
        return {
            type: "stream",
            body: result.Body,
            contentType: result.ContentType || "application/octet-stream",
            contentLength: result.ContentLength
        };
    }

    if (reference.startsWith("local:") || reference.startsWith("/uploads/")) {
        const filename = path.basename(reference.startsWith("local:") ? reference.slice(6) : reference);
        const filePath = path.join(uploadDirectory(), filename);
        return { type: "file", filePath };
    }

    throw new Error("Unsupported stored attachment reference.");
};

const checkStorage = async () => {
    if (driver() !== "s3") return false;
    await getS3Client().send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }), {
        abortSignal: AbortSignal.timeout(5000)
    });
    return true;
};

module.exports = { allowedTypes, saveUploads, deleteUploads, getAttachment, checkStorage };
