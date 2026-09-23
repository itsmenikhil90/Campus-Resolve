let OpenAI = null;
try { OpenAI = require("openai"); } catch (_) { console.log("AI package not installed; using safe analysis fallback."); }

const client = process.env.OPENAI_API_KEY && OpenAI
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const analyzeComplaint = async (title, description) => {

    // AI currently disabled
    if (process.env.AI_ENABLED !== "true") {
        console.log("ℹ️ AI Analysis disabled - Manual management review");

        return {
            category: "Other",
            priority: "Medium",
            summary: "",
            department: "Administration",
            sentiment: "Neutral",
            keywords: [],
            confidence: 0
        };
    }

    try {
        console.log("🤖 AI Analysis Started...");

        const prompt = `
Analyze this student complaint.

Title:
${title}

Description:
${description}

Return ONLY valid JSON:

{
    "category": "Academics | Faculty | Infrastructure | Laboratory | Library | Hostel | Canteen | Transport | Fees | Examination | IT/Technical | Other",
    "priority": "Low | Medium | High | Critical",
    "summary": "short summary",
    "department": "suggested department",
    "sentiment": "Positive | Neutral | Negative",
    "keywords": ["keyword1", "keyword2"],
    "confidence": 0.0
}

Do not include markdown.
`;

        const response = await client.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });

        return JSON.parse(response.output_text);

    } catch (error) {
        console.error("AI Analysis Error:", error.message);

        return {
            category: "Other",
            priority: "Medium",
            summary: "",
            department: "Administration",
            sentiment: "Neutral",
            keywords: [],
            confidence: 0
        };
    }
};

module.exports = {
    analyzeComplaint
};
