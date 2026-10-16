// Initialize MongoDB collections and indexes
db = db.getSiblingDB('applyzen');

// Create collections
db.createCollection('users');
db.createCollection('career_profiles');
db.createCollection('resumes');
db.createCollection('opportunities');
db.createCollection('applications');
db.createCollection('application_events');
db.createCollection('workflow_runs');
db.createCollection('notifications');
db.createCollection('automation_policies');
db.createCollection('subscriptions');
db.createCollection('support_requests');
db.createCollection('audit_logs');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.career_profiles.createIndex({ "user_id": 1 }, { unique: true });
db.resumes.createIndex({ "user_id": 1, "is_preferred": 1 });
db.opportunities.createIndex({ "user_id": 1, "company": 1, "role": 1 });
db.opportunities.createIndex({ "provider_message_id": 1 }, { sparse: true });
db.opportunities.createIndex({ "deadline": 1 });
db.applications.createIndex({ "user_id": 1, "opportunity_id": 1 }, { unique: true });
db.applications.createIndex({ "status": 1 });
db.applications.createIndex({ "deadline": 1 });
db.application_events.createIndex({ "application_id": 1, "created_at": 1 });
db.workflow_runs.createIndex({ "workflow_id": 1 }, { unique: true });
db.notifications.createIndex({ "user_id": 1, "is_read": 1, "created_at": -1 });

print("ApplyZen database initialization complete.");
