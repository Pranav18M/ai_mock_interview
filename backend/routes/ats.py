from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from utils.jwt_handler import get_current_user
from services.resume_parser import parse_resume
from services.ai_service import analyze_ats_score
import re
from typing import Optional

router = APIRouter(prefix="/ats", tags=["ATS"])

# ─── Role-specific keyword config ───
ROLE_KEYWORDS = {
    "frontend developer": {
        "must_have": ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive"],
        "good_to_have": ["TypeScript", "Redux", "Next.js", "Tailwind", "Webpack", "Figma", "REST API", "Vue", "Angular"],
        "never_suggest": ["Docker", "Kubernetes", "AWS", "CI/CD", "server", "database admin", "Linux infra"]
    },
    "backend developer": {
        "must_have": ["API", "REST", "Database", "SQL", "Server", "Git"],
        "good_to_have": ["Node.js", "Python", "Java", "Docker", "PostgreSQL", "MongoDB", "Redis", "Microservices", "Authentication"],
        "never_suggest": ["CSS animations", "Figma", "UI design", "mobile layouts"]
    },
    "full stack developer": {
        "must_have": ["Frontend", "Backend", "API", "Database", "JavaScript", "Git"],
        "good_to_have": ["React", "Node.js", "MongoDB", "PostgreSQL", "Docker", "TypeScript", "REST", "Deployment"],
        "never_suggest": ["highly specialized infra only"]
    },
    "java developer": {
        "must_have": ["Java", "Spring", "OOP", "Maven", "SQL", "Git"],
        "good_to_have": ["Spring Boot", "Hibernate", "JPA", "Microservices", "JUnit", "REST API", "Docker"],
        "never_suggest": ["JavaScript frameworks", "CSS", "React", "mobile-only tools"]
    },
    "python developer": {
        "must_have": ["Python", "Git", "API", "SQL", "OOP"],
        "good_to_have": ["Django", "FastAPI", "Flask", "Pandas", "NumPy", "REST", "PostgreSQL", "pytest"],
        "never_suggest": ["Java Spring", ".NET", "iOS development", "Kubernetes at scale"]
    },
    "data scientist": {
        "must_have": ["Python", "Machine Learning", "Statistics", "SQL", "Data Analysis"],
        "good_to_have": ["TensorFlow", "PyTorch", "Pandas", "Scikit-learn", "Jupyter", "NumPy", "NLP", "Visualization"],
        "never_suggest": ["Docker infrastructure", "CSS", "Web UI", "mobile development"]
    },
    "devops engineer": {
        "must_have": ["Docker", "CI/CD", "Linux", "Git", "Cloud"],
        "good_to_have": ["Kubernetes", "AWS", "Terraform", "Jenkins", "Ansible", "Monitoring", "Bash", "GitHub Actions"],
        "never_suggest": ["CSS animations", "React UI", "mobile app development"]
    },
    "mobile developer": {
        "must_have": ["Mobile", "Git", "API", "UI"],
        "good_to_have": ["React Native", "Flutter", "Firebase", "Swift", "Kotlin", "REST API", "App Store", "Push Notifications"],
        "never_suggest": ["Kubernetes", "heavy backend infra", "data science", "server management"]
    },
    "web developer": {
        "must_have": ["HTML", "CSS", "JavaScript", "Git", "Responsive"],
        "good_to_have": ["React", "WordPress", "PHP", "REST API", "MySQL", "SEO", "TypeScript"],
        "never_suggest": ["Docker orchestration", "ML models", "Kubernetes", "deep backend infra"]
    },
}

def get_role_keywords(role: str) -> dict:
    role_lower = role.lower().strip()
    for key in ROLE_KEYWORDS:
        if key in role_lower or role_lower in key:
            return ROLE_KEYWORDS[key]
    return {
        "must_have": ["Git", "API", "Communication", "Problem Solving"],
        "good_to_have": ["Agile", "REST", "SQL", "Documentation"],
        "never_suggest": []
    }

def check_formatting(raw_text: str) -> dict:
    issues = []
    score = 10
    words = raw_text.split()

    if len(words) < 150:
        issues.append("Resume too short — aim for 400–600 words")
        score -= 2
    elif len(words) > 1000:
        issues.append("Resume may be too long — keep it to 1–2 pages")
        score -= 1

    sections = ["experience", "education", "skills", "project"]
    missing_sections = [s for s in sections if s not in raw_text.lower()]
    if missing_sections:
        issues.append(f"Missing sections: {', '.join(missing_sections)}")
        score -= len(missing_sections)

    has_email = bool(re.search(r'[\w.+-]+@[\w-]+\.\w+', raw_text))
    has_phone = bool(re.search(r'[\+\d][\d\s\-\(\)]{8,}', raw_text))
    if not has_email:
        issues.append("No email address found")
        score -= 1
    if not has_phone:
        issues.append("No phone number found")
        score -= 1

    action_verbs = ["developed","built","implemented","designed","led","managed","created","improved","optimized","achieved"]
    found_verbs = [v for v in action_verbs if v in raw_text.lower()]
    if len(found_verbs) < 3:
        issues.append("Use more action verbs: Developed, Built, Led, Implemented, Optimized")
        score -= 1

    has_numbers = bool(re.search(r'\d+%|\d+\+|\d+x|\$\d+', raw_text))
    if not has_numbers:
        issues.append("No quantified achievements — add metrics like '40% faster', '10K users'")
        score -= 1

    return {
        "score": max(score, 0),
        "issues": issues,
        "word_count": len(words),
        "has_email": has_email,
        "has_phone": has_phone,
        "action_verbs_found": found_verbs,
    }

