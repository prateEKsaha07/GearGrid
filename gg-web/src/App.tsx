import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth & Onboarding
import LandingView from "./pages/auth/LandingView";
import LoginSignup from "./pages/auth/LoginSignup";
import TermsConsent from "./pages/auth/TermsConsent";
import BackendConnecting from "./pages/auth/BackendConnecting";

// System & Status
import DashboardHub from "./pages/dashboard/DashboardHub";
import NotificationCentre from "./pages/dashboard/NotificationCentre";
import SuccessStatus from "./pages/status/SuccessStatus";
import ErrorStatus from "./pages/status/ErrorStatus";
import DevRoutes from "./pages/DevRoutes";

// User Profile
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfile from "./pages/profile/EditProfile";
import ReliabilityRatings from "./pages/profile/ReliabilityRatings";

// Listings & Discovery
import BrowseSearch from "./pages/listing/BrowseSearch";
import BrowseRequests from "./pages/listing/BrowseRequests";
import ListingDetail from "./pages/listing/ListingDetail";
import AddEditListing from "./pages/listing/AddEditListing";
import ListingDashboard from "./pages/listing/ListingDashboard";
import ExtensionApproval from "./pages/listing/ExtensionApproval";
import RelistDecision from "./pages/listing/RelistDecision";

// Renter Requests
import PostRequest from "./pages/request/PostRequest";
import RequestDashboard from "./pages/request/RequestDashboard";
import RequestDetail from "./pages/request/RequestDetail";

// Bookings & Lifecycle
import BookingConfirmation from "./pages/booking/BookingConfirmation";
import TrackBooking from "./pages/booking/TrackBooking";
import PickupFlow from "./pages/booking/PickupFlow";
import ActiveRental from "./pages/booking/ActiveRental";
import ReturnFlow from "./pages/booking/ReturnFlow";
import InvoiceView from "./pages/booking/InvoiceView";
import ExtensionRequest from "./pages/request/ExtensionRequest";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth & Onboarding */}
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/terms" element={<TermsConsent />} />
        <Route path="/connecting" element={<BackendConnecting />} />

        {/* Dashboard & Status */}
        <Route path="/dashboard" element={<DashboardHub />} />
        <Route path="/notifications" element={<NotificationCentre />} />
        <Route path="/success" element={<SuccessStatus />} />
        <Route path="/error" element={<ErrorStatus />} />

        {/* User Profile */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/ratings" element={<ReliabilityRatings />} />

        {/* Listings & Discovery */}
        <Route path="/browse" element={<BrowseSearch />} />
        <Route path="/browse/requests" element={<BrowseRequests />} />
        <Route path="/listings/new" element={<AddEditListing />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/listings/:id/manage" element={<ListingDashboard />} />
        <Route path="/listings/:id/extension" element={<ExtensionApproval />} />
        <Route path="/listings/:id/relist" element={<RelistDecision />} />

        {/* Requests */}
        <Route path="/requests" element={<RequestDashboard />} />
        <Route path="/requests/new" element={<PostRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />

        {/* Bookings Lifecycle */}
        <Route path="/bookings/:id/confirm" element={<BookingConfirmation />} />
        <Route path="/bookings/:id/track" element={<TrackBooking />} />
        <Route path="/bookings/:id/pickup" element={<PickupFlow />} />
        <Route path="/bookings/:id/active" element={<ActiveRental />} />
        <Route path="/bookings/:id/return" element={<ReturnFlow />} />
        <Route path="/bookings/:id/invoice" element={<InvoiceView />} />
        <Route path="/bookings/:id/extension" element={<ExtensionRequest />} />

        {/* Developer Sandbox */}
        <Route path="/dev" element={<DevRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}