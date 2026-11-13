import pytest
from app.schemas.career_profile import CareerProfileSchema
from app.database.repositories.career_profile_repository import career_profile_repo


@pytest.mark.asyncio
async def test_career_profile_schema_fresher_field():
    # Test True
    profile_fresher = CareerProfileSchema(is_fresher=True)
    dump_fresher = profile_fresher.model_dump()
    assert dump_fresher.get("is_fresher") is True

    # Test False
    profile_experienced = CareerProfileSchema(is_fresher=False)
    dump_exp = profile_experienced.model_dump()
    assert dump_exp.get("is_fresher") is False


@pytest.mark.asyncio
async def test_career_profile_repository_fresher_upsert():
    test_user_id = "test_fresher_user_123"
    try:
        # Upsert with is_fresher = True
        res = await career_profile_repo.upsert_by_user_id(
            test_user_id,
            {"full_name": "Fresher Candidate", "is_fresher": True, "experience": []}
        )
        assert res is not None
        assert res.get("is_fresher") is True

        # Fetch and verify
        fetched = await career_profile_repo.get_by_user_id(test_user_id)
        assert fetched is not None
        assert fetched.get("is_fresher") is True

        # Update to False
        res2 = await career_profile_repo.upsert_by_user_id(
            test_user_id,
            {"is_fresher": False}
        )
        assert res2.get("is_fresher") is False
    finally:
        # Clean up
        if career_profile_repo.collection is not None:
            await career_profile_repo.collection.delete_one({"user_id": test_user_id})

