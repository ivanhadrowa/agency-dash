from datetime import datetime, timedelta
from typing import Optional, Literal

def build_date_match(from_date: Optional[datetime], to_date: Optional[datetime]):
    match = {}
    if from_date or to_date:
        match["created_at"] = {}
        if from_date:
            match["created_at"]["$gte"] = from_date
        if to_date:
            match["created_at"]["$lte"] = to_date
    return match

def users_summary_pipeline(wl_name: str, from_date: Optional[datetime] = None, to_date: Optional[datetime] = None):
    match_stage = {"white_label_company_name": wl_name}
    date_match = build_date_match(from_date, to_date)
    if date_match and "created_at" in date_match:
        match_stage["created_at"] = date_match["created_at"]

    active_threshold = datetime.now() - timedelta(days=30)
    return [
        {"$match": match_stage},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "conversations": {"$sum": {"$ifNull": ["$current_monthly_conversation_count", 0]}},
            "active": {
                "$sum": {"$cond": [
                    {"$and": [
                        {"$eq": ["$trial_mode", False]},
                        {"$gte": ["$latest_monthly_conversation_limit_reset_date", active_threshold]}
                    ]},
                    1, 
                    0
                ]}
            },
            "demo": {
                "$sum": {"$cond": [{"$eq": ["$trial_mode", True]}, 1, 0]}
            },
            "avg_activation_ms": {
                "$avg": {
                    "$cond": [
                        {"$and": [
                            {"$ne": ["$latest_monthly_conversation_limit_reset_date", None]},
                            {"$ne": ["$created_at", None]}
                        ]},
                        {"$subtract": ["$latest_monthly_conversation_limit_reset_date", "$created_at"]},
                        None
                    ]
                }
            }
        }},
        {"$project": {"_id": 0}}
    ]

