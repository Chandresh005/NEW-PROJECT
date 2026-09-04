from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Scan

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


def require_officer_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "officer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin or officer role required.",
        )
    return current_user


@router.get("/stats")
def get_stats(
    current_user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db),
):
    try:
        total_scans = db.query(Scan).count()
        compliant = db.query(Scan).filter(Scan.overall_status == "compliant").count()
        non_compliant = db.query(Scan).filter(Scan.overall_status == "non_compliant").count()
        partially_compliant = db.query(Scan).filter(Scan.overall_status == "partially_compliant").count()

        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_scans = (
            db.query(Scan)
            .filter(Scan.created_at >= seven_days_ago)
            .order_by(Scan.created_at.desc())
            .limit(10)
            .all()
        )

        scans_per_day = []
        for i in range(6, -1, -1):
            day = datetime.now(timezone.utc).date() - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            count = (
                db.query(Scan)
                .filter(Scan.created_at >= day_start, Scan.created_at < day_end)
                .count()
            )
            scans_per_day.append({
                "date": day.isoformat(),
                "count": count,
            })

        violation_rows = (
            db.query(Scan.compliance_result)
            .filter(Scan.compliance_result.isnot(None))
            .all()
        )
        violation_counts = {}
        for (result,) in violation_rows:
            if isinstance(result, dict):
                checks = result.get("checks", [])
                for check in checks:
                    if check.get("status") == "fail":
                        rule = check.get("rule_name", "Unknown")
                        violation_counts[rule] = violation_counts.get(rule, 0) + 1

        top_violations = sorted(
            violation_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
        top_violations_list = [
            {"rule": rule, "count": count} for rule, count in top_violations
        ]

        return {
            "stats": {
                "total_scans": total_scans,
                "compliant": compliant,
                "non_compliant": non_compliant,
                "partially_compliant": partially_compliant,
                "recent_scans": [s.to_dict() for s in recent_scans],
                "scans_per_day": scans_per_day,
                "top_violations": top_violations_list,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch stats: {str(e)}",
        )


@router.get("/scans")
def get_all_scans(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    source: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    manufacturer: Optional[str] = None,
    current_user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Scan)

        if status:
            query = query.filter(Scan.overall_status == status)
        if source:
            query = query.filter(Scan.source == source)
        if date_from:
            try:
                df = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
                query = query.filter(Scan.created_at >= df)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date_from format. Use ISO 8601.",
                )
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
                query = query.filter(Scan.created_at <= dt)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date_to format. Use ISO 8601.",
                )
        if manufacturer:
            query = query.filter(
                Scan.manufacturer.ilike(f"%{manufacturer}%")
            )

        total_items = query.count()
        total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 1
        items = (
            query.order_by(Scan.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        return {
            "scans": [s.to_dict() for s in items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_pages": total_pages,
                "total_items": total_items,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch scans: {str(e)}",
        )


@router.get("/map")
def get_map_data(
    current_user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db),
):
    try:
        state_rows = (
            db.query(
                Scan.state,
                func.count(Scan.id).label("total"),
                func.sum(case((Scan.overall_status == "compliant", 1), else_=0)).label("compliant"),
                func.sum(case((Scan.overall_status == "non_compliant", 1), else_=0)).label("non_compliant"),
            )
            .filter(Scan.state.isnot(None), Scan.state != "")
            .group_by(Scan.state)
            .all()
        )

        states = []
        for row in state_rows:
            total = row.total or 0
            comp = int(row.compliant or 0)
            non_comp = int(row.non_compliant or 0)
            states.append({
                "state": row.state,
                "total": total,
                "compliant": comp,
                "non_compliant": non_comp,
                "violation_rate": round((non_comp / total * 100), 1) if total > 0 else 0.0,
            })

        return {"states": states}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch map data: {str(e)}",
        )


@router.get("/alerts")
def get_repeat_offenders(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db),
):
    try:
        gtin_rows = (
            db.query(
                Scan.gtin,
                Scan.product_name,
                Scan.manufacturer,
                func.count(Scan.id).label("total_scans"),
                func.sum(case((Scan.overall_status == "non_compliant", 1), else_=0)).label("fail_count"),
                func.max(Scan.created_at).label("last_seen"),
            )
            .filter(Scan.gtin.isnot(None), Scan.gtin != "")
            .group_by(Scan.gtin, Scan.product_name, Scan.manufacturer)
            .having(func.count(Scan.id) > 1)
            .order_by(desc("fail_count"))
            .limit(limit)
            .all()
        )

        alerts = []
        for row in gtin_rows:
            total = row.total_scans or 0
            fails = int(row.fail_count or 0)
            risk_score = min(100, int((fails / total) * 100)) if total > 0 else 0
            alerts.append({
                "gtin": row.gtin,
                "product_name": row.product_name or "Unknown",
                "manufacturer": row.manufacturer or "Unknown",
                "total_scans": total,
                "fail_count": fails,
                "risk_score": risk_score,
                "last_seen": row.last_seen.isoformat() if row.last_seen else None,
            })

        return {"alerts": alerts}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch alerts: {str(e)}",
        )


@router.get("/leads")
def get_citizen_leads(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_officer_or_admin),
    db: Session = Depends(get_db),
):
    try:
        leads = (
            db.query(Scan)
            .filter(Scan.source == "citizen")
            .filter(Scan.overall_status.in_(["non_compliant", "partially_compliant"]))
            .order_by(Scan.created_at.desc())
            .limit(limit)
            .all()
        )

        return {
            "leads": [lead.to_dict() for lead in leads]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch leads: {str(e)}",
        )
