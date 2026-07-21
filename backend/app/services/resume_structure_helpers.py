import re
from typing import Any

SECTION_ALIASES = {
    "summary": {
        "summary",
        "profile",
        "professional summary",
        "about",
    },
    "skills": {
        "skills",
        "technical skills",
        "core skills",
    },
    "education": {
        "education",
        "academic background",
    },
    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "internship",
        "internships",
        "virtual internship",
        "virtual internships",
    },
    "projects": {
        "projects",
        "project",
        "personal projects",
        "academic projects",
        "ai projects",
        "selected projects",
    },
    "certifications": {
        "certification",
        "certifications",
        "certificates",
    },
    "achievements": {
        "achievement",
        "achievements",
        "awards",
    },
}

BULLET_PATTERN = re.compile(
    r"^\s*(?:[-*?•·‣◦▪●]|â€¢|(?:\d+|[a-zA-Z])[\.)])\s+",
)
DATE_PATTERN = re.compile(
    r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{4}"
    r"|\b\d{4}\b",
    flags=re.IGNORECASE,
)
PROVIDER_NAMES = {
    "aws academy": ("AWS Academy", "virtual_internship"),
    "google for developers": ("Google for Developers", "virtual_internship"),
    "forage": ("Forage", "simulation"),
    "deloitte": ("Deloitte", "simulation"),
    "tcs": ("TCS", "simulation"),
    "british airways": ("British Airways", "simulation"),
}

SKILL_ALIASES = {
    "scikit learn": "scikit-learn",
    "scikit-learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "pytorch": "PyTorch",
    "py torch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tensor flow": "TensorFlow",
    "next js": "Next.js",
    "next.js": "Next.js",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "github": "GitHub",
}

SKILL_CATEGORIES = {
    "programming_languages": {
        "Python",
        "JavaScript",
        "TypeScript",
        "Java",
        "C++",
        "C#",
        "C",
        "Go",
        "Rust",
        "Ruby",
        "PHP",
        "Swift",
        "Kotlin",
        "SQL",
        "HTML",
        "CSS",
        "R",
    },
    "ml_ai": {
        "NumPy",
        "Pandas",
        "scikit-learn",
        "PyTorch",
        "TensorFlow",
        "Keras",
        "OpenCV",
        "NLTK",
        "Machine Learning",
        "Deep Learning",
    },
    "frameworks_libraries": {
        "React",
        "Next.js",
        "Node.js",
        "Express",
        "FastAPI",
        "Django",
        "Flask",
        "Spring",
        "Angular",
        "Vue",
        "Tailwind",
        "Bootstrap",
    },
    "tools_platforms": {
        "Git",
        "GitHub",
        "Jira",
        "Figma",
        "Linux",
        "Postman",
        "VS Code",
        "Power BI",
        "Tableau",
        "Excel",
    },
    "databases": {
        "PostgreSQL",
        "MongoDB",
        "MySQL",
        "Redis",
        "SQLite",
        "Firebase",
        "Supabase",
        "Neon",
    },
    "cloud_devops": {
        "AWS",
        "Azure",
        "GCP",
        "Docker",
        "Kubernetes",
        "Vercel",
        "Netlify",
        "CI/CD",
        "GitHub Actions",
    },
}

ALL_NORMALIZED_SKILLS = {
    skill.casefold(): skill
    for skills in SKILL_CATEGORIES.values()
    for skill in skills
}
for alias, canonical in SKILL_ALIASES.items():
    ALL_NORMALIZED_SKILLS[alias.casefold()] = canonical


def clean_line(line: str) -> str:
    return re.sub(r"\s+", " ", strip_bullet(line)).strip(" -\t")


def strip_bullet(line: str) -> str:
    return BULLET_PATTERN.sub("", line).strip()


def is_bullet_line(line: str) -> bool:
    return bool(BULLET_PATTERN.match(line))


