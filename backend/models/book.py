"""
Campus Sphere — Book & Issued Book Models
============================================
Based on: master_books_with_categories.csv (6522 rows)
  — book_id, _unique_key, title, author, editionstatement, publishercode,
    copyrightdate, itemcallnumber, quantity, category_keyword, cluster_label

Based on: barcodes.csv (41467 rows)
  — barcode, book_id, availability_status

Based on: Issued_Books_Library.xlsx (275 rows)
  — issue_date, due_date, barcode, title, author, roll_no, first_name, last_name
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.base import Base


class MasterBook(Base):
    """Represents a unique book title — maps to master_books_with_categories.csv"""
    __tablename__ = "master_books"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, unique=True, index=True)
    unique_key = Column(String(500))
    title = Column(String(500), nullable=False)
    author = Column(String(500))
    editionstatement = Column(String(200))
    publishercode = Column(String(200))
    copyrightdate = Column(String(50))
    itemcallnumber = Column(String(100))
    quantity = Column(Integer)
    category_keyword = Column(String(200))
    cluster_label = Column(String(200))

    # Relationship to barcodes
    barcodes = relationship("Barcode", back_populates="book", primaryjoin="MasterBook.book_id == Barcode.book_id", foreign_keys="[Barcode.book_id]")

    def __repr__(self):
        return f"<MasterBook {self.title}>"


class Barcode(Base):
    """Represents a physical copy (barcode) of a book — maps to barcodes.csv"""
    __tablename__ = "barcodes"

    id = Column(Integer, primary_key=True, index=True)
    barcode = Column(String(50), unique=True, nullable=False, index=True)
    book_id = Column(Integer)
    availability_status = Column(String(50))

    book = relationship("MasterBook", back_populates="barcodes", foreign_keys=[book_id], primaryjoin="Barcode.book_id == MasterBook.book_id")

    def __repr__(self):
        return f"<Barcode {self.barcode}>"


class IssuedBook(Base):
    """Represents a book issue transaction — maps to Issued_Books_Library.xlsx"""
    __tablename__ = "issued_books"

    id = Column(Integer, primary_key=True, index=True)
    issue_date = Column(String(50))
    due_date = Column(String(50))
    barcode = Column(String(50))
    title = Column(String(500))
    author = Column(String(500))
    roll_no = Column(String(30))
    first_name = Column(String(100))
    last_name = Column(String(100))

    student = relationship("Student", back_populates="issued_books", foreign_keys=[roll_no], primaryjoin="IssuedBook.roll_no == Student.roll_no")

    def __repr__(self):
        return f"<IssuedBook {self.title} → {self.roll_no}>"
