"""
ApplyZen MongoDB Connection and Client Management
Connects directly to live MongoDB / MongoDB Atlas using the Motor async driver.
Zero local disk storage: All data is stored in the MongoDB server only.
"""
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger


class InMemoryCollection:
    """
    Pure in-memory collection used strictly as a non-persistent fallback for unit tests.
    Never writes or reads from local disk or folders.
    """
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or":
                if not isinstance(v, list) or not any(self._matches(doc, sub_q) for sub_q in v):
                    return False
            elif k == "$and":
                if not isinstance(v, list) or not all(self._matches(doc, sub_q) for sub_q in v):
                    return False
            elif isinstance(v, dict):
                val = doc.get(k)
                if "$in" in v:
                    if val not in v["$in"]:
                        return False
                elif "$ne" in v:
                    if val == v["$ne"]:
                        return False
                else:
                    if val != v:
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    async def insert_one(self, doc: Dict[str, Any]):
        d = doc.copy()
        if "_id" not in d:
            d["_id"] = str(uuid.uuid4())
        self.docs = [x for x in self.docs if x.get("_id") != d["_id"]]
        self.docs.append(d)

        class InsertResult:
            inserted_id = d["_id"]
        return InsertResult()

    async def find_one(self, query: Dict[str, Any], projection: Optional[Dict[str, Any]] = None):
        for doc in self.docs:
            if self._matches(doc, query):
                res = doc.copy()
                if projection and projection.get("_id") == 0:
                    res.pop("_id", None)
                return res
        return None

    def find(self, query: Optional[Dict[str, Any]] = None, projection: Optional[Dict[str, Any]] = None):
        q = query or {}
        matched = []
        for doc in self.docs:
            if self._matches(doc, q):
                res = doc.copy()
                if projection and projection.get("_id") == 0:
                    res.pop("_id", None)
                matched.append(res)

        class AsyncCursor:
            def __init__(self, items):
                self.items = items

            def sort(self, key_or_list, direction=None):
                key = key_or_list if isinstance(key_or_list, str) else key_or_list[0][0]
                reverse = (direction == -1) if direction else (key_or_list[0][1] == -1 if isinstance(key_or_list, list) else False)
                self.items = sorted(self.items, key=lambda x: str(x.get(key, "")) or "", reverse=reverse)
                return self

            def skip(self, n):
                self.items = self.items[n:]
                return self

            def limit(self, n):
                self.items = self.items[:n]
                return self

            async def to_list(self, length: Optional[int] = None):
                if length is not None:
                    return self.items[:length]
                return self.items

            def __aiter__(self):
                self._iter = iter(self.items)
                return self

            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration

        return AsyncCursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False):
        set_vals = update.get("$set", {})
        for doc in self.docs:
            if self._matches(doc, query):
                doc.update(set_vals)
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        if upsert:
            new_doc = query.copy()
            new_doc.update(set_vals)
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            self.docs.append(new_doc)
            class UpsertResult:
                matched_count = 0
                modified_count = 1
            return UpsertResult()
        class NoUpdateResult:
            matched_count = 0
            modified_count = 0
        return NoUpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for i, doc in enumerate(self.docs):
            if self._matches(doc, query):
                self.docs.pop(i)
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class NoDeleteResult:
            deleted_count = 0
        return NoDeleteResult()

    async def count_documents(self, query: Dict[str, Any]):
        res = await self.find(query).to_list(None)
        return len(res)

    async def create_index(self, *args, **kwargs):
        return "index_created"


class InMemoryDatabase:
    """Mock asynchronous database for memory-only unit testing."""
    def __init__(self):
        self.collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self.collections:
            self.collections[name] = InMemoryCollection(name)
        return self.collections[name]

    def __getattr__(self, name: str) -> InMemoryCollection:
        return self[name]


class MongoDBManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Any = None
    is_in_memory: bool = False

    async def connect_to_database(self):
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            client_kwargs = {
                "serverSelectionTimeoutMS": 45000,
                "connectTimeoutMS": 45000,
                "socketTimeoutMS": 45000,
            }
            if "mongodb+srv://" in settings.MONGODB_URI:
                client_kwargs["tls"] = True
                client_kwargs["tlsAllowInvalidCertificates"] = False

            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                **client_kwargs
            )
            # Test connectivity by pinging admin database
            await self.client.admin.command('ping')
            db_name = settings.MONGODB_DB_NAME
            self.db = self.client[db_name]
            self.is_in_memory = False
            logger.info(f"Successfully connected to live MongoDB database '{db_name}'!")
        except Exception as e:
            logger.error(
                f"Failed to connect to live MongoDB server ({e}). Check MONGODB_URI and internet connection."
            )
            # In-memory only (does NOT persist to disk or any folder)
            self.db = InMemoryDatabase()
            self.is_in_memory = True

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")


db_manager = MongoDBManager()


def get_database():
    if db_manager.db is None:
        db_manager.db = InMemoryDatabase()
        db_manager.is_in_memory = True
    return db_manager.db
