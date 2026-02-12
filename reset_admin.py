#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb+srv://admin:Admin1234@cluster0.cr10lmh.mongodb.net/?appName=Cluster0")
    db = client["law_enforcement_rms"]
    
    # Hash the password properly
    password = "admin123"
    hashed = pwd_context.hash(password)
    
    # Delete existing admin if exists
    await db.users.delete_many({"username": "admin"})
    
    # Create fresh admin user
    user = {
        "id": "admin-001",
        "badge_number": "ADMIN001",
        "username": "admin",
        "password_hash": hashed,
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
    print(f"   Password hash: {hashed[:50]}...")

if __name__ == "__main__":
    asyncio.run(reset_admin())
