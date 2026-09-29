import LandingView from "./pages/auth/LandingView";
import LoginSignup from "./pages/auth/LoginSignup";
import SuccessStatus from "./pages/status/SuccessStatus";
import ErrorStatus from "./pages/status/ErrorStatus";
import DashboardHub from "./pages/dashboard/DashboardHub";
import PostRequest from "./pages/request/PostRequest";

import { BrowserRouter, Routes, Route } from "react-router-dom";

// function TermsConsent() { return <div>TermsConsent</div>; }
// function BackendConnecting() { return <div>BackendConnecting</div>; }
// function NotificationCentre() { return <div>NotificationCentre</div>; }
// function BrowseSearch() { return <div>BrowseSearch</div>; }
// function ListingDetail() { return <div>ListingDetail</div>; }
// function AddEditListing() { return <div>AddEditListing</div>; }
// function ListingDashboard() { return <div>ListingDashboard</div>; }
// function ExtensionApproval() { return <div>ExtensionApproval</div>; }
// function RelistDecision() { return <div>RelistDecision</div>; }
// function PostRequest() { return <div>PostRequest</div>; }
// function RequestDetail() { return <div>RequestDetail</div>; }
// function RequestDashboard() { return <div>RequestDashboard</div>; }
// function ExtensionRequest() { return <div>ExtensionRequest</div>; }
// function BookingConfirmation() { return <div>BookingConfirmation</div>; }
// function PickupFlow() { return <div>PickupFlow</div>; }
// function ActiveRental() { return <div>ActiveRental</div>; }
// function ReturnFlow() { return <div>ReturnFlow</div>; }
// function InvoiceView() { return <div>InvoiceView</div>; }
// function ProfilePage() { return <div>ProfilePage</div>; }
// function EditProfile() { return <div>EditProfile</div>; }
// function ReliabilityRatings() { return <div>ReliabilityRatings</div>; }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="/login" element={<LoginSignup />} />
        {/* <Route path="/terms" element={<TermsConsent />} /> */}
        {/* <Route path="/connecting" element={<BackendConnecting />} /> */}
        <Route path="/dashboard" element={<DashboardHub />} />
        {/* <Route path="/notifications" element={<NotificationCentre />} /> */}
        <Route path="/success" element={<SuccessStatus />} />
        <Route path="/error" element={<ErrorStatus />} />
        {/* <Route path="/browse" element={<BrowseSearch />} /> */}
        {/* <Route path="/listings/new" element={<AddEditListing />} /> */}
        {/* <Route path="/listings/:id" element={<ListingDetail />} /> */}
        {/* <Route path="/listings/:id/manage" element={<ListingDashboard />} /> */}
        {/* <Route path="/listings/:id/extension" element={<ExtensionApproval />} /> */}
        {/* <Route path="/listings/:id/relist" element={<RelistDecision />} /> */}
        <Route path="/requests/new" element={<PostRequest />} />
        {/* <Route path="/requests" element={<RequestDashboard />} /> */}
        {/* <Route path="/requests/:id" element={<RequestDetail />} /> */}
        {/* <Route path="/requests/:id/extension" element={<ExtensionRequest />} /> */}
        {/* <Route path="/bookings/:id/confirm" element={<BookingConfirmation />} /> */}
        {/* <Route path="/bookings/:id/pickup" element={<PickupFlow />} /> */}
        {/* <Route path="/bookings/:id/active" element={<ActiveRental />} /> */}
        {/* <Route path="/bookings/:id/return" element={<ReturnFlow />} /> */}
        {/* <Route path="/bookings/:id/invoice" element={<InvoiceView />} /> */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
        {/* <Route path="/profile/edit" element={<EditProfile />} /> */}
        {/* <Route path="/profile/ratings" element={<ReliabilityRatings />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;