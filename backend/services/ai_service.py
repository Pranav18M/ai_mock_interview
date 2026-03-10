import json
import re
import asyncio
import httpx
from typing import List, Dict, Any
from config.database import get_settings

# Priority model list — tries each in order if quota exceeded
GEMINI_MODELS = [
    "gemini-1.5-flash",      # 1500 req/day free — primary
    "gemini-1.5-flash-8b",   # 1500 req/day free — fallback 1
    "gemini-1.0-pro",        # 60 req/min free   — fallback 2
]

# ---------------- GEMINI CALL ---------------- #

async def call_gemini(prompt: str, temperature: float = 0.7, model: str = None) -> str:
    settings = get_settings()
    key = settings.GEMINI_API_KEY.strip()
    if not key:
        raise Exception("GEMINI_API_KEY missing")

    models_to_try = [model] if model else GEMINI_MODELS

    for m in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 2000}
        }
        async with httpx.AsyncClient(timeout=55) as client:
            res = await client.post(url, json=payload)

        if res.status_code == 429:
            print(f"[Gemini] {m} quota exceeded, trying next model...")
            continue   # try next model

        if res.status_code != 200:
            raise Exception(f"Gemini HTTP error {res.status_code}: {res.text[:300]}")

        data = res.json()
        if "candidates" not in data:
            error_msg = data.get("error", {}).get("message", str(data))
            raise Exception(f"Gemini API error: {error_msg}")

        print(f"[Gemini] success with model: {m}")
        return data["candidates"][0]["content"]["parts"][0]["text"]

    # All models exhausted — raise friendly error
    raise Exception("QUOTA_EXCEEDED")


# ---------------- AI ROUTER ---------------- #

async def call_ai(prompt: str, temperature: float = 0.7) -> str:
    settings = get_settings()
    gemini_key = settings.GEMINI_API_KEY.strip()
    if gemini_key.startswith("AIza"):
        return await call_gemini(prompt, temperature)
    raise Exception("No valid AI API key found.")


async def call_ai_safe(prompt: str, temperature: float = 0.7, fallback: str = "{}") -> str:
    """Like call_ai but returns fallback string instead of raising on quota error."""
    try:
        return await call_ai(prompt, temperature)
    except Exception as e:
        if "QUOTA_EXCEEDED" in str(e) or "429" in str(e):
            print("[AI] All Gemini quotas exceeded — using fallback response")
            return fallback
        raise


# ---------------- GREETING ---------------- #

async def generate_greeting(user_name: str, role: str, difficulty: str) -> str:
    prompt = f"""You are a warm, professional AI interviewer starting a mock interview.
Candidate name: {user_name}
Role: {role}
Level: {difficulty}

Write a SHORT friendly greeting (2-3 sentences) that:
1. Says "Good morning/afternoon {user_name}!"
2. Welcomes them to the {role} mock interview
3. Asks them to introduce themselves and share their background

Return ONLY the greeting text. Nothing else."""
    try:
        return await call_ai(prompt, 0.8)
    except:
        return f"Good morning {user_name}! Welcome to your {role} mock interview at {difficulty} level. Before we begin with the technical questions, could you please introduce yourself and tell me a bit about your background and experience?"


# ---------------- INTRO RESPONSE ---------------- #

async def generate_intro_response(user_intro: str, user_name: str, role: str) -> str:
    prompt = f"""You are a professional AI interviewer. Candidate {user_name} just introduced themselves.

Their introduction: "{user_intro[:500]}"

Write a SHORT warm response (1-2 sentences) that:
1. Acknowledges something specific they said positively
2. Says you will now ask 5 technical questions for the {role} role

Return ONLY the response text. Nothing else."""
    try:
        return await call_ai(prompt, 0.8)
    except:
        return f"Thank you {user_name}, that's a great background! Now let's move on to the 5 technical questions for your {role} interview."


# ---------------- QUESTION GENERATION ---------------- #

