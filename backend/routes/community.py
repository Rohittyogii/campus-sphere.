"""
Campus Sphere — Community Routes
================================
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import Optional, List
import uuid
import shutil
import os

from sqlalchemy.orm import joinedload

from backend.database.session import get_db
from backend.models.community import CommunityPost, CommunityComment
from backend.services.notification_service import create_notification
from backend.models.student import Student
from backend.dependencies import get_current_active_student

router = APIRouter()

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    category: Optional[str] = "General"

class CommentCreate(BaseModel):
    content: str

def _serialize_post(post: CommunityPost, author: Student, comments: List = []) -> dict:
    return {
        "id": post.id,
        "content": post.content,
        "image_url": post.image_url,
        "category": post.category,
        "likes": post.likes or [],
        "created_at": str(post.created_at) if post.created_at else None,
        "author": {
            "name": author.student_name,
            "roll_no": author.roll_no,
            "course": author.course,
        },
        "comments": [
            {
                "id": c.id,
                "content": c.content,
                "created_at": str(c.created_at),
                "author": {
                    "name": c.author.student_name,
                    "roll_no": c.author.roll_no,
                    "course": c.author.course,
                }
            } for c in comments
        ]
    }

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    current_user: Student = Depends(get_current_active_student)
):
    """Save an uploaded image to Supabase Storage and return its URL."""
    import os
    from supabase import create_client
    
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # Try to upload to Supabase if credentials exist
    sb_url = os.getenv("SUPABASE_URL")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if sb_url and sb_key:
        try:
            supabase = create_client(sb_url, sb_key)
            file_content = await file.read()
            # Upload to 'uploads' bucket
            supabase.storage.from_("uploads").upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            # Get public URL
            public_url = supabase.storage.from_("uploads").get_public_url(unique_filename)
            return {"url": public_url}
        except Exception as e:
            print(f"Supabase upload error: {e}")
            # Fallback to local if Supabase fails
    
    # Local fallback (for development)
    file_path = os.path.join("backend/static/uploads", unique_filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    return {"url": f"uploads/{unique_filename}"}

@router.get("/")


async def get_community_posts(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Fetch all community posts with author info."""
    result = await db.execute(
        select(CommunityPost)
        .options(joinedload(CommunityPost.comments).joinedload(CommunityComment.author))
        .order_by(CommunityPost.created_at.desc())
    )
    posts_objs = result.unique().scalars().all()
    
    # We also need authors for the posts (joinedload above only handles comments)
    # Let's do a more robust join for the main post author
    result_with_authors = await db.execute(
        select(CommunityPost, Student)
        .join(Student, CommunityPost.author_id == Student.id)
        .options(joinedload(CommunityPost.comments).joinedload(CommunityComment.author))
        .order_by(CommunityPost.created_at.desc())
    )
    
    final_posts = []
    for post, author in result_with_authors.unique().all():
        final_posts.append(_serialize_post(post, author, post.comments))
    return final_posts

@router.post("/{post_id}/comment")
async def add_comment(
    post_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Add a comment to a post."""
    post = await db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    comment = CommunityComment(
        post_id=post_id,
        author_id=current_user.id,
        content=payload.content
    )
    db.add(comment)
    
    # Notify the author of the post (if it's not the same person)
    if post.author_id != current_user.id:
        await create_notification(
            db,
            student_id=post.author_id,
            title="New Reply on your post! 💬",
            message=f"{current_user.student_name} replied: \"{payload.content[:50]}...\"",
            notif_type="Community"
        )

    await db.commit()
    return {"message": "Comment added successfully"}

@router.post("/create")
async def create_post(
    payload: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Create a new community post."""
    post = CommunityPost(
        author_id=current_user.id,
        content=payload.content,
        image_url=payload.image_url,
        category=payload.category,
        likes=[]
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return {"message": "Post created successfully", "id": post.id}

@router.post("/{post_id}/like")
async def toggle_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Toggle like on a post."""
    post = await db.get(CommunityPost, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    current_likes = list(post.likes) if post.likes else []
    if current_user.id in current_likes:
        current_likes.remove(current_user.id)
    else:
        current_likes.append(current_user.id)
    
    post.likes = current_likes
    await db.commit()
    return {"likes": current_likes}

@router.get("/trends")
async def get_community_trends(db: AsyncSession = Depends(get_db)):
    """Extract common hashtags from recent posts."""
    result = await db.execute(select(CommunityPost.content))
    all_content = [r[0] for r in result.all()]
    
    tags = {}
    for content in all_content:
        for word in content.split():
            if word.startswith("#"):
                tags[word] = tags.get(word, 0) + 1
    
    # Return top 5 tags
    sorted_tags = sorted(tags.items(), key=lambda x: x[1], reverse=True)[:5]
    return [{"tag": t, "count": f"{c} posts"} for t, c in sorted_tags]

@router.get("/contributors")
async def get_top_contributors(db: AsyncSession = Depends(get_db)):
    """Fetch students with the most posts."""
    # Simple count for now
    result = await db.execute(
        select(Student.student_name, func.count(CommunityPost.id))
        .join(CommunityPost, Student.id == CommunityPost.author_id)
        .group_by(Student.id)
        .order_by(func.count(CommunityPost.id).desc())
        .limit(3)
    )
    return [{"name": name, "points": str(count * 100)} for name, count in result.all()]
