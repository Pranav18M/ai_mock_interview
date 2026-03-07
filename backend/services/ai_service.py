import json
import re
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from config.database import get_settings


def get_openai_client() -> AsyncOpenAI:
    settings = get_settings()
    return AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_questions(
    role: str,
    difficulty: str,
    skills: List[str],
    projects: List[str],
    experience: List[str],
) -> List[str]:
    client = get_openai_client()

    skills_str = ", ".join(skills[:10]) if skills else "general programming"
    projects_str = "; ".join(projects[:3]) if projects else "no specific projects"
    exp_str = "; ".join(experience[:3]) if experience else "fresher"

    prompt = f"""You are a senior technical interviewer. Generate exactly 5 interview questions for a {role} position at {difficulty} level.

Candidate Profile:
- Skills: {skills_str}
- Projects: {projects_str}
- Experience: {exp_str}

Rules:
1. Questions must match the {difficulty} difficulty level
2. Questions should test skills relevant to {role}
3. At least 1 question must be about one of the candidate's projects
4. Mix of conceptual, practical, and behavioral questions
5. Questions should be clear and specific

Return ONLY a JSON array of 5 question strings, no explanation:
["question1", "question2", "question3", "question4", "question5"]"""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=800,
    )

    content = response.choices[0].message.content.strip()
    # Extract JSON array from response
    match = re.search(r'\[.*\]', content, re.DOTALL)
    if match:
        questions = json.loads(match.group())
        return questions[:5]

    # Fallback: split by newlines if JSON parsing fails
    lines = [line.strip().lstrip('0123456789.-) ') for line in content.split('\n') if line.strip()]
    return [l for l in lines if l][:5]


async def evaluate_answer(
    question: str,
    answer: str,
    role: str,
) -> Dict[str, Any]:
    client = get_openai_client()

    if not answer or len(answer.strip()) < 10:
        return {
            "technical_knowledge": 0,
            "communication": 0,
            "relevance": 0,
            "overall": 0,
            "feedback": "No answer was provided for this question.",
        }

    prompt = f"""You are a technical interviewer evaluating a candidate's answer for a {role} position.

Question: {question}

Candidate's Answer: {answer}

Evaluate the answer on these metrics (score 0-10):
1. Technical Knowledge: Accuracy and depth of technical content
2. Communication Clarity: How clearly and structured the answer is
3. Answer Relevance: How relevant the answer is to the question

Return ONLY a JSON object:
{{
  "technical_knowledge": <score 0-10>,
  "communication": <score 0-10>,
  "relevance": <score 0-10>,
  "overall": <average of three scores, rounded to 1 decimal>,
  "feedback": "<2-3 sentence specific feedback about this answer>"
}}"""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=400,
    )

    content = response.choices[0].message.content.strip()
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        result = json.loads(match.group())
        # Ensure overall is calculated correctly
        avg = round((result["technical_knowledge"] + result["communication"] + result["relevance"]) / 3, 1)
        result["overall"] = avg
        return result

    return {
        "technical_knowledge": 5,
        "communication": 5,
        "relevance": 5,
        "overall": 5.0,
        "feedback": "Answer evaluated. Keep practicing to improve your responses.",
    }


async def generate_final_feedback(
    role: str,
    questions: List[str],
    answers: List[str],
    scores: List[Dict[str, Any]],
) -> Dict[str, Any]:
    client = get_openai_client()

    qa_pairs = ""
    for i, (q, a, s) in enumerate(zip(questions, answers, scores), 1):
        qa_pairs += f"\nQ{i}: {q}\nAnswer: {a}\nScore: {s.get('overall', 0)}/10\n"

    avg_score = round(sum(s.get("overall", 0) for s in scores) / len(scores), 1) if scores else 0

    prompt = f"""You are a senior technical interviewer. Based on the complete mock interview for a {role} position, generate a comprehensive feedback report.

Interview Transcript:
{qa_pairs}

Overall Average Score: {avg_score}/10

Generate a detailed feedback report. Return ONLY this JSON structure:
{{
  "overall_score": {avg_score},
  "strengths": ["strength1", "strength2", "strength3"],
  "areas_for_improvement": ["area1", "area2", "area3"],
  "skill_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "recommended_topics": ["topic1", "topic2", "topic3", "topic4"]
}}

Be specific, actionable, and reference the actual interview content."""

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=800,
    )

    content = response.choices[0].message.content.strip()
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        return json.loads(match.group())

    return {
        "overall_score": avg_score,
        "strengths": ["Completed the interview", "Attempted all questions"],
        "areas_for_improvement": ["Practice more technical questions", "Work on communication"],
        "skill_suggestions": ["Review core concepts", "Practice coding problems"],
        "recommended_topics": ["Data structures", "System design", "Problem solving"],
    }