def check_grammar_basic(raw_text: str) -> dict:
    issues = []
    score = 10

    first_person = re.findall(r'\bI\b|\bme\b|\bmy\b|\bmine\b|\bmyself\b', raw_text, re.IGNORECASE)
    if len(first_person) > 3:
        issues.append(f"Avoid first-person pronouns (I, me, my) — found {len(first_person)} times. Resumes should use implied subject.")
        score -= 2

    common_typos = {
        "recieve":"receive","accomodate":"accommodate","seperate":"separate",
        "occured":"occurred","sucessful":"successful","managment":"management",
        "expereince":"experience","developement":"development","programing":"programming",
        "algorthm":"algorithm","databse":"database","languege":"language",
        "implimentation":"implementation","knowlege":"knowledge","enviroment":"environment",
    }
    found_typos = {t: c for t, c in common_typos.items() if t in raw_text.lower()}
    if found_typos:
        score -= len(found_typos)
        typo_list = [f"'{t}' → '{c}'" for t, c in found_typos.items()]
        issues.append(f"Spelling errors found: {', '.join(typo_list)}")

    present_tense = re.findall(r'\b(manage|develop|build|create|lead|work|implement|maintain)\b', raw_text, re.IGNORECASE)
    if len(present_tense) > 4:
        issues.append("Use past tense for previous roles — 'Developed' not 'Develop', 'Managed' not 'Manage'")
        score -= 1

    return {
        "score": max(score, 0),
        "issues": issues,
        "first_person_count": len(first_person),
        "typos_found": found_typos,
    }

def check_role_keywords(raw_text: str, role: str) -> dict:
    kw = get_role_keywords(role)
    text_lower = raw_text.lower()

    found_must    = [k for k in kw["must_have"]    if k.lower() in text_lower]
    missing_must  = [k for k in kw["must_have"]    if k.lower() not in text_lower]
    found_good    = [k for k in kw["good_to_have"] if k.lower() in text_lower]
    missing_good  = [k for k in kw["good_to_have"] if k.lower() not in text_lower]

    score = 10 - (len(missing_must) * 1.5) - (len(missing_good) * 0.3)

    return {
        "score": round(min(max(score, 0), 10), 1),
        "must_have_found":     found_must,
        "must_have_missing":   missing_must,
        "good_to_have_found":  found_good,
        "good_to_have_missing": missing_good[:5],
    }


@router.post("/analyze")
async def analyze_resume_ats(
    file: UploadFile = File(...),
    role: Optional[str] = Form(default="software developer"),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")

    try:
        skills, projects, experience, raw_text = parse_resume(content)

        if not raw_text or len(raw_text.strip()) < 50:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        role = role or "software developer"

        # ── Local checks ──
        formatting = check_formatting(raw_text)
        grammar    = check_grammar_basic(raw_text)
        role_kw    = check_role_keywords(raw_text, role)

        # ── AI deep analysis (role-aware) ──
        ai_result = await analyze_ats_score(raw_text, role)

        # ── Filter out irrelevant keywords from AI result ──
        kw_config     = get_role_keywords(role)
        never_suggest = [n.lower() for n in kw_config.get("never_suggest", [])]

        if "keywords_missing" in ai_result:
            ai_result["keywords_missing"] = [
                k for k in ai_result["keywords_missing"]
                if not any(bad in k.lower() for bad in never_suggest)
            ]

        if "improvements" in ai_result:
            filtered = []
            for imp in ai_result["improvements"]:
                fix_lower = imp.get("fix", "").lower()
                issue_lower = imp.get("issue", "").lower()
                # Drop any improvement that mentions irrelevant tech
                if any(bad in fix_lower or bad in issue_lower for bad in never_suggest):
                    continue
                filtered.append(imp)
            ai_result["improvements"] = filtered

        # ── Attach local check results ──
        ai_result["formatting_check"] = formatting
        ai_result["grammar_check"]    = grammar
        ai_result["role_keywords"]    = role_kw
        ai_result["role"]             = role

        # ── Recalculate combined score ──
        ai_score   = float(ai_result.get("overall_score", 5))
        fmt_score  = formatting["score"]
        gram_score = grammar["score"]
        kw_score   = role_kw["score"]
        combined   = round(ai_score*0.5 + fmt_score*0.2 + gram_score*0.15 + kw_score*0.15, 1)
        ai_result["overall_score"] = min(combined, 10)

        # ── Append local formatting/grammar issues as extra improvements ──
        extra = []
        for issue in formatting["issues"][:2]:
            extra.append({"section": "Formatting", "issue": issue, "fix": "Fix this to improve ATS readability and recruiter first impression"})
        for issue in grammar["issues"][:2]:
            extra.append({"section": "Grammar", "issue": issue, "fix": "Fix this to appear more professional to recruiters"})
        ai_result["improvements"] = ai_result.get("improvements", []) + extra

        return ai_result

    except HTTPException:
        raise
    except Exception as e:
        print("ATS route error:", e)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")