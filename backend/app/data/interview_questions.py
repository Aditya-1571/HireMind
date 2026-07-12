QUESTION_COUNT = 5

# Temporary static question bank. This is intentionally simple and will be
# replaced by AI-generated interview questions in a later phase.
INTERVIEW_QUESTIONS: dict[str, dict[str, list[str]]] = {
    "HR": {
        "Easy": [
            "Tell me about yourself and your recent work.",
            "Why are you interested in this role?",
            "Describe a time you worked well with a team.",
            "How do you organize your work when deadlines are close?",
            "What are you hoping to learn in your next role?",
        ],
        "Medium": [
            "Tell me about a time you handled conflicting priorities.",
            "Describe a difficult conversation you had at work.",
            "How do you respond to feedback you disagree with?",
            "What motivates you during a challenging project?",
            "How do you build trust with new teammates?",
        ],
        "Hard": [
            "Tell me about a major setback and how you recovered.",
            "Describe a time you influenced a decision without authority.",
            "How would you handle a teammate who repeatedly misses commitments?",
            "What tradeoff have you made between speed and quality?",
            "Describe a time you had to adapt to a large organizational change.",
        ],
    },
    "Technical": {
        "Easy": [
            "Explain the difference between a list and a dictionary.",
            "What happens when an HTTP request returns a 404 status?",
            "How would you debug a failing API endpoint?",
            "What is a database index used for?",
            "Explain what version control helps a team do.",
        ],
        "Medium": [
            "How would you design pagination for a large API response?",
            "Explain how you would prevent duplicate form submissions.",
            "What are the tradeoffs between SQL and NoSQL databases?",
            "How would you structure validation between frontend and backend?",
            "Describe how authentication tokens should be handled securely.",
        ],
        "Hard": [
            "Design a reliable job processing system for long-running tasks.",
            "How would you investigate intermittent database latency?",
            "Explain how you would migrate a busy production table safely.",
            "How would you design rate limiting for a public API?",
            "Describe how you would make a service resilient to partial outages.",
        ],
    },
    "Mixed": {
        "Easy": [
            "Tell me about yourself and one technical project you enjoyed.",
            "How do you explain technical work to a non-technical teammate?",
            "What is one tool or framework you recently learned?",
            "Describe a time you asked for help on a technical problem.",
            "How do you keep your tasks organized during a project?",
        ],
        "Medium": [
            "Describe a project where communication affected the technical outcome.",
            "How would you balance a product deadline with technical debt?",
            "Tell me about a bug you fixed and how you explained the impact.",
            "How do you decide when to refactor code?",
            "Describe how you would work with design or product on an unclear requirement.",
        ],
        "Hard": [
            "Tell me about a high-pressure technical decision you made.",
            "How would you align stakeholders around a risky engineering tradeoff?",
            "Describe a production incident and how you would communicate during it.",
            "How would you handle disagreement over system architecture?",
            "Explain how you would lead a complex project from ambiguity to delivery.",
        ],
    },
}
