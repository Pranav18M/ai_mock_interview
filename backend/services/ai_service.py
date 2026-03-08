import json
import re
import httpx
from typing import List, Dict, Any
from config.database import get_settings


async def call_gemini(prompt: str) -> str:
    settings = get_settings()
    key = settings.GEMINI_API_KEY.strip()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1000}
    }
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(url, json=payload)
        data = res.json()
        if "candidates" not in data:
            error_msg = data.get("error", {}).get("message", str(data))
            raise Exception(f"Gemini API error: {error_msg}")
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def call_ai(prompt: str, temperature: float = 0.7) -> str:
    settings = get_settings()
    gemini_key = settings.GEMINI_API_KEY.strip()
    openai_key = settings.OPENAI_API_KEY.strip()

    if gemini_key.startswith("AIza"):
        return await call_gemini(prompt)
    elif openai_key.startswith("sk-"):
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=openai_key)
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=1000,
        )
        return response.choices[0].message.content.strip()
    else:
        raise Exception("No valid API key found. Set GEMINI_API_KEY in .env")


async def generate_questions(
    role: str,
    difficulty: str,
    skills: List[str],
    projects: List[str],
    experience: List[str],
) -> List[str]:
    skills_str = ", ".join(skills[:10]) if skills else "general programming"
    projects_str = "; ".join(projects[:3]) if projects else "no specific projects"

    prompt = f"""You are a senior technical interviewer. Generate exactly 5 interview questions for a {role} position at {difficulty} level.

Candidate Skills: {skills_str}
Candidate Projects: {projects_str}

Rules:
1. Match {difficulty} difficulty
2. At least 1 question must relate to candidate projects
3. Mix conceptual, practical, and behavioral questions
4. Each question must end with a question mark

Return ONLY a valid JSON array of exactly 5 strings. No explanation. No markdown. No backticks:
["question1", "question2", "question3", "question4", "question5"]"""

    content = await call_ai(prompt)
    content = re.sub(r'```json|```', '', content).strip()

    match = re.search(r'\[.*\]', content, re.DOTALL)
    if match:
        try:
            questions = json.loads(match.group())
            if isinstance(questions, list) and len(questions) >= 3:
                return questions[:5]
        except:
            pass

    # Fallback: extract lines that look like questions
    lines = []
    for l in content.split('\n'):
        l = l.strip().lstrip('0123456789.-) "\'').rstrip('"\' ').strip()
        if len(l) > 15 and ('?' in l or len(l) > 30):
            lines.append(l)

    if len(lines) >= 3:
        return lines[:5]

    # Final fallback
    return [
        f"Can you explain your experience with {role} development?",
        f"What are the core principles you follow in {role}?",
        f"Describe a challenging project from your resume and how you solved it.",
        f"How do you approach debugging and problem-solving in your work?",
        f"What areas are you actively improving in as a {role}?",
    ]


async def evaluate_answer(question: str, answer: str, role: str) -> Dict[str, Any]:
    if not answer or len(answer.strip()) < 5:
        return {
            "technical_knowledge": 0,
            "communication": 0,
            "relevance": 0,
            "overall": 0.0,
            "feedback": "No answer was provided for this question.",
        }

    prompt = f"""You are evaluating a {role} interview answer.

Question: {question}
Candidate Answer: {answer}

Score each metric from 0 to 10 based on the answer quality.
Return ONLY valid JSON with no markdown, no backticks, no explanation:
{{"technical_knowledge": 7, "communication": 7, "relevance": 7, "overall": 7.0, "feedback": "Write 2-3 sentences of specific feedback here"}}"""

    try:
        content = await call_ai(prompt, 0.3)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\{.*?\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            tk = float(result.get("technical_knowledge", 5))
            cm = float(result.get("communication", 5))
            rv = float(result.get("relevance", 5))
            result["technical_knowledge"] = tk
            result["communication"] = cm
            result["relevance"] = rv
            result["overall"] = round((tk + cm + rv) / 3, 1)
            result["feedback"] = result.get("feedback", "Good attempt. Keep practicing.")
            return result
    except Exception as e:
        print(f"Evaluate error: {e}")

    return {
        "technical_knowledge": 5,
        "communication": 5,
        "relevance": 5,
        "overall": 5.0,
        "feedback": "Answer received. Keep practicing to improve your responses.",
    }


async def generate_final_feedback(
    role: str,
    questions: List[str],
    answers: List[str],
    scores: List[Dict[str, Any]],
) -> Dict[str, Any]:
    avg_score = round(sum(s.get("overall", 0) for s in scores) / len(scores), 1) if scores else 0

    qa_summary = ""
    for i, (q, a, s) in enumerate(zip(questions, answers, scores), 1):
        qa_summary += f"Q{i}: {q}\nAnswer: {str(a)[:150]}\nScore: {s.get('overall', 0)}/10\n\n"

    prompt = f"""You are a senior technical interviewer. Generate a detailed feedback report for a {role} candidate.

Overall Score: {avg_score}/10

Interview Summary:
{qa_summary}

Return ONLY valid JSON with no markdown and no backticks:
{{
  "overall_score": {avg_score},
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "areas_for_improvement": ["specific area 1", "specific area 2", "specific area 3"],
  "skill_suggestions": ["actionable suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "recommended_topics": ["topic 1", "topic 2", "topic 3", "topic 4"]
}}"""

    try:
        content = await call_ai(prompt, 0.4)
        content = re.sub(r'```json|```', '', content).strip()
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            result = json.loads(match.group())
            result["overall_score"] = avg_score
            return result
    except Exception as e:
        print(f"Feedback error: {e}")

    return {
        "overall_score": avg_score,
        "strengths": [
            "Completed all interview questions",
            "Demonstrated willingness to engage",
            "Showed basic understanding of concepts",
        ],
        "areas_for_improvement": [
            "Practice explaining technical concepts clearly",
            "Work on structuring answers better",
            "Deepen knowledge in core topics",
        ],
        "skill_suggestions": [
            "Review fundamental concepts daily",
            "Build and document more projects",
            "Practice mock interviews regularly",
        ],
        "recommended_topics": [
            "Data structures and algorithms",
            "System design fundamentals",
            "Communication and presentation skills",
            f"Advanced {role} concepts",
        ],
    }