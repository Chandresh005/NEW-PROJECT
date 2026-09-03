import hashlib
import os
import uuid
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import User, Scan

from app.services.ocr_service import process_image_pipeline
from app.services.validation_service import validate_compliance
from app.services.mismatch_service import cross_check
from app.services.report_service import generate_pdf_report


router = APIRouter(
    prefix="/api/scan",
    tags=["Scan"],
)


ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "tiff",
    "bmp",
    "webp",
}


UPLOAD_FOLDER = os.path.join(
    os.path.dirname(
        os.path.dirname(
            os.path.abspath(__file__)
        )
    ),
    "uploads",
)


def allowed_file(filename: str) -> bool:
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


@router.post(
    "/upload",
    status_code=status.HTTP_201_CREATED,
)
async def upload_scan(
    images: Annotated[list[UploadFile], File(...)],
    listing_url: str | None = Form(None),
    gtin: str | None = Form(None),
    state: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload one or more product/package images
    and run the compliance scanning pipeline.
    """

    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True,
    )

    if not images:
        raise HTTPException(
            status_code=400,
            detail="No image files provided",
        )

    image_paths = []

    try:

        # ==================================================
        # 1. SAVE UPLOADED IMAGES
        # ==================================================

        for image in images:

            if not image.filename:
                continue

            if not allowed_file(image.filename):
                continue

            extension = (
                image.filename
                .rsplit(".", 1)[1]
                .lower()
            )

            filename = (
                f"{uuid.uuid4().hex}.{extension}"
            )

            filepath = os.path.join(
                UPLOAD_FOLDER,
                filename,
            )

            contents = await image.read()

            with open(filepath, "wb") as f:
                f.write(contents)

            image_paths.append(filepath)

        if not image_paths:
            raise HTTPException(
                status_code=400,
                detail=(
                    "File type not allowed. "
                    f"Allowed types: "
                    f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
                ),
            )

        # ==================================================
        # 2. PROCESS OCR PIPELINE
        # ==================================================

        pipeline_data = process_image_pipeline(
            image_paths
        )

        extracted_fields = pipeline_data.get(
            "llm_extracted_data",
            {},
        )

        compliance_result = validate_compliance(
            pipeline_data,
            extracted_fields,
        )

        ocr_text = pipeline_data.get(
            "full_text",
            "",
        )

        # ==================================================
        # 3. LISTING CROSS-CHECK
        # ==================================================

        mismatch_result = None

        if listing_url:
            mismatch_result = cross_check(
                listing_url,
                extracted_fields,
            )

        # ==================================================
        # 4. BASIC PRODUCT INFORMATION
        # ==================================================

        product_name = extracted_fields.get(
            "product_name",
            "",
        )

        manufacturer = extracted_fields.get(
            "manufacturer",
            "",
        )

        # ==================================================
        # 5. IMAGE HASH
        # ==================================================

        image_hash = None

        try:

            with open(
                image_paths[0],
                "rb",
            ) as f:

                image_hash = hashlib.sha256(
                    f.read()
                ).hexdigest()

        except Exception as e:

            print(
                f"Hashing failed: {e}"
            )

        # ==================================================
        # 6. CREATE DATABASE RECORD
        # ==================================================

        scan = Scan(
            user_id=current_user.id,
            image_path=image_paths[0],
            ocr_text=ocr_text,
            extracted_fields=extracted_fields,
            compliance_result=compliance_result,
            mismatch_result=mismatch_result,
            gtin=gtin,
            state=state,
            overall_status=(
                compliance_result.get(
                    "overall_status",
                    "unknown",
                )
            ),
            product_name=product_name,
            manufacturer=manufacturer,
            image_hash=image_hash,
        )

        db.add(scan)

        db.commit()

        db.refresh(scan)

        # ==================================================
        # 7. RETURN RESULT
        # ==================================================

        return {
            "message": (
                "Scan uploaded and processed "
                "successfully"
            ),
            "scan": scan.to_dict(),
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        print(
            f"Upload failed: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )


# ==========================================================
# GET SINGLE SCAN
# ==========================================================

@router.get(
    "/{scan_id}",
)
def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a single scan.
    Admin/officer can view all scans.
    Viewer can view only their own scans.
    """

    scan = db.get(
        Scan,
        scan_id,
    )

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    if (
        current_user.role
        not in ("admin", "officer")
        and scan.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    return {
        "scan": scan.to_dict()
    }


# ==========================================================
# GET PDF REPORT
# ==========================================================

@router.get(
    "/{scan_id}/report",
)
def get_report(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate and download a PDF compliance report.
    """

    scan = db.get(
        Scan,
        scan_id,
    )

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found",
        )

    if (
        current_user.role
        not in ("admin", "officer")
        and scan.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    try:

        report_path = generate_pdf_report(
            scan
        )

        if (
            not report_path
            or not os.path.exists(report_path)
        ):
            raise HTTPException(
                status_code=500,
                detail="Failed to generate report",
            )

        return FileResponse(
            path=os.path.abspath(
                report_path
            ),
            media_type="application/pdf",
            filename=(
                f"meterolens_report_"
                f"{scan_id}.pdf"
            ),
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Report generation failed: {str(e)}"
            ),
        )


# ==========================================================
# GTIN RISK
# ==========================================================

@router.get(
    "/gtin/{gtin}/risk",
)
def gtin_risk(
    gtin: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate historical compliance risk for a GTIN.
    """

    scans = (
        db.query(Scan)
        .filter(Scan.gtin == gtin)
        .all()
    )

    if not scans:

        return {
            "gtin": gtin,
            "risk_score": 0,
            "risk_tier": "LOW",
            "total_scans": 0,
            "message": (
                "No history found for this GTIN"
            ),
            "history": [],
        }

    failed_count = sum(
        1
        for scan in scans
        if scan.overall_status
        == "non_compliant"
    )

    review_count = sum(
        1
        for scan in scans
        if scan.overall_status
        == "review_required"
    )

    total = len(scans)

    # Simple risk heuristic: 0-100
    risk_score = min(
        100,
        int(
            (
                (failed_count * 1.0)
                + (review_count * 0.5)
            )
            / total
            * 100
        ),
    )

    if risk_score > 60:
        risk_tier = "HIGH"

    elif risk_score > 30:
        risk_tier = "MEDIUM"

    else:
        risk_tier = "LOW"

    return {
        "gtin": gtin,
        "risk_score": risk_score,
        "risk_tier": risk_tier,
        "total_scans": total,
        "history": [
            {
                "scan_id": scan.id,
                "status": scan.overall_status,
                "date": scan.created_at.isoformat(),
            }
            for scan in scans
        ],
    }


# ==========================================================
# PUBLIC / CITIZEN UPLOAD
# ==========================================================

@router.post(
    "/public-upload",
    status_code=status.HTTP_201_CREATED,
)
async def public_upload_scan(
    images: Annotated[list[UploadFile], File(...)],
    gtin: str | None = Form(None),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Public citizen submission endpoint.
    """

    # ------------------------------------------------------
    # Find anonymous citizen account
    # ------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.username
            == "anonymous_citizen"
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=500,
            detail=(
                "System not ready for "
                "public submissions"
            ),
        )

    if not images:

        raise HTTPException(
            status_code=400,
            detail="No image files provided",
        )

    os.makedirs(
        UPLOAD_FOLDER,
        exist_ok=True,
    )

    image_paths = []

    try:

        # --------------------------------------------------
        # Save images
        # --------------------------------------------------

        for image in images:

            if not image.filename:
                continue

            if not allowed_file(
                image.filename
            ):
                continue

            extension = (
                image.filename
                .rsplit(".", 1)[1]
                .lower()
            )

            filename = (
                f"{uuid.uuid4().hex}.{extension}"
            )

            filepath = os.path.join(
                UPLOAD_FOLDER,
                filename,
            )

            contents = await image.read()

            with open(
                filepath,
                "wb",
            ) as f:

                f.write(contents)

            image_paths.append(
                filepath
            )

        if not image_paths:

            raise HTTPException(
                status_code=400,
                detail=(
                    "File type not allowed. "
                    f"Allowed types: "
                    f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
                ),
            )

        # --------------------------------------------------
        # OCR processing
        # --------------------------------------------------

        pipeline_data = (
            process_image_pipeline(
                image_paths
            )
        )

        extracted_fields = (
            pipeline_data.get(
                "llm_extracted_data",
                {},
            )
        )

        compliance_result = (
            validate_compliance(
                pipeline_data,
                extracted_fields,
            )
        )

        ocr_text = pipeline_data.get(
            "full_text",
            "",
        )

        product_name = (
            extracted_fields.get(
                "product_name",
                "",
            )
        )

        manufacturer = (
            extracted_fields.get(
                "manufacturer",
                "",
            )
        )

        # --------------------------------------------------
        # Hash image
        # --------------------------------------------------

        image_hash = None

        try:

            with open(
                image_paths[0],
                "rb",
            ) as f:

                image_hash = hashlib.sha256(
                    f.read()
                ).hexdigest()

        except Exception as e:

            print(
                f"Hashing failed: {e}"
            )

        # --------------------------------------------------
        # Database record
        # --------------------------------------------------

        scan = Scan(
            user_id=user.id,
            image_path=image_paths[0],
            ocr_text=ocr_text,
            extracted_fields=extracted_fields,
            compliance_result=compliance_result,
            gtin=gtin,
            source="citizen",
            latitude=latitude,
            longitude=longitude,
            overall_status=(
                compliance_result.get(
                    "overall_status",
                    "unknown",
                )
            ),
            product_name=product_name,
            manufacturer=manufacturer,
            image_hash=image_hash,
        )

        db.add(scan)

        db.commit()

        db.refresh(scan)

        return {
            "message": (
                "Scan uploaded successfully. "
                "Thank you for your report."
            ),
            "scan": scan.to_dict(),
        }

    except HTTPException:
        raise

    except Exception as e:

        db.rollback()

        print(
            f"Public upload failed: {e}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}",
        )