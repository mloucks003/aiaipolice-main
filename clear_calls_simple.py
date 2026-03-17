#!/usr/bin/env python3
"""Clear all calls using pymongo"""
from pymongo import MongoClient

# Connect to production MongoDB
mongo_url = "mongodb+srv://admin:Admin1234@cluster0.cr10lmh.mongodb.net/?appName=Cluster0"
client = MongoClient(mongo_url)
db = client["law_enforcement_rms"]

# Delete all calls
result = db.active_calls.delete_many({})

print(f"✅ Cleared {result.deleted_count} calls from the database")

client.close()
