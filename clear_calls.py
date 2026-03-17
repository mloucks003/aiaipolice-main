#!/usr/bin/env python3
"""Clear all calls from the database"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def clear_calls():
    # Connect to production MongoDB
    mongo_url = "mongodb+srv://admin:Admin1234@cluster0.cr10lmh.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(mongo_url)
    db = client["law_enforcement_rms"]
    
    # Delete all calls
    result = await db.active_calls.delete_many({})
    
    print(f"✅ Cleared {result.deleted_count} calls from the database")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_calls())
