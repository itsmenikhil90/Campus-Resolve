const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const storage = require("../services/storageService");

test("local attachment storage creates private references and supports cleanup", async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ai-comply-uploads-"));
    const previousDriver = process.env.STORAGE_DRIVER;
    const previousDirectory = process.env.UPLOAD_DIR;
    process.env.STORAGE_DRIVER = "local";
    process.env.UPLOAD_DIR = directory;

    try {
        const data = Buffer.from("%PDF-1.7 test attachment");
        const [reference] = await storage.saveUploads([{
            buffer: data,
            mimetype: "application/pdf",
            size: data.length
        }]);
        assert.match(reference, /^local:[0-9a-f-]+\.pdf$/i);

        const attachment = await storage.getAttachment(reference);
        assert.equal(attachment.type, "file");
        assert.deepEqual(await fs.readFile(attachment.filePath), data);

        await storage.deleteUploads([reference]);
        await assert.rejects(fs.access(attachment.filePath));
    } finally {
        if (previousDriver === undefined) delete process.env.STORAGE_DRIVER;
        else process.env.STORAGE_DRIVER = previousDriver;
        if (previousDirectory === undefined) delete process.env.UPLOAD_DIR;
        else process.env.UPLOAD_DIR = previousDirectory;
        await fs.rm(directory, { recursive: true, force: true });
    }
});

test("local attachment storage rejects unsupported file types", async () => {
    await assert.rejects(
        storage.saveUploads([{ buffer: Buffer.from("test"), mimetype: "text/plain", size: 4 }]),
        /does not match an allowed file type/
    );
});

test("attachment storage rejects files whose content does not match their MIME type", async () => {
    await assert.rejects(
        storage.saveUploads([{ buffer: Buffer.from("not a png"), mimetype: "image/png", size: 9 }]),
        /does not match an allowed file type/
    );
});

test("legacy local upload references are confined to the upload directory", async () => {
    const previousDirectory = process.env.UPLOAD_DIR;
    process.env.UPLOAD_DIR = path.join(os.tmpdir(), "ai-comply-uploads");
    try {
        const attachment = await storage.getAttachment("/uploads/../../private.txt");
        assert.equal(path.dirname(attachment.filePath), process.env.UPLOAD_DIR);
        assert.equal(path.basename(attachment.filePath), "private.txt");
    } finally {
        if (previousDirectory === undefined) delete process.env.UPLOAD_DIR;
        else process.env.UPLOAD_DIR = previousDirectory;
    }
});
