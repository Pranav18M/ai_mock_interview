from fastapi import APIRouter, Depends, HTTPException
from config.database import get_db
from models.interview import InterviewSetup, AnswerSubmit, InterviewHistoryItem
from services.ai_service import generate_questions, evaluate_answer, generate_final_feedback, generate_greeting, generate_intro_response
from utils.jwt_handler import get_current_user
from datetime import datetime
from bson import ObjectId
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/interview", tags=["Interview"])


def serialize_doc(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


# ─── Generate Questions ───
@router.post("/generate-questions")
async def generate_interview_questions(
    setup: InterviewSetup,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]})
    skills = resume.get("skills", []) if resume else []
    projects = resume.get("projects", []) if resume else []
    experience = resume.get("experience", []) if resume else []

    questions = await generate_questions(setup.role, setup.difficulty, skills, projects, experience)

    session_doc = {
        "user_id": current_user["user_id"],
        "role": setup.role,
        "difficulty": setup.difficulty,
        "questions": questions,
        "answers": [],
        "scores": [],
        "feedback": None,
        "status": "in_progress",
        "date": datetime.utcnow(),
    }

    result = await db.interviews.insert_one(session_doc)
    interview_id = str(result.inserted_id)

    return {
        "interview_id": interview_id,
        "questions": questions,
        "role": setup.role,
        "difficulty": setup.difficulty,
        "total_questions": len(questions),
    }


# ─── Submit Answer ───
@router.post("/submit-answer")
async def submit_answer(
    data: AnswerSubmit,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    interview = await db.interviews.find_one({
        "_id": ObjectId(data.interview_id),
        "user_id": current_user["user_id"],
    })
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if interview["status"] == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    score = await evaluate_answer(data.question, data.answer, interview["role"])
    answer_record = {
        "question_index": data.question_index,
        "question": data.question,
        "answer": data.answer,
        "score": score,
    }
    await db.interviews.update_one(
        {"_id": ObjectId(data.interview_id)},
        {"$push": {"answers": answer_record, "scores": score}},
    )
    return {"question_index": data.question_index, "score": score, "message": "Answer evaluated successfully"}


# ─── Complete Interview ───
@router.post("/complete/{interview_id}")
async def complete_interview(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    interview = await db.interviews.find_one({
        "_id": ObjectId(interview_id),
        "user_id": current_user["user_id"],
    })
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if interview["status"] == "completed":
        doc = serialize_doc(interview)
        return doc

    questions = interview.get("questions", [])
    answers_records = interview.get("answers", [])
    scores = interview.get("scores", [])
    answers_text = [r.get("answer", "") for r in answers_records]

    feedback = await generate_final_feedback(interview["role"], questions, answers_text, scores)
    await db.interviews.update_one(
        {"_id": ObjectId(interview_id)},
        {"$set": {"status": "completed", "feedback": feedback}},
    )
    return {
        "interview_id": interview_id,
        "role": interview["role"],
        "difficulty": interview["difficulty"],
        "questions": questions,
        "answers": answers_records,
        "scores": scores,
        "feedback": feedback,
        "status": "completed",
        "date": interview["date"].isoformat() if interview.get("date") else None,
    }


# ─── Get Report ───
@router.get("/report/{interview_id}")
async def get_interview_report(
    interview_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    interview = await db.interviews.find_one({
        "_id": ObjectId(interview_id),
        "user_id": current_user["user_id"],
    })
    if not interview:
        raise HTTPException(status_code=404, detail="Interview report not found")
    doc = serialize_doc(interview)
    if doc.get("date"):
        doc["date"] = doc["date"].isoformat()
    return doc


# ─── Get History ───
@router.get("/history")
async def get_interview_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.interviews.find({"user_id": current_user["user_id"]}, sort=[("date", -1)])
    history = []
    async for doc in cursor:
        scores = doc.get("scores", [])
        overall = None
        if scores and doc.get("feedback"):
            overall = doc["feedback"].get("overall_score")
        elif scores:
            overall = round(sum(s.get("overall", 0) for s in scores) / len(scores), 1)
        history.append({
            "id": str(doc["_id"]),
            "role": doc.get("role", ""),
            "difficulty": doc.get("difficulty", ""),
            "overall_score": overall,
            "status": doc.get("status", "in_progress"),
            "date": doc["date"].isoformat() if doc.get("date") else None,
        })
    return history


# ─── Greeting ───
class GreetingRequest(BaseModel):
    user_name: str
    role: str
    difficulty: str

@router.post("/greeting")
async def get_greeting(req: GreetingRequest, current_user: dict = Depends(get_current_user)):
    try:
        greeting = await generate_greeting(req.user_name, req.role, req.difficulty)
        return {"greeting": greeting}
    except Exception as e:
        print("Greeting error:", e)
        return {"greeting": f"Good morning {req.user_name}! Welcome to your {req.role} mock interview. Please introduce yourself and tell me about your background."}


# ─── Intro Response ───
class IntroRequest(BaseModel):
    user_intro: str
    user_name: str
    role: str

@router.post("/intro-response")
async def get_intro_response(req: IntroRequest, current_user: dict = Depends(get_current_user)):
    try:
        response = await generate_intro_response(req.user_intro, req.user_name, req.role)
        return {"response": response}
    except Exception as e:
        print("Intro response error:", e)
        return {"response": f"Thank you {req.user_name}! Great background. Now let's move on to the 5 technical questions for your {req.role} interview."}