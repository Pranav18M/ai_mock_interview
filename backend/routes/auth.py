from fastapi import APIRouter
from models.user import UserCreate, UserLogin, TokenResponse
from services.auth_service import register_user, login_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    return await register_user(user_data)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    return await login_user(credentials)