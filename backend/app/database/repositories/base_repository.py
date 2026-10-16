"""
ApplyZen Base Repository
"""
from typing import Dict, Any, List, Optional
import uuid
from app.database.mongodb import get_database


class BaseRepository:
    collection_name: str

    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    @property
    def collection(self):
        db = get_database()
        return db[self.collection_name]

    async def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"_id": item_id})

    async def get_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(filter_query)

    async def list(self, filter_query: Optional[Dict[str, Any]] = None, limit: int = 100, sort_by: str = "created_at", sort_dir: int = -1) -> List[Dict[str, Any]]:
        query = filter_query or {}
        cursor = self.collection.find(query).sort(sort_by, sort_dir).limit(limit)
        return await cursor.to_list(limit)

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        item = data.copy()
        if "_id" not in item:
            item["_id"] = str(uuid.uuid4())
        await self.collection.insert_one(item)
        return item

    async def update(self, item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        await self.collection.update_one({"_id": item_id}, {"$set": update_data})
        return await self.get_by_id(item_id)

    async def delete(self, item_id: str) -> bool:
        res = await self.collection.delete_one({"_id": item_id})
        return res.deleted_count > 0

    async def count(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        return await self.collection.count_documents(filter_query or {})
