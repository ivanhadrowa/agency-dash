import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "chatsell_prod")

if not MONGO_URI:
    # Default for local development
    MONGO_URI = "mongodb://localhost:27017"
    print("WARNING: MONGO_URI not found, using localhost default")

if not MONGO_URI.startswith("mongodb://") and not MONGO_URI.startswith("mongodb+srv://"):
     raise ValueError(f"CRITICAL: Invalid MONGO_URI format. Must start with mongodb:// or mongodb+srv://. Current value: {MONGO_URI[:10]}...")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def get_db():
    return db
