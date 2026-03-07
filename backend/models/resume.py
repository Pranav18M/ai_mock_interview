from pydantic import BaseModel
from typing import List, Optional


class ResumeData(BaseModel):
    user_id: str
    skills: List[str] = []
    projects: List[str] = []
    experience: List[str] = []
    raw_text: Optional[str] = None


class ResumeResponse(BaseModel):
    user_id: str
    skills: List[str]
    projects: List[str]
    experience: List[str]
    message: str = "Resume parsed successfully"