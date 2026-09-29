from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.requests import router as requests_router
from app.routes.listings import router as listings_router
from app.routes.bids import router as bids_router
from app.routes.bookings import router as bookings_router
from app.routes.agreements import router as agreements_router
from app.routes.invoices import router as invoices_router
from app.routes.payments import router as payments_router
from app.routes.extensions import router as extensions_router
from app.routes.ratings import router as ratings_router

app = FastAPI(title="GearGrid")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests_router, prefix="/requests")
app.include_router(listings_router, prefix="/listings")
app.include_router(bids_router, prefix="/bids")
app.include_router(bookings_router, prefix="/bookings")
app.include_router(agreements_router, prefix="/agreements")
app.include_router(invoices_router, prefix="/invoices")
app.include_router(payments_router, prefix="/payments")
app.include_router(extensions_router, prefix="/extensions")
app.include_router(ratings_router, prefix="/ratings")


@app.get("/health")
def health():
    return {"status": "ok"}