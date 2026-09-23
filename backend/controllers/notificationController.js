const Notification = require("../models/notification");

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("complaint", "ticketId title status").sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, data: { notifications, unreadCount: notifications.filter(n => !n.isRead).length } });
    } catch (error) { res.status(500).json({ success: false, message: "Could not load notifications" }); }
};
exports.markRead = async (req, res) => {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { isRead: true }, { new: true });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification marked as read", data: notification });
};
exports.markAllRead = async (req, res) => {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Notifications marked as read" });
};
