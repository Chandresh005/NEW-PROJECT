from pathlib import Path

from dotenv import load_dotenv

project_root = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=project_root / ".env")

from app.main import app

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
