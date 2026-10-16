"""
ApplyZen Resume Management Endpoints
"""
from typing import List
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.auth.dependencies import get_current_user
from app.database.repositories.resume_repository import resume_repo
from app.schemas.resume import ResumeCreate, ResumeResponse
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.get("", response_model=List[ResumeResponse])
async def list_resumes(current_user: dict = Depends(get_current_user)):
    resumes = await resume_repo.list_by_user(current_user["_id"])
    for r in resumes:
        r["id"] = r["_id"]
    return resumes


@router.post("", response_model=ResumeResponse)
async def upload_resume(
    title: str = Form(...),
    version_label: str = Form("v1.0"),
    is_preferred: bool = Form(False),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    resume_id = str(uuid.uuid4())
    # Mock extracted skills based on title or random set
    default_skills = ["Python", "FastAPI", "React", "Docker", "REST APIs", "Tailwind CSS", "Git", "MongoDB"]
    
    resume_doc = {
        "_id": resume_id,
        "user_id": current_user["_id"],
        "title": title,
        "file_name": file.filename,
        "file_url": f"/storage/resumes/{current_user['_id']}_{file.filename}",
        "version_label": version_label,
        "is_preferred": is_preferred,
        "skills_extracted": default_skills,
        "summary": f"Targeted resume highlighting technical software engineering proficiency with {file.filename}.",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "times_used": 0
    }
    
    await resume_repo.create(resume_doc)
    if is_preferred:
        await resume_repo.set_preferred(current_user["_id"], resume_id)
        
    resume_doc["id"] = resume_id
    return resume_doc


@router.post("/{resume_id}/set-preferred")
async def set_preferred_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    resume = await resume_repo.get_by_id(resume_id)
    if not resume or resume.get("user_id") != current_user["_id"]:
        raise NotFoundError("Resume not found")
    await resume_repo.set_preferred(current_user["_id"], resume_id)
    return {"success": True, "message": "Resume set as preferred"}


@router.delete("/{resume_id}")
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    resume = await resume_repo.get_by_id(resume_id)
    if not resume or resume.get("user_id") != current_user["_id"]:
        raise NotFoundError("Resume not found")
    await resume_repo.delete(resume_id)
    return {"success": True, "message": "Resume deleted"}
