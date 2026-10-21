const test = require("node:test");
const assert = require("node:assert/strict");
const Notification = require("../models/notification");
const controller = require("../controllers/notificationController");

const withOverrides = async (overrides, callback) => {
    const originals = Object.fromEntries(Object.keys(overrides).map(key => [key, Notification[key]]));
    Object.assign(Notification, overrides);
    try {
        await callback();
    } finally {
        Object.assign(Notification, originals);
    }
};

const response = () => ({
    statusCode: 200,
    status(code) {
        this.statusCode = code;
        return this;
    },
    json(data) {
        this.data = data;
        return this;
    }
});

test("notification list and unread count are scoped to the authenticated recipient", async () => {
    const ownerId = "student-a";
    const notifications = [{ _id: "notice-1", recipient: ownerId, isRead: false }];
    const filters = [];
    await withOverrides({
        find(filter) {
            filters.push(filter);
            return {
                populate() { return this; },
                sort() { return this; },
                limit() { return Promise.resolve(notifications); }
            };
        },
        async countDocuments(filter) {
            filters.push(filter);
            return 1;
        }
    }, async () => {
        const res = response();
        await controller.getNotifications({ user: { _id: ownerId } }, res);
        assert.deepEqual(filters, [
            { recipient: ownerId },
            { recipient: ownerId, isRead: false }
        ]);
        assert.equal(res.data.data.unreadCount, 1);
        assert.deepEqual(res.data.data.notifications, notifications);
    });
});

test("marking a notification read requires recipient ownership", async () => {
    const ownerId = "student-a";
    const notificationId = "507f1f77bcf86cd799439011";
    let query;
    await withOverrides({
        async findOneAndUpdate(filter, update, options) {
            query = { filter, update, options };
            return null;
        }
    }, async () => {
        const res = response();
        await controller.markRead({
            params: { id: notificationId },
            user: { _id: ownerId }
        }, res);
        assert.deepEqual(query, {
            filter: { _id: notificationId, recipient: ownerId },
            update: { isRead: true },
            options: { new: true }
        });
        assert.equal(res.statusCode, 404);
        assert.equal(res.data.message, "Notification not found");
    });
});

test("mark all read only updates notifications for the authenticated recipient", async () => {
    const ownerId = "student-a";
    let query;
    await withOverrides({
        async updateMany(filter, update) {
            query = { filter, update };
        }
    }, async () => {
        const res = response();
        await controller.markAllRead({ user: { _id: ownerId } }, res);
        assert.deepEqual(query, {
            filter: { recipient: ownerId, isRead: false },
            update: { isRead: true }
        });
        assert.equal(res.data.success, true);
    });
});
