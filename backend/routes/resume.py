from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from config.database import get_db
from models.resume import ResumeResponse
from services.resume_parser import parse_resume
from utils.jwt_handler import get_current_user

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File size must be under 5MB")

    skills, projects, experience, raw_text = parse_resume(file_bytes)

    db = get_db()
    resume_doc = {
        "user_id": current_user["user_id"],
        "skills": skills,
        "projects": projects,
        "experience": experience,
        "raw_text": raw_text[:5000],  # Store first 5000 chars
    }

    await db.resumes.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": resume_doc},
        upsert=True,
    )

    return ResumeResponse(
        user_id=current_user["user_id"],
        skills=skills,
        projects=projects,
        experience=experience,
    )


@router.get("/", response_model=ResumeResponse)
async def get_resume(current_user: dict = Depends(get_current_user)):
    db = get_db()
    resume = await db.resumes.find_one({"user_id": current_user["user_id"]})
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please upload a resume first.")

    return ResumeResponse(
        user_id=resume["user_id"],
        skills=resume.get("skills", []),
        projects=resume.get("projects", []),
        experience=resume.get("experience", []),
    )