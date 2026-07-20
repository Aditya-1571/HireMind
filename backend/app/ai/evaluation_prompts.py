from dataclasses import dataclass

MAX_ANSWER_LENGTH = 1000
MAX_QUESTION_LENGTH = 300
MAX_CONTEXT_ITEMS = 4
MAX_CONTEXT_ITEM_LENGTH = 140


@dataclass(frozen=True)
class EvaluationAnswer:
    sequence_number: int
    question: str
    answer: str


def _compact_text(value: str, max_length: int) -> str:
    cleaned = " ".join(value.split()).strip()
    if len(cleaned) <= max_length:
        return cleaned
    return cleaned[:max_length].rstrip()


def prepare_evaluation_answers(
    answers: list[EvaluationAnswer],
) -> list[EvaluationAnswer]:
    return [
        EvaluationAnswer(
            sequence_number=item.sequence_number,
            question=_compact_text(item.question, MAX_QUESTION_LENGTH),
            answer=_compact_text(item.answer, MAX_ANSWER_LENGTH),
        )
        for item in answers
    ]


def _context_lines(resume_context: dict[str, list[str]] | None) -> list[str]:
    if not resume_context:
        return []

    lines: list[str] = []
    for key in ("skills", "programming_languages", "frameworks_and_libraries", "tools_and_platforms", "experience"):
        values = resume_context.get(key)
        if not isinstance(values, list):
            continue
        cleaned: list[str] = []
        for value in values:
            if not isinstance(value, str):
                continue
            item = _compact_text(value, MAX_CONTEXT_ITEM_LENGTH)
            if item:
                cleaned.append(item)
            if len(cleaned) >= MAX_CONTEXT_ITEMS:
                break
        if cleaned:
            lines.append(f"{key}: {', '.join(cleaned)}")
    return lines


def build_answer_evaluation_prompt(
    *,
    target_role: str,
    interview_type: str,
    difficulty: str,
    answers: list[EvaluationAnswer],
    resume_context: dict[str, list[str]] | None = None,
    retry_note: str | None = None,
) -> str:
    answer_lines = []
    for item in prepare_evaluation_answers(answers):
        answer_lines.append(
            f"{item.sequence_number}. Question: {item.question}\n"
            f"Answer: {item.answer}",
        )

    context = "\n".join(_context_lines(resume_context))
    context_block = f"\nRelevant resume context:\n{context}" if context else ""
    retry = f"\nFix this validation issue only: {retry_note}." if retry_note else ""

    return f"""You are a fair technical interviewer evaluating completed interview answers.
Target role: {target_role}
Interview type: {interview_type}
Difficulty: {difficulty}
Evaluate only relevance, correctness, clarity, depth, examples, and communication quality.
Do not infer or mention protected traits, identity, health, politics, religion, caste, appearance, age, gender, or accent.
Keep feedback concise and constructive. Return only valid JSON. Do not include markdown fences.
Scores: each question score is 0-10. Do not include an overall score.
Answers:
{chr(10).join(answer_lines)}{context_block}{retry}
JSON shape:
{{"overall_feedback":"string","strengths":["string"],"improvements":["string"],"question_evaluations":[{{"sequence_number":1,"score":0,"feedback":"string","strength":"string","improvement":"string"}}]}}"""