def dedupe_strings(items: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for item in items:
        cleaned = clean_line(item)
        key = cleaned.casefold()
        if cleaned and key not in seen:
            seen.add(key)
            deduped.append(cleaned)
    return deduped


def normalize_heading(line: str) -> str:
    cleaned = strip_bullet(line).strip()
    cleaned = cleaned.rstrip(":").strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.casefold()


def section_key(line: str) -> str | None:
    normalized = normalize_heading(line)
    for key, aliases in SECTION_ALIASES.items():
        if normalized in aliases:
            return key
    return None


def is_section_heading(line: str) -> bool:
    return section_key(line) is not None


def split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {key: [] for key in SECTION_ALIASES}
    current: str | None = None
    for line in lines:
        key = section_key(line)
        if key:
            current = key
            continue
        cleaned = clean_line(line)
        if current and cleaned and not is_section_heading(cleaned):
            sections[current].append(line)
    return sections


def section_text(lines: list[str]) -> str | None:
    text = "\n".join(dedupe_strings(lines)).strip()
    return text or None


def line_items(lines: list[str]) -> list[str]:
    return [
        item for item in dedupe_strings(lines)
        if not is_section_heading(item)
    ]


def section_items(lines: list[str]) -> list[str]:
    items: list[str] = []
    for line in lines:
        cleaned = clean_line(line)
        parts = re.split(r"[,;]| \| ", cleaned)
        if len(parts) > 1:
            items.extend(parts)
        else:
            items.append(cleaned)
    return line_items(items)


def normalize_skill(value: str) -> str:
    cleaned = clean_line(value)
    simple = re.sub(r"[-_.]+", " ", cleaned).casefold()
    direct = SKILL_ALIASES.get(cleaned.casefold()) or SKILL_ALIASES.get(simple)
    if direct:
        return direct
    return ALL_NORMALIZED_SKILLS.get(cleaned.casefold(), cleaned)


def skill_keywords() -> list[str]:
    return sorted(
        set(ALL_NORMALIZED_SKILLS.values()),
        key=lambda value: value.casefold(),
    )


def extract_skills(text: str, explicit_skills: list[str]) -> dict[str, Any]:
    found: list[str] = []
    for keyword in skill_keywords():
        pattern = rf"(?<![A-Za-z0-9+#.]){re.escape(keyword)}(?![A-Za-z0-9+#])"
        if re.search(pattern, text, flags=re.IGNORECASE):
            found.append(keyword)

    normalized: dict[str, str] = {}
    for item in explicit_skills + found:
        canonical = normalize_skill(item)
        if canonical:
            normalized[canonical.casefold()] = canonical

    categorized = {
        key: []
        for key in (
            "programming_languages",
            "ml_ai",
            "frameworks_libraries",
            "tools_platforms",
            "databases",
            "cloud_devops",
            "other",
        )
    }
    category_lookup = {
        skill.casefold(): category
        for category, skills in SKILL_CATEGORIES.items()
        for skill in skills
    }
    for skill in normalized.values():
        categorized[category_lookup.get(skill.casefold(), "other")].append(skill)

    for category, values in categorized.items():
        categorized[category] = sorted(
            dedupe_strings(values),
            key=lambda value: value.casefold(),
        )

    flat = sorted(
        [
            skill
            for values in categorized.values()
            for skill in values
        ],
        key=lambda value: value.casefold(),
    )
    return {"flat": flat, "categorized": categorized}


def _is_possible_title(line: str) -> bool:
    cleaned = clean_line(line)
    if not cleaned or is_section_heading(cleaned):
        return False
    if _is_noise_line(cleaned):
        return False
    if re.match(r"^(?:technologies|tech stack|tools used)\b", cleaned, flags=re.IGNORECASE):
        return False
    if len(cleaned) > 90:
        return False
    if cleaned.endswith("."):
        return False
    if DATE_PATTERN.search(cleaned) and len(cleaned.split()) > 7:
        return False
    return len(cleaned.split()) <= 10


def _is_noise_line(line: str) -> bool:
    return bool(re.fullmatch(r"all projects\s*\^?", clean_line(line), flags=re.IGNORECASE))


def _technologies_from_text(text: str) -> list[str]:
    skills = extract_skills(text, [])
    return skills["flat"]


def _valid_project(project: dict[str, Any]) -> bool:
    return bool(project["name"].strip()) and bool(project["description"] or project["technologies"])


def group_projects(lines: list[str]) -> list[dict[str, Any]]:
    projects: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    def flush() -> None:
        nonlocal current
        if current:
            current["description"] = dedupe_strings(current["description"])
            project_text = " ".join([current["name"], *current["description"]])
            current["technologies"] = _technologies_from_text(project_text)
            if _valid_project(current):
                projects.append(current)
        current = None

    for raw_line in lines:
        if is_section_heading(raw_line):
            flush()
            break
        cleaned = clean_line(raw_line)
        if not cleaned:
            continue
        if _is_noise_line(cleaned):
            continue

        if not is_bullet_line(raw_line) and _is_possible_title(cleaned):
            flush()
            current = {"name": cleaned, "description": [], "technologies": []}
            continue

        if current is None:
            current = {"name": "Project", "description": [], "technologies": []}
        current["description"].append(cleaned)

    flush()
    return [
        project for project in projects
        if project["name"] != "Project" or project["description"]
    ]


def _provider_for_line(line: str) -> tuple[str | None, str | None]:
    lowered = line.casefold()
    for provider_key, provider_value in PROVIDER_NAMES.items():
        if provider_key in lowered:
            return provider_value
    return None, None


def _experience_type(section_name: str, header: str) -> str:
    lowered = f"{section_name} {header}".casefold()
    _, provider_type = _provider_for_line(header)
    if provider_type:
        return provider_type
    if "virtual" in lowered and "intern" in lowered:
        return "virtual_internship"
    if "intern" in lowered:
        return "internship"
    if "simulation" in lowered:
        return "simulation"
    return "job"


def _split_header(header: str) -> tuple[str, str]:
    organization, provider_type = _provider_for_line(header)
    if organization:
        role = "Virtual Internship" if provider_type == "virtual_internship" else "Simulation"
        return organization, role

    parts = [
        clean_line(part)
        for part in re.split(r"\s+[-|–—]\s+|\s+at\s+", header, maxsplit=1, flags=re.IGNORECASE)
        if clean_line(part)
    ]
    if len(parts) == 2:
        return parts[1], parts[0]
    return header, ""


def _date_range(header: str) -> tuple[str | None, str | None]:
    matches = DATE_PATTERN.findall(header)
    cleaned = [match.strip() for match in matches if match.strip()]
    if not cleaned:
        return None, None
    if len(cleaned) == 1:
        return cleaned[0], None
    return cleaned[0], cleaned[-1]


def _looks_like_date_line(line: str) -> bool:
    if not DATE_PATTERN.search(line):
        return False
    return not re.search(
        r"\b(?:developer|engineer|analyst|intern|simulation|project|built|designed)\b",
        line,
        flags=re.IGNORECASE,
    )


def _apply_experience_metadata(current: dict[str, Any], line: str) -> bool:
    if _looks_like_date_line(line):
        start_date, end_date = _date_range(line)
        current["start_date"] = current["start_date"] or start_date
        current["end_date"] = current["end_date"] or end_date
        return True

    lowered = line.casefold()
    if lowered in {"remote", "onsite", "hybrid"}:
        current["location"] = line
        return True

    if re.search(
        r"\b(?:intern|developer|engineer|analyst|simulation)\b",
        line,
        flags=re.IGNORECASE,
    ) and ("|" in line or " - " in line):
        parts = [clean_line(part) for part in re.split(r"\s*\|\s*|\s+-\s+", line)]
        if parts:
            current["role"] = parts[0]
        if len(parts) > 1:
            current["location"] = parts[-1]
        return True

    return False


def _is_experience_header(line: str, section_name: str) -> bool:
    cleaned = clean_line(line)
    if not cleaned or is_section_heading(cleaned):
        return False
    if DATE_PATTERN.fullmatch(cleaned) or cleaned.casefold() in {
        "remote",
        "onsite",
        "hybrid",
    }:
        return False
    if _provider_for_line(cleaned)[0]:
        return True
    lowered = f"{section_name} {cleaned}".casefold()
    role_words = ("intern", "developer", "engineer", "analyst", "trainee", "simulation")
    if any(word in lowered for word in role_words) and (
        DATE_PATTERN.search(cleaned)
        or re.search(r"\s[-|–—]\s|\sat\s", cleaned, flags=re.IGNORECASE)
    ):
        return True
    return False


def group_experience(lines: list[str], section_name: str = "experience") -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    def flush() -> None:
        nonlocal current
        if current:
            current["description"] = dedupe_strings(current["description"])
            if current["organization"] or current["role"] or current["description"]:
                entries.append(current)
        current = None

    for raw_line in lines:
        if is_section_heading(raw_line):
            flush()
            break
        cleaned = clean_line(raw_line)
        if not cleaned:
            continue

        if current is not None and not is_bullet_line(raw_line):
            if _apply_experience_metadata(current, cleaned):
                continue

        if _is_experience_header(raw_line, section_name):
            flush()
            organization, role = _split_header(cleaned)
            start_date, end_date = _date_range(cleaned)
            current = {
                "organization": organization,
                "role": role,
                "start_date": start_date,
                "end_date": end_date,
                "location": None,
                "description": [],
                "experience_type": _experience_type(section_name, cleaned),
            }
            continue

        if current is None:
            organization, role = _split_header(cleaned)
            current = {
                "organization": organization,
                "role": role,
                "start_date": None,
                "end_date": None,
                "location": None,
                "description": [],
                "experience_type": _experience_type(section_name, cleaned),
            }
        else:
            if (
                not is_bullet_line(raw_line)
                and current["role"] in {"Virtual Internship", "Simulation", ""}
                and re.search(r"\b(?:internship|simulation|developer|engineer|analyst)\b", cleaned, flags=re.IGNORECASE)
            ):
                current["role"] = cleaned
                continue
            current["description"].append(cleaned)

    flush()
    return entries


def certifications_from_sections(
    certification_lines: list[str],
    achievement_lines: list[str],
) -> list[str]:
    direct = line_items(certification_lines)
    if direct:
        return direct

    promoted: list[str] = []
    credential_words = (
        "certification",
        "certificate",
        "certified",
        "badge",
        "academy",
        "course",
        "credential",
    )
    competition_words = (
        "winner",
        "rank",
        "prize",
        "competition",
        "hackathon",
        "award",
    )
    for line in achievement_lines:
        cleaned = clean_line(line)
        lowered = cleaned.casefold()
        if any(word in lowered for word in competition_words):
            continue
        if any(word in lowered for word in credential_words) or _provider_for_line(cleaned)[0]:
            promoted.append(cleaned)
    return dedupe_strings(promoted)
