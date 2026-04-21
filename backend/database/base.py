"""
Campus Sphere — SQLAlchemy Base
================================
All ORM models inherit from this Base class.
This file is imported by Alembic and by the session module.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.
    Every model in the project will inherit from this.
    """
    pass
