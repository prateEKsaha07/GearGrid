from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GearGrid")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

from app.routes.requests import router as requests_router
app.include_router(requests_router, prefix="/requests")

from app.routes.listings import router as listings_router
app.include_router(listings_router, prefix="/listings")

from app.routes.bids import router as bids_router
app.include_router(bids_router, prefix="/bids")









