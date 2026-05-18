from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.session import init_db
from routers import auth, portfolio, properties, budget, contractors, progress, agent
from core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Property Construction Agent API",
    description="Backend for the Property Construction Agent SaaS platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(portfolio.router,   prefix="/api/portfolios",  tags=["portfolio"])
app.include_router(properties.router,  prefix="/api/properties",  tags=["properties"])
app.include_router(budget.router,      prefix="/api/budget",      tags=["budget"])
app.include_router(contractors.router, prefix="/api/contractors", tags=["contractors"])
app.include_router(progress.router,    prefix="/api/progress",    tags=["progress"])
app.include_router(agent.router,       prefix="/api/agent",       tags=["agent"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
