"""
ApplyZen Storage to MongoDB Uploader
Uploads all existing local storage JSON files directly into your live MongoDB Atlas cluster.
"""
import asyncio
import json
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings
from app.core.logging import logger
from app.database.indexes import setup_indexes

STORAGE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "storage")
)


async def upload_storage_to_mongodb():
    uri = settings.MONGODB_URI
    db_name = settings.MONGODB_DB_NAME or "applyzen"

    print(f"\n========================================================")
    print(f" Connecting to MongoDB at: {uri.split('@')[-1] if '@' in uri else uri}")
    print(f" Database Name: {db_name}")
    print(f"========================================================\n")

    client_kwargs = {
        "serverSelectionTimeoutMS": 5000
    }
    if "mongodb+srv://" in uri:
        client_kwargs["tls"] = True
        client_kwargs["tlsAllowInvalidCertificates"] = False

    client = AsyncIOMotorClient(uri, **client_kwargs)

    try:
        await client.admin.command('ping')
        print("[OK] Successfully connected to live MongoDB Atlas!")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        print("\nPlease check your MONGODB_URI in backend/.env file and ensure it is saved (Ctrl + S).")
        return False

    db = client[db_name]

    # Setup indexes
    print("[*] Setting up indexes...")
    await setup_indexes(db)

    # Process all json files in storage
    collections_synced = 0
    total_docs_synced = 0

    if not os.path.exists(STORAGE_DIR):
        print(f"[!] Storage directory not found at {STORAGE_DIR}")
        return True

    for filename in os.listdir(STORAGE_DIR):
        if not filename.endswith(".json"):
            continue
        coll_name = filename[:-5]
        file_path = os.path.join(STORAGE_DIR, filename)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                docs = json.load(f)
        except Exception as e:
            print(f"[!] Could not read {filename}: {e}")
            continue

        if not isinstance(docs, list) or len(docs) == 0:
            continue

        collection = db[coll_name]
        inserted = 0
        for doc in docs:
            doc_id = doc.get("_id")
            if not doc_id:
                continue
            # Upsert into MongoDB
            await collection.replace_one({"_id": doc_id}, doc, upsert=True)
            inserted += 1

        print(f"[OK] Uploaded {inserted} documents to collection '{coll_name}'")
        collections_synced += 1
        total_docs_synced += inserted

    client.close()
    print(f"\n[OK] SUCCESS: Uploaded {total_docs_synced} documents across {collections_synced} collections to MongoDB Atlas!")
    print("[OK] Open MongoDB Compass, click Refresh, and all your schemas and data will be visible!\n")
    return True


if __name__ == "__main__":
    asyncio.run(upload_storage_to_mongodb())
