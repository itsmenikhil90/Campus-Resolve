const Notification = require("../models/notification");
const mongoose = require("mongoose");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("complaint", "ticketId title status").sort({ createdAt: -1 }).limit(100);
        const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
        res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        console.error("Get notifications:", error);
        res.status(500).json({ success: false, message: "Could not load notifications" });
    }
};
exports.markRead = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, message: "Notification marked as read", data: notification });
    } catch (error) {
        console.error("Mark notification as read:", error);
        res.status(500).json({ success: false, message: "Could not update notification" });
    }
};
exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
        res.json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        console.error("Mark all notifications as read:", error);
        res.status(500).json({ success: false, message: "Could not update notifications" });
    }
};