FALLBACK_QUESTIONS: Dict[str, List[str]] = {
    "Frontend Developer": [
        "Explain the difference between `==` and `===` in JavaScript and when to use each.",
        "What is the Virtual DOM in React and how does it improve performance?",
        "How do you implement responsive design? Explain CSS Flexbox vs Grid.",
        "Describe a React project you built — what state management approach did you use and why?",
        "What are React Hooks? Explain `useState` and `useEffect` with examples.",
    ],
    "Backend Developer": [
        "What is the difference between REST and GraphQL APIs? When would you choose each?",
        "Explain database indexing — how does it work and when should you use it?",
        "How do you handle authentication and authorization in a backend API?",
        "Describe a backend project you built — what was the biggest technical challenge?",
        "What is the difference between SQL and NoSQL databases? Give examples of when to use each.",
    ],
    "Full Stack Developer": [
        "Walk me through building a full-stack feature end-to-end from database to UI.",
        "How do you handle state management across a full-stack React + Node.js app?",
        "Explain the difference between server-side rendering (SSR) and client-side rendering (CSR).",
        "Describe a full-stack project you built — what tech stack did you choose and why?",
        "How do you secure a REST API? Explain the JWT authentication flow.",
    ],
    "Python Developer": [
        "What are Python decorators? Write an example of a custom decorator.",
        "Explain the difference between `list`, `tuple`, and `set` in Python.",
        "How does async/await work in Python? When would you use `asyncio`?",
        "Describe a Python project you built — what libraries or frameworks did you use?",
        "What is the difference between Django and FastAPI? When would you choose each?",
    ],
    "Java Developer": [
        "Explain the difference between `abstract class` and `interface` in Java.",
        "What is Spring Boot auto-configuration and how does it work?",
        "How does garbage collection work in the JVM?",
        "Describe a Java Spring project you built — what modules did you use?",
        "What is the difference between `HashMap` and `ConcurrentHashMap`?",
    ],
    "Data Scientist": [
        "Explain the bias-variance tradeoff in machine learning.",
        "What is the difference between supervised and unsupervised learning?",
        "How do you handle missing data in a dataset?",
        "Describe an ML project you built — what model did you use and what accuracy did you achieve?",
        "What is overfitting? How do you detect and prevent it?",
    ],
    "DevOps Engineer": [
        "What is CI/CD? Describe a pipeline you have set up.",
        "Explain the difference between Docker containers and virtual machines.",
        "How does Kubernetes work? What problems does it solve?",
        "Describe an infrastructure challenge you solved — what tools did you use?",
        "What is Infrastructure as Code (IaC)? Have you used Terraform or Ansible?",
    ],
    "Mobile Developer": [
        "Explain the difference between React Native and Flutter.",
        "How do you handle offline functionality in a mobile app?",
        "What is the mobile app lifecycle? Explain foreground vs background states.",
        "Describe a mobile app you built — what was the biggest technical challenge?",
        "How do you optimize mobile app performance and reduce battery drain?",
    ],
}

def get_fallback_questions(role: str) -> List[str]:
    for key, questions in FALLBACK_QUESTIONS.items():
        if key.lower() in role.lower() or role.lower() in key.lower():
            return questions
    return [
        f"Tell me about your experience in {role} development.",
        f"What are the key principles you follow in {role}?",
        "Describe the most challenging project you've worked on.",
        "How do you approach debugging a complex problem?",
        "How do you keep up with new technologies in your field?",
    ]


async def generate_questions(
    role: str,
    difficulty: str,
    skills: List[str],
    projects: List[str],
    experience: List[str],
) -> List[str]:
    skills_str   = ", ".join(skills[:10])  if skills   else "general programming"
    projects_str = "; ".join(projects[:3]) if projects else "no projects listed"
    prompt = f"""
Generate exactly 5 interview questions for a {difficulty} level {role} candidate.

Candidate skills: {skills_str}
Projects: {projects_str}

Rules:
- At least one question about their projects/experience
- Mix conceptual + practical + behavioral questions
- Match {difficulty} level difficulty
- Return ONLY a JSON array of 5 strings, no markdown

["Q1","Q2","Q3","Q4","Q5"]
"""
    try:
        content = await call_ai(prompt)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            questions = json.loads(match.group())
            if isinstance(questions, list) and len(questions) >= 3:
                return questions[:5]
    except Exception as e:
        if "QUOTA_EXCEEDED" in str(e) or "429" in str(e):
            print(f"[generate_questions] Quota exceeded — using built-in fallback questions for {role}")
        else:
            print(f"[generate_questions] AI error: {e} — using fallback")
    return get_fallback_questions(role)


# ---------------- ANSWER EVALUATION ---------------- #

