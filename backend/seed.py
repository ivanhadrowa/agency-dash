import asyncio
import os
from datetime import datetime, timedelta
import random
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "chatsell_prod")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def seed():
    print("Seeding 'test_company' data...")
    # Clean up
    await db.registered_users.delete_many({"white_label_company_name": "test_company"})
    await db.billing_records.delete_many({"white_label_company_name": "test_company"})
    await db.configurators.delete_many({"white_label_company_name": "test_company"})

    # Users
    users = []
    base_date = datetime.now() - timedelta(days=60)
    for i in range(150):
        # Random date in last 60 days
        created_at = base_date + timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))
        trial_mode = random.random() < 0.3 # 30% trial
        # If not trial, set a reset date. 70% of those will be "active" (last 30 days)
        reset_date = None
        if not trial_mode:
            reset_days_ago = random.randint(0, 45)
            reset_date = datetime.now() - timedelta(days=reset_days_ago)

        users.append({
            "white_label_company_name": "test_company",
            "created_at": created_at,
            "trial_mode": trial_mode,
            "latest_monthly_conversation_limit_reset_date": reset_date,
            "email": f"user{i}@example.com",
            "phone_number": f"+1555000{i:03d}",
            "company_name": f"Client {i}"
        })
    result_users = await db.registered_users.insert_many(users)
    print(f"Inserted {len(result_users.inserted_ids)} users.")

    # Billing Records (Revenue)
    records = []
    clients = [f"Alpha Corp", "Beta LLC", "Gamma Inc", "Delta Co", "Epsilon Ltd"]
    for i in range(200):
        created_at = base_date + timedelta(days=random.randint(0, 60))
        client = random.choice(clients)
        # Random plan
        plan = random.choice([
            {"price": 49, "limit": 2000},
            {"price": 99, "limit": 5000},
            {"price": 299, "limit": 10000}
        ])
        client_price = plan["price"]
        our_price = client_price * 0.4 # 60% margin roughly
        
        records.append({
            "white_label_company_name": "test_company",
            "company_name": client,
            "created_at": created_at,
            "is_active": True,
            "client_price": client_price,
            "our_price": our_price,
            "conversation_limit": plan["limit"]
        })
    result_billing = await db.billing_records.insert_many(records)
    print(f"Inserted {len(result_billing.inserted_ids)} billing records.")

    # Configurators (Team)
    await db.configurators.insert_one({
        "white_label_company_name": "test_company",
        "available_users": [f"user{i}" for i in range(15)],
        "current_user_email": "admin@test_company.com"
    })
    print("Inserted configurators.")
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(seed())
