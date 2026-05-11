"""
Campus Sphere — Community Model
==============================
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from backend.database.base import Base


from sqlalchemy.orm import relationship

class CommunityPost(Base):
    """Represents a social post in the campus community wall."""
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500))
    category = Column(String(50), default="General")  # e.g. "Achievement", "Event", "Question"
    
    # Store likes as a list of student IDs
    likes = Column(JSON, default=[]) 
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CommunityPost {self.id} by {self.author_id}>"


class CommunityComment(Base):
    """Represents a reply/comment on a community post."""
    __tablename__ = "community_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    content = Column(Text, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    post = relationship("CommunityPost", back_populates="comments")
    author = relationship("Student")
