from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.routes.auth import router as auth_router
from app.routes.scan import router as scan_router


app = FastAPI(
    title="CompliScan API",
    description="AI-powered Legal Metrology Compliance Checker",
    version="1.0.0",
)


# ==========================================================
# ROUTERS
# ==========================================================

app.include_router(auth_router)
app.include_router(scan_router)


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