#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def create_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb+srv://admin:Admin1234@cluster0.cr10lmh.mongodb.net/?appName=Cluster0")
    db = client["law_enforcement_rms"]
    
    # Check if admin already exists
    existing = await db.users.find_one({"username": "admin"})
    if existing:
        print("✅ Admin user already exists!")
        return
    
    # Create admin user
    user = {
        "id": "admin-001",
        "badge_number": "ADMIN001",
        "username": "admin",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkG6.",
        "full_name": "System Administrator",
        "role": "admin",
        "department": "Administration",
        "rank": "Administrator",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    print("✅ Admin user created successfully!")
    print("   Username: admin")
    print("   Password: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
