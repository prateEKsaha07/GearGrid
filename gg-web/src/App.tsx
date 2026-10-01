import LandingView from "./pages/auth/LandingView";
import LoginSignup from "./pages/auth/LoginSignup";
import SuccessStatus from "./pages/status/SuccessStatus";
import ErrorStatus from "./pages/status/ErrorStatus";
import DashboardHub from "./pages/dashboard/DashboardHub";
import PostRequest from "./pages/request/PostRequest";
import NotificationCentre from "./pages/dashboard/NotificationCentre";
import ProfilePage from "./pages/profile/ProfilePage";
import EditProfile from "./pages/profile/EditProfile";
import ReliabilityRatings from "./pages/profile/ReliabilityRatings";
import BrowseSearch from "./pages/listing/BrowseSearch";
import ListingDetail from "./pages/listing/ListingDetail";
import AddEditListing from "./pages/listing/AddEditListing";
import ListingDashboard from "./pages/listing/ListingDashboard";
import BookingConfirmation from "./pages/booking/BookingConfirmation";
import PickupFlow from "./pages/booking/PickupFlow";
import ActiveRental from "./pages/booking/ActiveRental";
import ReturnFlow from "./pages/booking/ReturnFlow";
import InvoiceView from "./pages/booking/InvoiceView";
import ExtensionRequest from "./pages/request/ExtensionRequest";
import ExtensionApproval from "./pages/listing/ExtensionApproval";
import RelistDecision from "./pages/listing/RelistDecision";
import RequestDetail from "./pages/request/RequestDetail";
import RequestDashboard from "./pages/request/RequestDashboard";
import BackendConnecting from "./pages/auth/BackendConnecting";
import TermsConsent from "./pages/auth/TermsConsent";
import TrackBooking from "./pages/booking/TrackBooking";
import DevRoutes from "./pages/DevRoutes";

import { BrowserRouter, Routes, Route } from "react-router-dom";

// function TermsConsent() { return <div>TermsConsent</div>; }
// function BackendConnecting() { return <div>BackendConnecting</div>; }
// function ExtensionApproval() { return <div>ExtensionApproval</div>; }
// function RelistDecision() { return <div>RelistDecision</div>; }
// function RequestDetail() { return <div>RequestDetail</div>; }
// function RequestDashboard() { return <div>RequestDashboard</div>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/terms" element={<TermsConsent />} />
        <Route path="/connecting" element={<BackendConnecting />} />
        <Route path="/dashboard" element={<DashboardHub />} />
        <Route path="/notifications" element={<NotificationCentre />} />
        <Route path="/success" element={<SuccessStatus />} />
        <Route path="/error" element={<ErrorStatus />} />
        <Route path="/browse" element={<BrowseSearch />} />
        <Route path="/listings/new" element={<AddEditListing />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/listings/:id/manage" element={<ListingDashboard />} />
        <Route path="/listings/:id/extension" element={<ExtensionApproval />} />
        <Route path="/listings/:id/relist" element={<RelistDecision />} />
        <Route path="/requests/new" element={<PostRequest />} />
        <Route path="/requests" element={<RequestDashboard />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route path="/bookings/:id/confirm" element={<BookingConfirmation />} />
        <Route path="/bookings/:id/pickup" element={<PickupFlow />} />
        <Route path="/bookings/:id/active" element={<ActiveRental />} />
        <Route path="/bookings/:id/return" element={<ReturnFlow />} />
        <Route path="/bookings/:id/invoice" element={<InvoiceView />} />
        <Route path="/bookings/:id/extension" element={<ExtensionRequest />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/profile/ratings" element={<ReliabilityRatings />} />
        <Route path="/bookings/:id/track" element={<TrackBooking />} />
        <Route path="/dev" element={<DevRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;