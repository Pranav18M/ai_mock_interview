from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class InterviewSetup(BaseModel):
    role: str
    difficulty: str  # beginner, intermediate, advanced


class AnswerSubmit(BaseModel):
    interview_id: str
    question_index: int
    question: str
    answer: str


class QuestionScore(BaseModel):
    question: str
    answer: str
    technical_knowledge: float
    communication: float
    relevance: float
    overall: float
    feedback: str


class InterviewFeedback(BaseModel):
    overall_score: float
    strengths: List[str]
    areas_for_improvement: List[str]
    skill_suggestions: List[str]
    recommended_topics: List[str]


class InterviewSession(BaseModel):
    id: Optional[str] = None
    user_id: str
    role: str
    difficulty: str
    questions: List[str] = []
    answers: List[Dict[str, Any]] = []
    scores: List[Dict[str, Any]] = []
    feedback: Optional[Dict[str, Any]] = None
    status: str = "in_progress"  # in_progress, completed
    date: Optional[datetime] = None


class InterviewHistoryItem(BaseModel):
    id: str
    role: str
    difficulty: str
    overall_score: Optional[float] = None
    date: datetime
    status: str