def users_timeseries_pipeline(wl_name: str, from_date: Optional[datetime], to_date: Optional[datetime], bucket: Literal["day", "month"] = "day", timezone: str = "America/Argentina/Buenos_Aires"):
    date_format = "%Y-%m-%d" if bucket == "day" else "%Y-%m"
    match_stage = {"white_label_company_name": wl_name}
    date_match = build_date_match(from_date, to_date)
    if date_match and "created_at" in date_match:
        match_stage["created_at"] = date_match["created_at"]

    return [
        {"$match": match_stage},
        {"$group": {
            "_id": {"$dateToString": {"format": date_format, "date": "$created_at", "timezone": timezone}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]

def finance_summary_pipeline(wl_name: str, from_date: Optional[datetime], to_date: Optional[datetime]):
    match_stage = {"white_label_company_name": wl_name, "is_active": True}
    date_match = build_date_match(from_date, to_date)
    if date_match and "created_at" in date_match:
        match_stage["created_at"] = date_match["created_at"]

    return [
        {"$match": match_stage},
        {"$group": {
            "_id": None,
            "revenue": {"$sum": "$client_price"},
            "cost": {"$sum": "$our_price"}
        }},
        {"$project": {
            "_id": 0,
            "revenue": 1,
            "cost": 1,
            "profit": {"$subtract": ["$revenue", "$cost"]},
            "margin": {
                "$cond": [
                    {"$eq": ["$revenue", 0]},
                    0,
                    {"$divide": [{"$subtract": ["$revenue", "$cost"]}, "$revenue"]}
                ]
            }
        }}
    ]

def finance_timeseries_pipeline(wl_name: str, from_date: Optional[datetime], to_date: Optional[datetime], bucket: Literal["month"] = "month", timezone: str = "America/Argentina/Buenos_Aires"):
    date_format = "%Y-%m" # Usually monthly for finance
    match_stage = {"white_label_company_name": wl_name, "is_active": True}
    date_match = build_date_match(from_date, to_date)
    if date_match and "created_at" in date_match:
        match_stage["created_at"] = date_match["created_at"]

    return [
        {"$match": match_stage},
        {"$group": {
            "_id": {"$dateToString": {"format": date_format, "date": "$created_at", "timezone": timezone}},
            "revenue": {"$sum": "$client_price"},
            "cost": {"$sum": "$our_price"}
        }},
        {"$addFields": {
            "profit": {"$subtract": ["$revenue", "$cost"]}
        }},
        {"$sort": {"_id": 1}}
    ]

def top_profitable_pipeline(wl_name: str, from_date: Optional[datetime], to_date: Optional[datetime], limit: int = 5):
    match_stage = {"white_label_company_name": wl_name, "is_active": True}
    date_match = build_date_match(from_date, to_date)
    if date_match and "created_at" in date_match:
        match_stage["created_at"] = date_match["created_at"]

    return [
        {"$match": match_stage},
        {"$group": {
            "_id": "$company_name", 
            "revenue": {"$sum": "$client_price"},
            "cost": {"$sum": "$our_price"}
        }},
        {"$lookup": {
            "from": "registered_users",
            "let": {"company": "$_id", "wl": wl_name},
            "pipeline": [
                {"$match": {
                    "$expr": {
                        "$and": [
                            {"$eq": ["$company_name", "$$company"]},
                            {"$eq": ["$white_label_company_name", "$$wl"]}
                        ]
                    }
                }},
                {"$group": {
                    "_id": None,
                    "total_convs": {"$sum": {"$ifNull": ["$current_monthly_conversation_count", 0]}}
                }}
            ],
            "as": "usage"
        }},
        {"$addFields": {
            "conversations": {"$ifNull": [{"$arrayElemAt": ["$usage.total_convs", 0]}, 0]},
            "profit": {"$subtract": ["$revenue", "$cost"]}
        }},
        {"$sort": {"profit": -1}},
        {"$limit": limit}
    ]

def team_summary_pipeline(wl_name: str):
    return [
        {"$match": {"white_label_company_name": wl_name}},
        {"$group": {
            "_id": None,
            "total_configurators": {"$sum": 1},
            "assignable_users": {"$sum": {"$size": {"$ifNull": ["$available_users", []]}}},
            # Assuming 'role' or something distinguishes admin, but user says "Configuradores admin vs no admin".
            # The user didn't specify the field for admin. 'is_admin'?
            # "Configuradores admin vs no admin"
            # I will check if I can infer it. For now I'll just count total.
            # Only user provided provided fields: available_users, current_user_email.
            # I will omit admin/non-admin split if I don't know the field, or use conditional if I find a likely field.
            # I'll stick to total and assignable_users.
        }},
        {"$project": {"_id": 0}}
    ]

def client_plan_distribution_pipeline(wl_name: str):
    active_threshold = datetime.now() - timedelta(days=30)
    return [
        {"$match": {
            "white_label_company_name": wl_name,
            "trial_mode": False,
            "latest_monthly_conversation_limit_reset_date": {"$gte": active_threshold}
        }},
        {"$project": {
            "plan_type": {
                "$switch": {
                    "branches": [
                        {"case": {"$lte": ["$current_monthly_conversation_limit", 2500]}, "then": "Pequeño (<= 2500)"},
                        {"case": {"$and": [{"$gt": ["$current_monthly_conversation_limit", 2500]}, {"$lte": ["$current_monthly_conversation_limit", 7500]}]}, "then": "Mediano (2501-7500)"},
                        {"case": {"$gt": ["$current_monthly_conversation_limit", 7500]}, "then": "Grande (> 7500)"}
                    ],
                    "default": "Desconocido"
                }
            }
        }},
        {"$group": {
            "_id": "$plan_type",
            "count": {"$sum": 1}
        }}
    ]

def brands_ranking_pipeline():
    active_threshold = datetime.now() - timedelta(days=30)
    return [
        {"$match": {"white_label_company_name": {"$ne": None}}},
        {"$group": {
            "_id": "$white_label_company_name",
            "total_users": {"$sum": 1},
            "active_users": {
                "$sum": {"$cond": [
                    {"$and": [
                        {"$eq": ["$trial_mode", False]},
                        {"$gte": ["$latest_monthly_conversation_limit_reset_date", active_threshold]}
                    ]},
                    1, 
                    0
                ]}
            }
        }},
        {"$sort": {"total_users": -1}},
        {"$limit": 100}
    ]
