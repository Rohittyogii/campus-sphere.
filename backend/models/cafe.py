"""
Campus Sphere — Cafe Item Model
==================================
Based on: Cafe_Menu.xlsx (22 rows)
Columns: itemid, item_name, category, price, availability_status
"""

from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.database.base import Base


class CafeItem(Base):
    """Represents a cafe menu item — maps to Cafe_Menu.xlsx"""
    __tablename__ = "cafe_items"

    id = Column(Integer, primary_key=True, index=True)
    itemid = Column(String(50), unique=True)
    item_name = Column(String(200), nullable=False)
    category = Column(String(100))
    price = Column(Float, nullable=False)
    availability_status = Column(String(50))

    def __repr__(self):
        return f"<CafeItem {self.item_name} — ₹{self.price}>"