async def evaluate_answer(question: str, answer: str, role: str) -> Dict[str, Any]:
    if not answer or len(answer.strip()) < 5:
        return {"technical_knowledge": 0, "communication": 0, "relevance": 0, "overall": 0, "feedback": "No answer provided."}
    prompt = f"""
Evaluate this interview answer.

Role: {role}
Question: {question}
Answer: {answer}

Return JSON only:
{{"technical_knowledge":7,"communication":7,"relevance":7,"overall":7.0,"feedback":"short feedback here"}}
"""
    try:
        content = await call_ai(prompt, 0.3)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\{.*?\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            tk = float(result.get("technical_knowledge", 5))
            cm = float(result.get("communication", 5))
            rv = float(result.get("relevance", 5))
            return {"technical_knowledge": tk, "communication": cm, "relevance": rv,
                    "overall": round((tk+cm+rv)/3, 1), "feedback": result.get("feedback", "Good attempt.")}
    except Exception as e:
        print("Evaluation error:", e)
    return {"technical_knowledge": 5, "communication": 5, "relevance": 5, "overall": 5, "feedback": "Answer recorded."}


# ---------------- FINAL FEEDBACK ---------------- #

async def generate_final_feedback(
    role: str, questions: List[str], answers: List[str], scores: List[Dict[str, Any]]
) -> Dict[str, Any]:
    avg = round(sum(s["overall"] for s in scores) / len(scores), 1) if scores else 0
    prompt = f"""
Generate interview feedback for a {role} candidate.
Average Score: {avg}/10

Return JSON only:
{{
"overall_score": {avg},
"strengths":["s1","s2","s3"],
"areas_for_improvement":["a1","a2","a3"],
"skill_suggestions":["t1","t2","t3"],
"recommended_topics":["r1","r2","r3"],
"motivational_message":"short encouraging message"
}}
"""
    try:
        content = await call_ai(prompt, 0.4)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            result["overall_score"] = avg
            return result
    except Exception as e:
        print("Feedback error:", e)
    return {
        "overall_score": avg,
        "strengths": ["Completed interview", "Attempted all answers", "Basic understanding shown"],
        "areas_for_improvement": ["Improve explanation clarity", "Practice more interviews", "Deepen technical knowledge"],
        "skill_suggestions": ["Build more projects", "Study fundamentals", "Practice DSA daily"],
        "recommended_topics": ["Data Structures", "System Design", "Communication skills", f"Advanced {role} concepts"],
        "motivational_message": "Keep practicing and you'll see great improvement!"
    }


# ---------------- ROLE-SPECIFIC ATS CONTEXT ---------------- #

ROLE_ATS_CONTEXT = {
    "frontend developer": {
        "focus": "UI/UX, browser performance, component architecture, accessibility",
        "key_skills": "React, JavaScript, TypeScript, HTML5, CSS3, Responsive Design, Webpack, Git, REST API integration, Cross-browser compatibility",
        "irrelevant": "Docker, Kubernetes, AWS infrastructure, server management, database administration",
        "good_improvements": [
            "Add CSS frameworks like Tailwind or Bootstrap",
            "Mention state management tools like Redux or Zustand",
            "Add performance metrics like Lighthouse scores or page load improvements",
            "Include accessibility (WCAG) experience if any",
            "Mention browser compatibility testing experience"
        ]
    },
    "backend developer": {
        "focus": "APIs, databases, server architecture, security, performance",
        "key_skills": "REST API, Node.js/Python/Java, SQL, PostgreSQL, MongoDB, Docker, Git, Authentication, Caching",
        "irrelevant": "CSS animations, Figma, UI design, mobile layouts",
        "good_improvements": [
            "Quantify API performance (e.g. 99.9% uptime, 1M requests/day)",
            "Add database optimization experience",
            "Mention security practices like JWT, OAuth",
            "Include testing frameworks like Jest or PyTest",
            "Add caching strategies (Redis, Memcached)"
        ]
    },
    "full stack developer": {
        "focus": "End-to-end development, frontend + backend integration, deployment",
        "key_skills": "React, Node.js, SQL/NoSQL, REST API, Git, Docker, HTML, CSS, JavaScript",
        "irrelevant": "Highly specialized infra like Kubernetes at scale",
        "good_improvements": [
            "Show both frontend and backend projects clearly",
            "Mention deployment experience (Vercel, Heroku, AWS basics)",
            "Add database design experience",
            "Include API integration projects",
            "Show full-stack project with both client and server"
        ]
    },
    "java developer": {
        "focus": "OOP, Spring ecosystem, enterprise patterns, JVM performance",
        "key_skills": "Java, Spring Boot, Spring MVC, Hibernate, JPA, Maven, SQL, REST API, JUnit, Git",
        "irrelevant": "JavaScript frameworks, CSS, mobile-specific tools",
        "good_improvements": [
            "Mention Java version (Java 11/17/21)",
            "Add design patterns used (Singleton, Factory, etc.)",
            "Include microservices experience with Spring Cloud",
            "Add unit testing with JUnit and Mockito",
            "Mention build tools — Maven or Gradle"
        ]
    },
    "python developer": {
        "focus": "Python ecosystem, scripting, APIs, data handling",
        "key_skills": "Python, Django/FastAPI/Flask, REST API, SQL, Git, OOP, Pandas, NumPy",
        "irrelevant": "Java Spring, .NET, iOS development",
        "good_improvements": [
            "Specify Python frameworks used (Django, FastAPI, Flask)",
            "Add data processing experience if any",
            "Include virtual environment and packaging tools",
            "Add async programming experience",
            "Mention testing with pytest"
        ]
    },
    "data scientist": {
        "focus": "ML models, data analysis, statistical methods, model deployment",
        "key_skills": "Python, Machine Learning, Statistics, SQL, Pandas, NumPy, Scikit-learn, TensorFlow/PyTorch, Jupyter",
        "irrelevant": "Web development, CSS, mobile development",
        "good_improvements": [
            "Add specific ML models used (Random Forest, XGBoost, etc.)",
            "Quantify model accuracy or business impact",
            "Include data preprocessing and feature engineering",
            "Mention model deployment experience (MLflow, FastAPI)",
            "Add visualization tools (Matplotlib, Seaborn, Tableau)"
        ]
    },
    "devops engineer": {
        "focus": "CI/CD, infrastructure, containerization, monitoring, automation",
        "key_skills": "Docker, Kubernetes, CI/CD, AWS/GCP/Azure, Linux, Git, Terraform, Ansible, Monitoring",
        "irrelevant": "Frontend UI development, mobile apps, graphic design",
        "good_improvements": [
            "Quantify infrastructure improvements (e.g. deployment time reduced by 60%)",
            "Add specific cloud services used (EC2, S3, Lambda)",
            "Include monitoring tools (Prometheus, Grafana, ELK)",
            "Mention IaC tools (Terraform, CloudFormation)",
            "Add incident response and on-call experience"
        ]
    },
    "mobile developer": {
        "focus": "Mobile UI, platform APIs, app performance, store publishing",
        "key_skills": "React Native/Flutter/Swift/Kotlin, Mobile UI, REST API, Git, Firebase, App Store deployment",
        "irrelevant": "Backend server management, Kubernetes, heavy data science",
        "good_improvements": [
            "Mention app store publishing experience",
            "Add performance metrics (app load time, crash rate)",
            "Include offline functionality or caching",
            "Add push notification implementation",
            "Mention device compatibility testing"
        ]
    },
    "web developer": {
        "focus": "Web technologies, browser compatibility, responsive design, CMS",
        "key_skills": "HTML5, CSS3, JavaScript, Git, Responsive Design, REST API, WordPress/CMS",
        "irrelevant": "Deep backend infrastructure, Kubernetes, ML models",
        "good_improvements": [
            "Add SEO optimization experience",
            "Mention page speed and Core Web Vitals",
            "Include CMS experience (WordPress, Strapi)",
            "Add cross-browser testing tools",
            "Mention web accessibility standards"
        ]
    },
}

def get_role_context(role: str) -> dict:
    role_lower = role.lower().strip()
    for key, val in ROLE_ATS_CONTEXT.items():
        if key in role_lower or role_lower in key:
            return val
    return {
        "focus": "general software development",
        "key_skills": "Programming, Git, API, Problem Solving, Communication",
        "irrelevant": "highly specialized niche tools unrelated to the role",
        "good_improvements": [
            "Add quantified achievements with metrics",
            "Include relevant technical skills for the role",
            "Add professional summary at the top",
            "Show project impact clearly",
            "Use action verbs throughout"
        ]
    }


# ---------------- ATS SCORE ANALYSIS (ROLE-AWARE) ---------------- #

ATS_MODEL_RESUME = """
PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience building scalable applications.
Proven track record delivering high-quality solutions using modern technologies and Agile methodologies.

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, Java, SQL
Frameworks: React, Node.js, FastAPI, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
Cloud & DevOps: AWS, Docker, Git, GitHub Actions
Tools: VS Code, Postman, Jira, Linux

PROFESSIONAL EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2022 - Present
- Developed APIs serving 1M+ daily requests with 99.9% uptime
- Led migration reducing deployment time by 60%
- Mentored 3 junior developers improving code quality by 40%

EDUCATION
B.E. Computer Science | State University | 2020 | GPA: 8.5/10

PROJECTS
E-Commerce Platform | React, Node.js, MongoDB
- Full-stack app with payment integration, 500+ daily transactions

CERTIFICATIONS
- AWS Certified Developer
"""

async def analyze_ats_score(resume_text: str, role: str = "software developer") -> Dict[str, Any]:
    role_ctx = get_role_context(role)

    prompt = f"""You are an expert ATS (Applicant Tracking System) analyzer and senior IT recruiter.

The candidate is applying for: {role.upper()}

For this role, focus on: {role_ctx['focus']}
Key skills expected: {role_ctx['key_skills']}
NOTE: Do NOT suggest {role_ctx['irrelevant']} — these are NOT relevant for {role}.

Compare against this reference profile:
{ATS_MODEL_RESUME}

CANDIDATE RESUME:
{resume_text[:3500]}

Analyze the resume specifically for a {role} position.
Give improvement suggestions ONLY relevant to {role} — do NOT suggest unrelated technologies.

Return ONLY valid JSON (no markdown):
{{
  "overall_score": <1-10>,
  "section_scores": {{
    "contact_info": <0-10>,
    "summary": <0-10>,
    "skills": <0-10>,
    "experience": <0-10>,
    "education": <0-10>,
    "projects": <0-10>,
    "certifications": <0-10>,
    "formatting": <0-10>
  }},
  "keywords_found": ["role-relevant keyword found in resume"],
  "keywords_missing": ["role-relevant keyword missing from resume — only for {role}"],
  "strengths": ["specific strength relevant to {role}"],
  "improvements": [
    {{"section": "Skills", "issue": "specific issue for {role}", "fix": "specific fix for {role} — no irrelevant tech"}},
    {{"section": "Experience", "issue": "specific issue", "fix": "specific fix with metric example"}},
    {{"section": "Summary", "issue": "specific issue", "fix": "specific fix"}},
    {{"section": "Projects", "issue": "specific issue for {role}", "fix": "specific fix"}}
  ],
  "ats_verdict": "Likely to Pass",
  "summary": "2-3 sentence assessment specifically for {role} position"
}}

For ats_verdict use exactly: "Likely to Pass", "Needs Improvement", or "Unlikely to Pass"
"""
    try:
        content = await call_ai(prompt, 0.3)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            # Post-process: filter out irrelevant keywords from missing list
            irrelevant_words = role_ctx['irrelevant'].lower().split(', ')
            if 'keywords_missing' in result:
                result['keywords_missing'] = [
                    k for k in result['keywords_missing']
                    if not any(irr in k.lower() for irr in irrelevant_words)
                ]
            return result
    except Exception as e:
        print(f"ATS error: {e}")

    return {
        "overall_score": 5.0,
        "section_scores": {"contact_info": 5, "summary": 4, "skills": 6, "experience": 5,
                           "education": 6, "projects": 4, "certifications": 2, "formatting": 6},
        "keywords_found": [],
        "keywords_missing": role_ctx['key_skills'].split(', ')[:5],
        "strengths": ["Has relevant experience", "Includes project section", "Clear education"],
        "improvements": [
            {"section": "Summary", "issue": "No professional summary", "fix": f"Add a 2-3 line summary highlighting your {role} experience"},
            {"section": "Experience", "issue": "No metrics", "fix": "Add numbers like '40% improvement', 'built X feature'"},
            {"section": "Skills", "issue": f"Missing key {role} skills", "fix": f"Add: {role_ctx['key_skills'][:100]}"},
            {"section": "Projects", "issue": "Projects lack detail", "fix": f"Show {role}-specific tech stack and impact clearly"}
        ],
        "ats_verdict": "Needs Improvement",
        "summary": f"Resume needs optimization for {role} position. Add role-specific keywords and quantify achievements."
    }