"""
ApplyZen Comprehensive MongoDB Database Initializer & Seeder
Creates all collections, sets up indexes, and seeds rich sample data
for users, career profiles, opportunities, applications, resumes, and notifications.
"""
import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.core.security import hash_password
from app.core.logging import logger
from app.database.indexes import setup_indexes


async def seed_database(custom_uri: str = None):
    uri = custom_uri or settings.MONGODB_URI
    db_name = settings.MONGODB_DB_NAME or "applyzen"

    logger.info(f"Connecting to MongoDB at: {uri} (Database: {db_name})")
    
    client_kwargs = {
        "serverSelectionTimeoutMS": 5000
    }
    if "mongodb+srv://" in uri:
        client_kwargs["tls"] = True
        client_kwargs["tlsAllowInvalidCertificates"] = False

    client = AsyncIOMotorClient(uri, **client_kwargs)
    
    try:
        await client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB ({e}). Please check your connection string.")
        return False

    db = client[db_name]

    # 1. Setup Indexes
    logger.info("Setting up collection indexes...")
    await setup_indexes(db)

    # 2. Seed User
    user_id = "user_demo_anshuman_2026"
    existing_user = await db.users.find_one({"$or": [{"email": "anshuman@applyzen.com"}, {"username": "anshuman"}]})
    
    if not existing_user:
        logger.info("Creating primary demo user 'anshuman'...")
        hashed_pwd = hash_password("applyzen123")
        demo_user = {
            "_id": user_id,
            "email": "anshuman@applyzen.com",
            "username": "anshuman",
            "full_name": "Anshuman Singh",
            "hashed_password": hashed_pwd,
            "role": "user",
            "is_active": True,
            "subscription_plan": "Pro",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(demo_user)
        logger.info("Demo user created (Username: anshuman, Password: applyzen123)")
    else:
        user_id = existing_user["_id"]
        logger.info(f"Using existing user ID: {user_id}")

    # 3. Seed Career Profile (Ground Truth)
    existing_profile = await db.career_profiles.find_one({"user_id": user_id})
    if not existing_profile:
        logger.info("Creating Career Profile Ground Truth...")
        profile_data = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "bio": "Hi, I'm Anshuman Singh. Senior Software & AI Engineer passionate about building scalable microservices and autonomous agents.",
            "education": [
                {
                    "institution": "National Institute of Technology",
                    "degree": "B.Tech",
                    "major": "Computer Science & Engineering",
                    "start_year": 2021,
                    "end_year": 2025,
                    "graduation_year": 2025,
                    "cgpa": 8.92
                }
            ],
            "skills": [
                {"name": "Python", "category": "Technical", "level": "Expert"},
                {"name": "FastAPI", "category": "Technical", "level": "Advanced"},
                {"name": "MongoDB", "category": "Technical", "level": "Advanced"},
                {"name": "React.js", "category": "Technical", "level": "Advanced"},
                {"name": "JavaScript", "category": "Technical", "level": "Advanced"},
                {"name": "Docker", "category": "Tool", "level": "Intermediate"},
                {"name": "Tailwind CSS", "category": "Technical", "level": "Advanced"},
                {"name": "LangGraph & LangChain", "category": "Technical", "level": "Advanced"},
                {"name": "Playwright Automation", "category": "Technical", "level": "Advanced"}
            ],
            "experience": [
                {
                    "company": "Tech Innovators Inc",
                    "role": "Software Engineering Intern",
                    "employment_type": "Internship",
                    "start_date": "2024-05",
                    "end_date": "2024-08",
                    "description": "Architected event-driven microservices, accelerated query throughput by 40%, and created automated regression test pipelines.",
                    "skills_used": ["Python", "FastAPI", "MongoDB", "Docker"]
                }
            ],
            "projects": [
                {
                    "title": "ApplyZen AI Career Copilot",
                    "description": "Zero-hallucination autonomous career operating system converting recruitment emails into verified applications.",
                    "technologies": ["Python", "FastAPI", "React", "MongoDB", "Playwright"]
                },
                {
                    "title": "Distributed Task Scheduler",
                    "description": "High-throughput asynchronous job executor using Redis streams and RabbitMQ workers.",
                    "technologies": ["Python", "Redis", "RabbitMQ", "Docker"]
                }
            ],
            "preferences": {
                "desired_roles": ["Full Stack Engineer", "Backend Developer", "Software Engineer", "AI Solutions Engineer"],
                "preferred_locations": ["Remote", "Bengaluru", "Hyderabad", "San Francisco"],
                "will_relocate": True,
                "work_authorization": "Authorized to work without sponsorship",
                "notice_period_days": 15
            },
            "automation_policy": {
                "application_mode": "APPROVAL_MODE",
                "salary_policy": "ASK_USER",
                "relocation_policy": "ALLOW",
                "legal_declaration_policy": "ASK_USER",
                "sensitive_info_policy": "ASK_USER",
                "unknown_info_policy": "ASK_USER",
                "auto_submit_deadline_buffer_hours": 6
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.career_profiles.insert_one(profile_data)
        logger.info("Career profile seeded successfully.")

    # 4. Seed Resumes
    existing_resumes = await db.resumes.count_documents({"user_id": user_id})
    if existing_resumes == 0:
        logger.info("Seeding resumes collection...")
        resume_docs = [
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "file_name": "Anshuman_Singh_FullStack_2026.pdf",
                "file_url": "https://applyzen.storage/resumes/anshuman_fullstack.pdf",
                "parsed_text": "Anshuman Singh - Software Engineer specializing in Python, React, FastAPI, MongoDB.",
                "skills_extracted": ["Python", "FastAPI", "React", "MongoDB", "Docker", "Tailwind CSS"],
                "target_role": "Full Stack Engineer",
                "is_preferred": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "file_name": "Anshuman_Singh_Backend_AI_2026.pdf",
                "file_url": "https://applyzen.storage/resumes/anshuman_backend.pdf",
                "parsed_text": "Anshuman Singh - Backend & AI Engineer specializing in distributed architectures and agents.",
                "skills_extracted": ["Python", "FastAPI", "LangChain", "MongoDB", "Redis", "RabbitMQ"],
                "target_role": "Backend / AI Engineer",
                "is_preferred": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.resumes.insert_many(resume_docs)
        logger.info("Resumes seeded successfully.")

    # 5. Opportunities collection
    logger.info("Opportunities collection kept clean for authentic email ingestion.")

    # 6. Applications collection (Seeding Penthara, micro1, Outlier interviews/assessments)
    logger.info("Seeding interview & assessment records in applications collection...")
    existing_apps_count = await db.applications.count_documents({"user_id": user_id})
    if existing_apps_count == 0:
        seed_applications = [
            {
                "_id": f"penthara_round1_{user_id}",
                "user_id": user_id,
                "company": "Penthara Technologies",
                "role": "Software Developer Intern",
                "round_name": "Technical Challenge Round 1",
                "status": "INTERVIEW",
                "is_interview": True,
                "is_attended": True,
                "applied_date": "29 Oct 2026",
                "match_score": 96,
                "campus": "Galgotias University",
                "source": "Galgotias University Campus Drive",
                "subject": "Anshuman Singh | Software Developer Intern |Technical Challenge Round | Galgotias University | Penthara Technologies",
                "timeline": [
                    {
                        "title": "🎙️ Technical Challenge Round 1 Completed",
                        "description": "Technical challenge coding test conducted on 29 Oct 2026 for Software Developer Intern. Attended & submitted.",
                        "status_tag": "INTERVIEW",
                        "timestamp": "2026-10-29T10:00:00+00:00"
                    }
                ],
                "created_at": "2026-10-29T10:00:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": f"penthara_round2_{user_id}",
                "user_id": user_id,
                "company": "Penthara Technologies",
                "role": "Software Developer Intern",
                "round_name": "Technical Challenge Round 2",
                "status": "INTERVIEW",
                "is_interview": True,
                "is_attended": True,
                "applied_date": "05 Nov 2026",
                "match_score": 96,
                "campus": "Galgotias University",
                "source": "Galgotias University Campus Drive",
                "subject": "Anshuman Singh | Software Developer Intern |Technical Challenge Round 2 | Galgotias University | Penthara Technologies",
                "timeline": [
                    {
                        "title": "🎙️ Technical Challenge Round 2 Completed",
                        "description": "Second round technical challenge and interview conducted on 05 Nov 2026 for Software Developer Intern. Attended & submitted.",
                        "status_tag": "INTERVIEW",
                        "timestamp": "2026-11-05T14:30:00+00:00"
                    }
                ],
                "created_at": "2026-11-05T14:30:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": f"micro1_ai_interview_{user_id}",
                "user_id": user_id,
                "company": "micro1",
                "role": "AI Software Engineer",
                "round_name": "AI Technical Screening & Live Coding",
                "status": "INTERVIEW",
                "is_interview": True,
                "is_attended": False,
                "applied_date": "10 Nov 2026",
                "match_score": 94,
                "application_url": "https://app.micro1.ai/interview/candidate-screening",
                "google_form_url": "https://app.micro1.ai/interview/candidate-screening",
                "timeline": [
                    {
                        "title": "🎙️ micro1 AI Technical Interview Scheduled",
                        "description": "AI-powered technical screening and system design assessment.",
                        "status_tag": "INTERVIEW",
                        "timestamp": "2026-11-10T11:00:00+00:00"
                    }
                ],
                "created_at": "2026-11-10T11:00:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": f"outlier_assessment_{user_id}",
                "user_id": user_id,
                "company": "Outlier",
                "role": "AI Specialist / Python Developer",
                "round_name": "Technical Screening & Code Review Assessment",
                "status": "ASSESSMENT",
                "is_interview": True,
                "is_attended": False,
                "applied_date": "12 Nov 2026",
                "match_score": 91,
                "application_url": "https://app.outlier.ai/assessment/technical-screening",
                "google_form_url": "https://app.outlier.ai/assessment/technical-screening",
                "timeline": [
                    {
                        "title": "📝 Technical Screening Assessment Issued",
                        "description": "Python algorithms and code evaluation challenge on Outlier platform.",
                        "status_tag": "ASSESSMENT",
                        "timestamp": "2026-11-12T09:00:00+00:00"
                    }
                ],
                "created_at": "2026-11-12T09:00:00+00:00",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.applications.insert_many(seed_applications)
        logger.info(f"Seeded {len(seed_applications)} interview and assessment applications.")

    # 7. Seed Notifications
    logger.info("Notifications collection kept clean for authentic real-time user events.")

    client.close()
    logger.info("MongoDB cluster initialization and seeding completed successfully!")
    return True


if __name__ == "__main__":
    uri_arg = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(seed_database(uri_arg))
