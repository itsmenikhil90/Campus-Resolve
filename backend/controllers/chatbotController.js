const Complaint = require("../models/complaint");
const { answerChatbotQuestion } = require("../services/chatbotService");

const ticketPattern = /\b(?:CR|AC)-\d{4}-\d{4,}\b/i;
const complaintLookupPattern = /\b(?:my|mine|own)\s+(?:(?:latest|recent|current|last)\s+)?(?:complaints?|tickets?|cases?)\b|\b(?:status|track|tracking|details?|history|response|update|progress)\b.{0,35}\b(?:my|mine|own|complaint|ticket|case)\b|\b(?:my|mine|own)\b.{0,35}\b(?:status|track|details?|history|response|updates?|progress)\b/i;
const generalFaqPattern = /\b(?:privacy|private|who can see|how long|deadline|resolution time|forgot password|password reset|login|sign in|attachment|file type|upload|what does .{0,30} mean|how do i (?:file|submit|create|raise))\b/i;

const getRelevantComplaints = async (user, message, history = []) => {
    if (generalFaqPattern.test(message) && !ticketPattern.test(message)) return [];
    const context = [message, ...history.filter(item => item.role === "user").map(item => item.content)].join("\n");
    if (!user || (!complaintLookupPattern.test(context) && !ticketPattern.test(context))) return [];

    const ticketId = context.match(ticketPattern)?.[0];
    const query = user.role === "admin"
        ? (ticketId ? { ticketId: ticketId.toUpperCase() } : {})
        : {
            student: user._id,
            ...(ticketId ? { ticketId: ticketId.toUpperCase() } : {})
        };
    const complaints = await Complaint.find(query)
        .sort({ updatedAt: -1 })
        .limit(ticketId ? 1 : 10)
        .select("ticketId title description category priority department status adminResponse rejectionReason statusHistory createdAt updatedAt resolvedAt")
        .lean();

    return complaints.map(complaint => ({
        ...complaint,
        description: complaint.description?.slice(0, 1500),
        adminResponse: complaint.adminResponse?.slice(0, 1000),
        rejectionReason: complaint.rejectionReason?.slice(0, 1000),
        statusHistory: complaint.statusHistory?.slice(-5)
    }));
};

const chat = async (req, res) => {
    const { message, history = [] } = req.body || {};
    if (typeof message !== "string" || !message.trim() || message.length > 1000) {
        return res.status(400).json({ success: false, message: "Enter a message of 1 to 1000 characters." });
    }
    if (!Array.isArray(history) || history.length > 8 || history.some(item =>
        !item || !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" || !item.content.trim() || item.content.length > 1000
    )) {
        return res.status(400).json({ success: false, message: "Chat history is invalid." });
    }

    try {
        const complaints = await getRelevantComplaints(req.user, message, history);
        const answer = await answerChatbotQuestion({
            message: message.trim(),
            history,
            complaints
        });
        return res.json({ success: true, answer });
    } catch (error) {
        if (error.status === 503) {
            return res.status(503).json({ success: false, message: error.message });
        }
        console.error("Chatbot request failed:", error.message);
        return res.status(502).json({
            success: false,
            message: "The chat assistant could not answer right now. Please try again shortly."
        });
    }
};

module.exports = { chat, getRelevantComplaints };
