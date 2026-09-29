const test = require("node:test");
const assert = require("node:assert/strict");
const Complaint = require("../models/complaint");
const { getRelevantComplaints } = require("../controllers/chatbotController");
const { answerWithoutAI, buildChatbotInput } = require("../services/chatbotService");

const complaint = {
    ticketId: "CR-2026-0001",
    title: "Broken access",
    description: "x".repeat(2000),
    adminResponse: "y".repeat(1200),
    rejectionReason: "z".repeat(1200),
    statusHistory: Array.from({ length: 7 }, (_, index) => ({ status: `state-${index}` }))
};

const withComplaintFind = async (records, callback) => {
    const originalFind = Complaint.find;
    let query;
    Complaint.find = value => {
        query = value;
        const result = {
            sort() { return this; },
            limit() { return this; },
            select() { return this; },
            async lean() { return records; }
        };
        return result;
    };
    try {
        await callback(() => query);
    } finally {
        Complaint.find = originalFind;
    }
};

test("chatbot includes the FAQ and treats supplied complaint records as context", () => {
    const [system, user] = buildChatbotInput({
        message: "What is the status?",
        history: [],
        complaints: [{ ticketId: "CR-2026-0001", status: "In Progress" }]
    });

    assert.match(system.content, /Pending Approval/);
    assert.match(system.content, /untrusted data/);
    assert.match(system.content, /CR-2026-0001/);
    assert.equal(user.content, "What is the status?");
});

test("chatbot never queries private complaints for anonymous FAQ requests", async () => {
    const originalFind = Complaint.find;
    Complaint.find = () => assert.fail("Anonymous FAQ must not query complaint records");
    try {
        assert.deepEqual(await getRelevantComplaints(null, "How do I reset my password?"), []);
    } finally {
        Complaint.find = originalFind;
    }
});

test("authenticated general FAQs do not fetch private complaint records", async () => {
    const originalFind = Complaint.find;
    Complaint.find = () => assert.fail("General FAQs must not query complaint records");
    try {
        assert.deepEqual(await getRelevantComplaints(
            { _id: "student-123", role: "student" },
            "How do I file a complaint?"
        ), []);
        assert.deepEqual(await getRelevantComplaints(
            { _id: "student-123", role: "student" },
            "Who can see my complaints?"
        ), []);
    } finally {
        Complaint.find = originalFind;
    }
});

test("student complaint lookup is scoped to their account and response context is bounded", async () => {
    const studentId = "student-123";
    await withComplaintFind([complaint], getQuery => getRelevantComplaints(
        { _id: studentId, role: "student" },
        "What is the status of CR-2026-0001?"
    ).then(records => {
        assert.deepEqual(getQuery(), { student: studentId, ticketId: "CR-2026-0001" });
        assert.equal(records.length, 1);
        assert.equal(records[0].description.length, 1500);
        assert.equal(records[0].adminResponse.length, 1000);
        assert.equal(records[0].rejectionReason.length, 1000);
        assert.equal(records[0].statusHistory.length, 5);
    }));
});

test("admin may look up complaint context by ticket", async () => {
    const adminId = "admin-456";
    await withComplaintFind([complaint], getQuery => getRelevantComplaints(
        { _id: adminId, role: "admin" },
        "Give me details for CR-2026-0001"
    ).then(() => {
        assert.deepEqual(getQuery(), { ticketId: "CR-2026-0001" });
    }));
});

test("follow-up questions reuse a ticket ID from recent user conversation", async () => {
    await withComplaintFind([complaint], getQuery => getRelevantComplaints(
        { _id: "student-123", role: "student" },
        "and what did the administrator say?",
        [{ role: "user", content: "Please check ticket CR-2026-0001" }]
    ).then(() => {
        assert.deepEqual(getQuery(), { student: "student-123", ticketId: "CR-2026-0001" });
    }));
});

test("local chatbot answers supported FAQs and complaint details without AI credentials", () => {
    assert.match(answerWithoutAI({ message: "How do I file a complaint?" }), /Sign in to Campus Resolve/);
    assert.match(answerWithoutAI({ message: "Who can see my complaints?" }), /authorized administrators/);
    assert.match(answerWithoutAI({
        message: "What is the status of my latest complaint?",
        complaints: [{
            ticketId: "CR-2026-0001",
            title: "Broken access",
            status: "In Progress",
            category: "Infrastructure",
            priority: "High"
        }]
    }), /CR-2026-0001: Broken access\nStatus: In Progress/);
});

test("local chatbot does not invent a complaint when no authorized record exists", () => {
    assert.match(answerWithoutAI({ message: "What is the status of CR-2026-9999?" }), /couldn't find a matching complaint/);
});
