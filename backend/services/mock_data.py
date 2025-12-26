from datetime import datetime, timedelta

MOCK_SUMMARY = {"total": 125, "active": 85, "demo": 40, "conversations": 4500, "avg_activation_ms": 259200000} # 3 days in ms
MOCK_FINANCE = {"revenue": 12350, "cost": 3705, "profit": 8645, "margin": 0.70}
MOCK_TEAM = {"total_configurators": 5, "assignable_users": 15}

def get_mock_users_timeseries(bucket):
    data = []
    base = datetime.now() - timedelta(days=30)
    for i in range(30):
        d = base + timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        data.append({"_id": date_str, "count": (i % 5) + 2})
    return data

def get_mock_finance_timeseries(bucket):
    data = []
    base = datetime.now() - timedelta(days=180)
    for i in range(6):
        d = base + timedelta(days=i*30)
        date_str = d.strftime("%Y-%m")
        rev = 2000 + i * 500
        cost = rev * 0.3
        data.append({
            "_id": date_str,
            "revenue": rev,
            "cost": cost,
            "profit": rev - cost
        })
    return data

MOCK_TOP_PROFIT = [
    {"_id": "Alpha Corp", "revenue": 5000, "cost": 1500, "profit": 3500, "conversations": 1200},
    {"_id": "Beta LLC", "revenue": 3000, "cost": 900, "profit": 2100, "conversations": 950},
    {"_id": "Gamma Inc", "revenue": 2000, "cost": 600, "profit": 1400, "conversations": 600},
    {"_id": "Delta Co", "revenue": 1500, "cost": 450, "profit": 1050, "conversations": 450},
    {"_id": "Epsilon Ltd", "revenue": 850, "cost": 255, "profit": 595, "conversations": 300},
]

MOCK_CLIENT_DIST = [
    {"_id": "Small", "count": 60},
    {"_id": "Medium", "count": 30},
    {"_id": "Large", "count": 10},
    {"_id": "Unknown", "count": 25},
]

MOCK_BRANDS_RANKING = [
    {"_id": "Agency Alpha", "total_users": 120, "active_users": 80},
    {"_id": "Beta Solutions", "total_users": 95, "active_users": 70},
    {"_id": "Gamma Growth", "total_users": 60, "active_users": 40},
    {"_id": "Delta Digital", "total_users": 45, "active_users": 10},
    {"_id": "Echo Enterprise", "total_users": 30, "active_users": 5},
    {"_id": "Zeta Zone", "total_users": 15, "active_users": 2},
]
