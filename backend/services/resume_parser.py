import pdfplumber
import re
from typing import List, Tuple
import io


SKILL_KEYWORDS = [
    "python", "javascript", "typescript", "react", "angular", "vue", "node.js", "nodejs",
    "fastapi", "django", "flask", "express", "spring", "java", "c++", "c#", "go", "rust",
    "sql", "mongodb", "postgresql", "mysql", "redis", "docker", "kubernetes", "aws", "gcp",
    "azure", "git", "linux", "rest", "graphql", "machine learning", "deep learning",
    "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "html", "css", "tailwind",
    "bootstrap", "sass", "webpack", "vite", "next.js", "nextjs", "flutter", "react native",
    "swift", "kotlin", "android", "ios", "devops", "ci/cd", "jenkins", "nginx", "kafka",
    "rabbitmq", "elasticsearch", "firebase", "supabase", "php", "laravel", "ruby", "rails"
]


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found_skills = []
    for skill in SKILL_KEYWORDS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title() if len(skill) > 3 else skill.upper())
    return list(set(found_skills))


def extract_projects(text: str) -> List[str]:
    projects = []
    lines = text.split("\n")
    in_projects = False
    project_headers = ["project", "projects", "personal projects", "academic projects", "side projects"]
    stop_headers = ["experience", "education", "skills", "certification", "award", "publication"]

    for i, line in enumerate(lines):
        line_stripped = line.strip()
        line_lower = line_stripped.lower()

        if any(h in line_lower for h in project_headers) and len(line_stripped) < 40:
            in_projects = True
            continue

        if in_projects and any(h in line_lower for h in stop_headers) and len(line_stripped) < 40:
            break

        if in_projects and line_stripped and len(line_stripped) > 10:
            # Capture lines that look like project titles (capitalized, not too long)
            if not line_stripped.startswith(("•", "-", "*", "·")) and len(line_stripped) < 80:
                projects.append(line_stripped)
            elif line_stripped.startswith(("•", "-", "*", "·")):
                clean = line_stripped.lstrip("•-*· ").strip()
                if clean and len(clean) > 10:
                    projects.append(clean)

    # Fallback: look for lines with "project" keyword
    if not projects:
        for line in lines:
            if "project" in line.lower() and len(line.strip()) > 15 and len(line.strip()) < 100:
                projects.append(line.strip())

    return projects[:6]  # Return max 6 projects


def extract_experience(text: str) -> List[str]:
    experience = []
    lines = text.split("\n")
    in_experience = False
    exp_headers = ["experience", "work experience", "employment", "professional experience", "internship"]
    stop_headers = ["education", "skills", "projects", "certification", "award", "publication", "summary"]

    for line in lines:
        line_stripped = line.strip()
        line_lower = line_stripped.lower()

        if any(h in line_lower for h in exp_headers) and len(line_stripped) < 40:
            in_experience = True
            continue

        if in_experience and any(h in line_lower for h in stop_headers) and len(line_stripped) < 40:
            break

        if in_experience and line_stripped and len(line_stripped) > 15:
            experience.append(line_stripped)

    return experience[:8]  # Return max 8 experience lines


def parse_resume(file_bytes: bytes) -> Tuple[List[str], List[str], List[str], str]:
    raw_text = extract_text_from_pdf(file_bytes)
    skills = extract_skills(raw_text)
    projects = extract_projects(raw_text)
    experience = extract_experience(raw_text)
    return skills, projects, experience, raw_text