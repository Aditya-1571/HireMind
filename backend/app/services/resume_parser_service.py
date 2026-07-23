import re
from dataclasses import dataclass

from app.models import Resume
from app.parsers.docx_parser import extract_docx_text
from app.parsers.pdf_parser import extract_pdf_text

MAX_EXTRACTED_TEXT_LENGTH = 100_000
SAFE_PARSE_ERROR = "No readable resume text could be extracted."


class ResumeParsingError(Exception):
    pass


@dataclass(frozen=True)
class ParsedResume:
    text: str
    was_truncated: bool


def clean_resume_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    normalized = re.sub(r"[ \t\f\v]+", " ", normalized)
    normalized = "\n".join(line.strip() for line in normalized.split("\n"))
    normalized = re.sub(r"\n{3,}", "\n\n", normalized)
    return normalized.strip()


def parse_resume_content(content: bytes, file_type: str) -> ParsedResume:
    if file_type == "application/pdf":
        raw_text = extract_pdf_text(content)
    elif (
        file_type
        == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ):
        raw_text = extract_docx_text(content)
    else:
        raw_text = content.decode("utf-8", errors="ignore")

    text = clean_resume_text(raw_text)
    if not text:
        raise ResumeParsingError(SAFE_PARSE_ERROR)

    was_truncated = len(text) > MAX_EXTRACTED_TEXT_LENGTH
    return ParsedResume(
        text=text[:MAX_EXTRACTED_TEXT_LENGTH],
        was_truncated=was_truncated,
    )


def mark_resume_processing(resume: Resume) -> None:
    resume.processing_status = "processing"
    resume.extracted_text = None


def mark_resume_ready(resume: Resume, parsed_resume: ParsedResume) -> None:
    resume.extracted_text = parsed_resume.text
    resume.processing_status = "ready"


def mark_resume_failed(resume: Resume) -> None:
    resume.extracted_text = None
    resume.processing_status = "failed"
