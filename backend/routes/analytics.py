from fastapi import APIRouter, Path, Query
from typing import Optional, Literal
from datetime import date, datetime, time
from database import get_db
from services import pipelines, mock_data
import pymongo.errors


router = APIRouter(prefix="/analytics")

def to_datetime(d: Optional[date], end_of_day=False) -> Optional[datetime]:
    if not d:
        return None
    t = time.max if end_of_day else time.min
    return datetime.combine(d, t)

@router.get("/{wl_name}/summary")
async def get_summary(
    wl_name: str = Path(...),
    start: Optional[date] = Query(None, alias="from"),
    end: Optional[date] = Query(None, alias="to")
):
    try:
        db = await get_db()
        cursor = db.registered_users.aggregate(pipelines.users_summary_pipeline(
            wl_name, to_datetime(start), to_datetime(end, True)
        ))
        result = await cursor.to_list(length=1)
        return result[0] if result else {"total": 0, "active": 0, "demo": 0}
    except Exception:
        return mock_data.MOCK_SUMMARY

@router.get("/{wl_name}/users/timeseries")
async def get_users_timeseries(
    wl_name: str = Path(...),
    start: Optional[date] = Query(None, alias="from"),
    end: Optional[date] = Query(None, alias="to"),
    bucket: Literal["day", "month"] = "day"
):
    try:
        db = await get_db()
        cursor = db.registered_users.aggregate(pipelines.users_timeseries_pipeline(
            wl_name, to_datetime(start), to_datetime(end, True), bucket
        ))
        return await cursor.to_list(length=1000)
    except Exception:
        return mock_data.get_mock_users_timeseries(bucket)

@router.get("/{wl_name}/finance/summary")
async def get_finance_summary(
    wl_name: str = Path(...),
    start: Optional[date] = Query(None, alias="from"),
    end: Optional[date] = Query(None, alias="to")
):
    try:
        db = await get_db()
        cursor = db.billing_records.aggregate(pipelines.finance_summary_pipeline(
            wl_name, to_datetime(start), to_datetime(end, True)
        ))
        result = await cursor.to_list(length=1)
        return result[0] if result else {"revenue": 0, "cost": 0, "profit": 0, "margin": 0}
    except Exception:
        return mock_data.MOCK_FINANCE

@router.get("/{wl_name}/finance/timeseries")
async def get_finance_timeseries(
    wl_name: str = Path(...),
    start: Optional[date] = Query(None, alias="from"),
    end: Optional[date] = Query(None, alias="to"),
    bucket: Literal["month"] = "month"
):
    try:
        db = await get_db()
        cursor = db.billing_records.aggregate(pipelines.finance_timeseries_pipeline(
            wl_name, to_datetime(start), to_datetime(end, True), bucket
        ))
        return await cursor.to_list(length=1000)
    except Exception:
        return mock_data.get_mock_finance_timeseries(bucket)

@router.get("/{wl_name}/top/profit")
async def get_top_profitable(
    wl_name: str = Path(...),
    start: Optional[date] = Query(None, alias="from"),
    end: Optional[date] = Query(None, alias="to"),
    limit: int = 5
):
    try:
        db = await get_db()
        cursor = db.billing_records.aggregate(pipelines.top_profitable_pipeline(
            wl_name, to_datetime(start), to_datetime(end, True), limit
        ))
        return await cursor.to_list(length=limit)
    except Exception:
        return mock_data.MOCK_TOP_PROFIT

@router.get("/{wl_name}/team/summary")
async def get_team_summary(wl_name: str = Path(...)):
    try:
        db = await get_db()
        cursor = db.configurators.aggregate(pipelines.team_summary_pipeline(wl_name))
        result = await cursor.to_list(length=1)
        return result[0] if result else {"total_configurators": 0, "assignable_users": 0}
    except Exception:
        return mock_data.MOCK_TEAM

@router.get("/{wl_name}/client/distribution")
async def get_client_distribution(wl_name: str = Path(...)):
    try:
        db = await get_db()
        cursor = db.registered_users.aggregate(pipelines.client_plan_distribution_pipeline(wl_name))
        return await cursor.to_list(length=10)
    except Exception:
        return mock_data.MOCK_CLIENT_DIST

@router.get("/brands")
async def get_brands_ranking():
    try:
        db = await get_db()
        cursor = db.registered_users.aggregate(pipelines.brands_ranking_pipeline())
        return await cursor.to_list(length=100)
    except Exception:
        return mock_data.MOCK_BRANDS_RANKING
