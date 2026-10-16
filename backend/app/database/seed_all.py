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

    # 6. Applications collection
    logger.info("Applications collection kept clean for authentic application workflows.")

    # 7. Seed Notifications
    notif_count = await db.notifications.count_documents({"user_id": user_id})
    if notif_count == 0:
        logger.info("Seeding notifications collection...")
        notifs = [
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Stripe Application Ready for Approval",
                "message": "Form fields have been pre-filled with 96% match score. Review and confirm submission.",
                "type": "ACTION_REQUIRED",
                "is_read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "New Career Opportunity Detected",
                "message": "Extracted Software Engineer role at Razorpay from recruitment outreach.",
                "type": "OPPORTUNITY_DETECTED",
                "is_read": False,
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
            },
            {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Ground Truth Verified",
                "message": "Zero-hallucination verification confirmed all profile credentials match criteria.",
                "type": "VERIFICATION_SUCCESS",
                "is_read": True,
                "created_at": (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
            }
        ]
        await db.notifications.insert_many(notifs)
        logger.info("Notifications seeded successfully.")

    client.close()
    logger.info("MongoDB cluster initialization and seeding completed successfully!")
    return True


if __name__ == "__main__":
    uri_arg = sys.argv[1] if len(sys.argv) > 1 else None
    asyncio.run(seed_database(uri_arg))
