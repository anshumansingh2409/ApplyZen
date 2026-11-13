"""
ApplyZen Career Orchestrator Agent
Manages end-to-end multi-agent pipeline and durable workflow state.
"""
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
import asyncio
from app.core.constants import ApplicationStatus, EligibilityStatus, ApplicationMode
from app.ai.agents.opportunity_agent import opportunity_agent
from app.ai.agents.eligibility_agent import eligibility_agent
from app.ai.agents.resume_agent import resume_agent
from app.ai.agents.form_agent import form_agent
from app.database.repositories.opportunity_repository import opportunity_repo
from app.database.repositories.application_repository import application_repo
from app.database.repositories.career_profile_repository import career_profile_repo
from app.database.repositories.resume_repository import resume_repo
from app.database.repositories.notification_repository import notification_repo
from app.core.logging import logger

_ORCHESTRATOR_LOCK = asyncio.Lock()


class CareerOrchestratorAgent:
    version: str = "v1.2"

    async def process_email_opportunity(
        self,
        user_id: str,
        email_content: str,
        source_email: Optional[str] = None,
        provider_message_id: Optional[str] = None,
        email_received_at: Optional[str] = None,
        connected_account: Optional[str] = None,
        provider: Optional[str] = "gmail"
    ) -> Dict[str, Any]:
        """
        Executes complete opportunity extraction, deduplication, eligibility,
        resume selection, and form preparation pipeline.
        """
        # Step 0: Check if it's an Admit Card / Hall Ticket / Assessment notice
        is_admit, admit_data = opportunity_agent.is_admit_card(text=email_content)
        if is_admit:
            comp_name = admit_data.get("company") or "Company"
            logger.info(f"[Orchestrator] Admit Card detected for {comp_name}. Routing to Application Pipeline.")
            app_id = str(uuid.uuid4())
            admit_app = {
                "_id": app_id,
                "user_id": user_id,
                "company": comp_name,
                "role": admit_data.get("role") or f"Online Assessment ({comp_name})",
                "status": ApplicationStatus.ADMIT_CARD.value,
                "is_admit_card": True,
                "application_url": admit_data.get("test_url"),
                "admit_card_details": admit_data,
                "match_score": 90,
                "source_email": source_email,
                "provider_message_id": provider_message_id,
                "timeline": [
                    {
                        "title": "🎫 Admit Card / Hall Ticket Issued",
                        "description": f"Assessment schedule: {admit_data.get('exam_date')}. Link: {admit_data.get('test_url') or 'See email'}",
                        "status_tag": ApplicationStatus.ADMIT_CARD.value,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ],
                "created_at": email_received_at or datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await application_repo.create(admit_app)
            return {"status": "admit_card_routed", "application_id": app_id, "is_admit_card": True}

        # Step 0b: Check if it's an Interview Invitation / Technical Challenge Round
        is_interview, int_data = opportunity_agent.is_interview_invitation(text=email_content, subject=source_email or "")
        if is_interview:
            comp_name = int_data.get("company") or "Company"
            role_name = int_data.get("role") or "Software Developer"
            round_name = int_data.get("round_name") or "Technical Challenge Round"
            int_date = int_data.get("interview_date") or "Scheduled"
            is_attended = int_data.get("is_attended", False)

            logger.info(f"[Orchestrator] Interview invitation detected for {comp_name} - {round_name}. Routing to Application Pipeline.")
            app_id = str(uuid.uuid4())
            interview_app = {
                "_id": app_id,
                "user_id": user_id,
                "company": comp_name,
                "role": role_name,
                "round_name": round_name,
                "status": int_data.get("status", ApplicationStatus.INTERVIEW.value),
                "is_interview": True,
                "is_attended": is_attended,
                "application_url": int_data.get("meeting_url"),
                "google_form_url": int_data.get("meeting_url"),
                "interview_details": int_data,
                "match_score": 92,
                "applied_date": int_date if int_date != "Scheduled" else datetime.now(timezone.utc).strftime("%d %b %Y"),
                "source_email": source_email,
                "provider_message_id": provider_message_id,
                "timeline": [
                    {
                        "title": f"🎙️ {round_name} {'Completed / Attended' if is_attended else 'Scheduled'}",
                        "description": f"Round: {round_name}. Scheduled Date: {int_date}. Company: {comp_name}.",
                        "status_tag": int_data.get("status", ApplicationStatus.INTERVIEW.value),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                ],
                "created_at": email_received_at or datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await application_repo.create(interview_app)
            return {"status": "interview_routed", "application_id": app_id, "is_interview": True}

        # Step 1: Opportunity Extraction
        opp_data = await opportunity_agent.extract_opportunity(
            email_content,
            source_email=source_email,
            provider_message_id=provider_message_id,
            email_received_at=email_received_at,
            connected_account=connected_account,
            provider=provider
        )

        # Step 2: Deduplication Check & Concurrency Guard
        async with _ORCHESTRATOR_LOCK:
            existing_dup = await opportunity_repo.find_duplicate(
                user_id=user_id,
                company=opp_data["company"],
                role=opp_data["role"],
                job_id=opp_data.get("job_id"),
                application_url=opp_data.get("application_url"),
                google_form_url=opp_data.get("google_form_url"),
                provider_message_id=provider_message_id
            )
            if existing_dup:
                logger.info(f"Duplicate opportunity detected for {opp_data['company']} - {opp_data['role']}. Skipping workflow creation.")
                return {"status": "duplicate_skipped", "opportunity_id": existing_dup["_id"]}

            # Step 3: Fetch Career Profile & Resumes
            career_profile = await career_profile_repo.get_by_user_id(user_id) or {}
            user_resumes = await resume_repo.list_by_user(user_id)

            # Step 4: Eligibility Check
            elig_status, elig_reasons = await eligibility_agent.evaluate_eligibility(opp_data, career_profile)

            # Step 5: Resume Matching
            best_resume, match_score, matching_skills, missing_skills = await resume_agent.match_resumes(
                opp_data, career_profile, user_resumes
            )

            # Persist Opportunity
            res_id = best_resume.get("_id") if best_resume else None
            res_name = (best_resume.get("title") or best_resume.get("file_name")) if best_resume else "Career Profile"

            opp_id = str(uuid.uuid4())
            opp_record = {
                "_id": opp_id,
                "user_id": user_id,
                **opp_data,
                "provider_message_id": provider_message_id or opp_data.get("provider_message_id"),
                "source_email": source_email or opp_data.get("source_email"),
                "connected_account": connected_account or opp_data.get("connected_account"),
                "provider": provider or opp_data.get("provider", "gmail"),
                "email_received_at": email_received_at or opp_data.get("email_received_at") or datetime.now(timezone.utc).isoformat(),
                "email_timestamp": email_received_at or opp_data.get("email_timestamp") or datetime.now(timezone.utc).isoformat(),
                "eligibility_status": elig_status.value,
                "eligibility_reasons": elig_reasons,
                "match_score": match_score,
                "matching_skills": matching_skills,
                "missing_skills": missing_skills,
                "selected_resume_id": res_id,
                "selected_resume_name": res_name,
                "status": "DETECTED",
                "form_status": "ANALYZING_FORM",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            # Step 1: Immediately persist opportunity so it appears in UI right away
            await opportunity_repo.create(opp_record)

        # Invalidate Redis cache so newly detected opportunity shows in Opportunities section immediately
        from app.cache.redis import redis_manager
        await redis_manager.delete(f"cache:opps:{user_id}")

        now_iso = datetime.now(timezone.utc).isoformat()

        # Step 2: Form Link Inspection & Auto-Fill with verified Ground Truth
        from app.database.repositories.user_repository import user_repo
        real_user = await user_repo.get_by_id(user_id) or {}
        user_doc = {
            "full_name": real_user.get("full_name") or career_profile.get("full_name") or "Anshuman Singh",
            "email": real_user.get("email") or "anshumansingh2409@gmail.com"
        }

        target_form_url = opp_data.get("google_form_url") or opp_data.get("application_url")
        mapped_fields = []
        prefilled_url = target_form_url
        form_title = f"{opp_data['company']} Application Form"

        if target_form_url:
            try:
                logger.info(f"[Orchestrator] AI Agent opening & inspecting form link for {opp_data['company']}: {target_form_url}")
                inspect_res = await form_agent.inspect_and_auto_fill(
                    form_url=target_form_url,
                    company=opp_data["company"],
                    role=opp_data["role"],
                    career_profile=career_profile,
                    user=user_doc,
                    selected_resume=best_resume or {},
                    opp_context=opp_data
                )
                mapped_fields = inspect_res.get("form_fields", [])
                prefilled_url = inspect_res.get("prefilled_url") or target_form_url
                form_title = inspect_res.get("form_title") or form_title
                logger.info(f"[Orchestrator] Mapped {len(mapped_fields)} fields with Ground Truth. Prefilled URL generated.")
            except Exception as form_err:
                logger.error(f"[Orchestrator] Form inspection error: {form_err}. Falling back to standard mapping.")
                mapped_fields = await form_agent.map_form_fields([], career_profile, user_doc, best_resume or {})

        # Step 3: Check Submission Mode (User Accept vs Auto Submit)
        automation_policy = career_profile.get("automation_policy", {})
        app_mode = automation_policy.get("application_mode", ApplicationMode.APPROVAL_MODE.value)
        is_auto_mode = (app_mode in [ApplicationMode.AUTOMATIC_MODE.value, "AUTOMATIC_MODE", "auto_submit"])

        app_id = str(uuid.uuid4())
        scheduled_submit_at = None
        now_dt = datetime.now(timezone.utc)

        if is_auto_mode:
            # Mode B: Auto-submit 1 minute before deadline (or 1 min buffer countdown)
            submission_status = ApplicationStatus.AUTO_READY.value
            opp_status = "AUTO_READY"

            deadline_str = opp_data.get("deadline")
            scheduled_dt = None
            if deadline_str:
                try:
                    parsed_deadline = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
                    one_min_before = parsed_deadline - timedelta(minutes=1)
                    if one_min_before > now_dt + timedelta(seconds=30):
                        scheduled_dt = one_min_before
                except Exception:
                    pass

            if not scheduled_dt:
                # Default safety window: 1 minute from now
                scheduled_dt = now_dt + timedelta(minutes=1)

            scheduled_submit_at = scheduled_dt.isoformat()

            # Schedule background execution task
            from app.services.application_service import application_service
            delay_sec = max(5, int((scheduled_dt - now_dt).total_seconds()))
            asyncio.create_task(application_service.schedule_auto_submit(app_id, user_id, delay_sec))

            # Auto mode notification
            await notification_repo.create({
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"Auto-Submit Scheduled: {opp_data['company']}",
                "message": f"Form pre-filled with Career Ground Truth. Auto-submitting in 1 min (or 1 min before deadline). Check & review anytime.",
                "type": "auto_submit_scheduled",
                "priority": "normal",
                "is_read": False,
                "action_url": f"/opportunities/{opp_id}",
                "created_at": now_iso
            })
        else:
            # Mode A: User Accept (Manual Review & Accept)
            submission_status = ApplicationStatus.READY_FOR_REVIEW.value
            opp_status = "READY_FOR_REVIEW"

            # User accept notification
            await notification_repo.create({
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"Check & Accept: {opp_data['company']} Form Ready",
                "message": f"AI Copilot opened and filled {opp_data['company']}'s form with verified Career Ground Truth. Review fields and accept to submit.",
                "type": "ready_for_review",
                "priority": "high",
                "is_read": False,
                "action_url": f"/opportunities/{opp_id}",
                "created_at": now_iso
            })

        # Step 4: Persist Application Document
        app_record = {
            "_id": app_id,
            "user_id": user_id,
            "user_email": user_doc["email"],
            "opportunity_id": opp_id,
            "company": opp_data["company"],
            "role": opp_data["role"],
            "application_url": opp_data.get("application_url"),
            "google_form_url": prefilled_url,
            "prefilled_url": prefilled_url,
            "form_title": form_title,
            "status": submission_status,
            "resume_used_id": res_id,
            "resume_used_name": res_name,
            "match_score": match_score,
            "form_fields": mapped_fields,
            "submission_mode": "AUTOMATIC_MODE" if is_auto_mode else "APPROVAL_MODE",
            "scheduled_submit_at": scheduled_submit_at,
            "submission_notes": "Form auto-filled with Ground Truth profile by ApplyZen Form Copilot.",
            "submitted_at": None,
            "timeline": [
                {
                    "title": "Recruitment Notice Detected",
                    "description": f"Extracted opportunity for {opp_data['company']} ({opp_data['role']}).",
                    "timestamp": email_received_at or now_iso,
                    "status_tag": ApplicationStatus.DETECTED.value
                },
                {
                    "title": "Google Form Inspected & Pre-filled",
                    "description": f"Extracted {len(mapped_fields)} questions and mapped with verified Career Ground Truth.",
                    "timestamp": now_iso,
                    "status_tag": "FORM_AUTO_FILLED"
                },
                {
                    "title": "Auto-Submission Scheduled (1 Min Buffer)" if is_auto_mode else "Awaiting Candidate Review & Acceptance",
                    "description": f"Auto-submitting at {scheduled_submit_at} (1 min before deadline/timer)." if is_auto_mode else "Form is ready for candidate inspection and final accept.",
                    "timestamp": now_iso,
                    "status_tag": submission_status
                }
            ],
            "ai_activity_log": [
                {
                    "activity": f"Detected opportunity: {opp_data['role']} at {opp_data['company']}",
                    "agent_name": "OpportunityAgent",
                    "confidence": 0.98,
                    "timestamp": now_iso
                },
                {
                    "activity": f"Opened form URL, extracted {len(mapped_fields)} questions and generated prefilled link",
                    "agent_name": "FormAgent",
                    "confidence": 0.99,
                    "timestamp": now_iso
                }
            ],
            "captcha_context": {"detected": False},
            "deadline": opp_data.get("deadline"),
            "created_at": now_iso,
            "updated_at": now_iso
        }
        await application_repo.create(app_record)

        # Step 5: Update Opportunity with prefilled URL, application_id and current status
        await opportunity_repo.update(opp_id, {
            "application_id": app_id,
            "google_form_url": prefilled_url,
            "prefilled_url": prefilled_url,
            "form_fields": mapped_fields,
            "form_title": form_title,
            "form_status": "FORM_FILLED",
            "status": opp_status,
            "scheduled_submit_at": scheduled_submit_at,
            "updated_at": now_iso
        })

        # Invalidate caches
        await redis_manager.delete(f"cache:opps:{user_id}")
        await redis_manager.delete(f"cache:opp:{opp_id}")

        return {
            "status": "application_created",
            "opportunity_id": opp_id,
            "application_id": app_id,
            "submission_status": submission_status,
            "prefilled_url": prefilled_url
        }


career_orchestrator = CareerOrchestratorAgent()
