"""
Campus Sphere — Database Session Management
=============================================
Creates the async engine and session factory.
Provides a dependency (get_db) for FastAPI route injection.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.config import settings

# Async engine — connects to PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,       # Log SQL queries in dev mode
    pool_size=20,              # Connection pool size
    max_overflow=10,           # Extra connections when pool is full
    pool_pre_ping=True,        # Verify connections before use
)

# Session factory — creates new sessions
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,    # Keep data accessible after commit
)


async def get_db():
    """
    FastAPI dependency that provides a database session.
    Usage in routes:
        async def my_route(db: AsyncSession = Depends(get_db)):
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
