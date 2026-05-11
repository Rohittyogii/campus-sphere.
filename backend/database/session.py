"""
Campus Sphere — Database Session Management
=============================================
Creates the async engine and session factory.
Provides a dependency (get_db) for FastAPI route injection.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import ssl
from backend.config import settings

# Determine if we should use SSL (recommended for Supabase)
connect_args = {}
if "localhost" not in settings.DATABASE_URL_FINAL and "127.0.0.1" not in settings.DATABASE_URL_FINAL:
    # Create an SSL context that does not verify the certificate
    # (Required for Supabase poolers in some cloud environments)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_context

# Async engine — connects to PostgreSQL
engine = create_async_engine(
    settings.DATABASE_URL_FINAL,
    echo=settings.DEBUG,       # Log SQL queries in dev mode
    pool_size=20,              # Connection pool size
    max_overflow=10,           # Extra connections when pool is full
    pool_pre_ping=True,        # Verify connections before use
    connect_args=connect_args,
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
