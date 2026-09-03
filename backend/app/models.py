from datetime import datetime, timezone

import bcrypt
from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    username: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(256),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="viewer",
    )

    full_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    badge_number: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    scans: Mapped[list["Scan"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            self.password_hash.encode("utf-8"),
        )

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "full_name": self.full_name,
            "badge_number": self.badge_number,
            "created_at": self.created_at.isoformat(),
        }


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    image_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    ocr_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    extracted_fields: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    compliance_result: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    overall_status: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    product_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    manufacturer: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    gtin: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="official",
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    mismatch_result: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )

    image_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(
        back_populates="scans",
    )

    def to_dict(self):
        img_url = None

        if self.image_path and self.image_path.startswith("http"):
            img_url = self.image_path

        return {
            "id": self.id,
            "user_id": self.user_id,
            "image_path": self.image_path,
            "image_url": img_url,
            "ocr_text": self.ocr_text,
            "extracted_fields": self.extracted_fields,
            "compliance_result": self.compliance_result,
            "overall_status": self.overall_status,
            "product_name": self.product_name,
            "manufacturer": self.manufacturer,
            "gtin": self.gtin,
            "state": self.state,
            "source": self.source,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "mismatch_result": self.mismatch_result,
            "image_hash": self.image_hash,
            "created_at": self.created_at.isoformat(),
        }