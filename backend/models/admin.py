"""
Campus Sphere — Admin Models
==============================
Module configuration + admin activity logging.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from backend.database.base import Base


class ModuleConfig(Base):
    """
    Stores enable/disable state for each module.
    Admin can toggle modules dynamically without redeployment.
    """
    __tablename__ = "module_configs"

    id = Column(Integer, primary_key=True, index=True)
    module_name = Column(String(50), unique=True, nullable=False)  # e.g., "cafe", "library"
    display_name = Column(String(100))
    is_enabled = Column(Boolean, default=True)
    config_json = Column(Text)              # Optional JSON config per module
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ModuleConfig {self.module_name} — {'ON' if self.is_enabled else 'OFF'}>"


class AdminLog(Base):
    """Logs admin actions for audit trail."""
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False)
    action = Column(String(200), nullable=False)
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
