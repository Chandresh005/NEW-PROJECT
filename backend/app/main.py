import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles

from app.database import Base, SessionLocal, engine
from app.models import User
from app.routes.auth import router as auth_router
from app.routes.dashboard import router as dashboard_router
from app.routes.history import router as history_router
from app.routes.scan import router as scan_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema exists
    Base.metadata.create_all(bind=engine)

    # Seed default admin user if absent
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@meterolens.in").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@meterolens.in",
                role="admin",
                full_name="System Admin",
                badge_number="ADMIN-001",
            )
            admin_user.set_password("admin123")
            db.add(admin_user)
            db.commit()
    except Exception as e:
        print(f"Error seeding default admin: {e}")
        db.rollback()
    finally:
        db.close()

    yield


app = FastAPI(
    title="CompliScan API",
    description="AI-powered Legal Metrology Compliance Checker",
    version="1.0.0",
    lifespan=lifespan,
)

# ==========================================================
# CORS MIDDLEWARE
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# STATIC FILES (UPLOADS)
# ==========================================================

uploads_path = Path(__file__).resolve().parent.parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


# ==========================================================
# ROUTERS
# ==========================================================

app.include_router(auth_router)
app.include_router(scan_router)
app.include_router(dashboard_router)
app.include_router(history_router)


# ==========================================================
# BASIC ENDPOINTS
# ==========================================================

@app.get("/")
def read_root():
    return {
        "message": "CompliScan API"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CompliScan API"
    }


# ==========================================================
# SWAGGER / OPENAPI FILE UPLOAD FIX
# ==========================================================

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Convert FastAPI/OpenAPI 3.1 file representation
    # into the binary format Swagger UI handles reliably.
    schemas = openapi_schema.get(
        "components",
        {}
    ).get(
        "schemas",
        {}
    )

    for schema in schemas.values():

        properties = schema.get(
            "properties",
            {}
        )

        for property_schema in properties.values():

            # Handle list[UploadFile]
            if (
                property_schema.get("type") == "array"
                and "items" in property_schema
            ):

                items = property_schema["items"]

                if (
                    items.get("type") == "string"
                    and items.get("contentMediaType")
                    == "application/octet-stream"
                ):
                    items.pop(
                        "contentMediaType",
                        None
                    )

                    items["format"] = "binary"

    # Swagger UI has better compatibility with
    # OpenAPI 3.0 binary file definitions.
    openapi_schema["openapi"] = "3.0.3"

    app.openapi_schema = openapi_schema

    return app.openapi_schema


app.openapi = custom_openapi