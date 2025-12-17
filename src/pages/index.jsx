import Layout from "./Layout.jsx";
import { AuthProvider } from "@/contexts/AuthContext";

import Home from "./Home";

import TripDetails from "./TripDetails";

import Onboarding from "./Onboarding";

import PrivacySettings from "./PrivacySettings";

import ResetFollowKPIs from "./ResetFollowKPIs";

import ResetLikes from "./ResetLikes";

import City from "./City";

import EnrichTripImages from "./EnrichTripImages";

import Profile from "./Profile";

import EditProfile from "./EditProfile";

import InspirePrompt from "./InspirePrompt";

import ApiDashboard from "./ApiDashboard";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

const PAGES = {
  Home: Home,

  TripDetails: TripDetails,

  Onboarding: Onboarding,

  PrivacySettings: PrivacySettings,

  ResetFollowKPIs: ResetFollowKPIs,

  ResetLikes: ResetLikes,

  City: City,

  EnrichTripImages: EnrichTripImages,

  Profile: Profile,

  EditProfile: EditProfile,

  InspirePrompt: InspirePrompt,

  ApiDashboard: ApiDashboard,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <AuthProvider currentPageName={currentPage}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/Home" element={<Home />} />

          <Route path="/TripDetails" element={<TripDetails />} />

          <Route path="/Onboarding" element={<Onboarding />} />

          <Route path="/PrivacySettings" element={<PrivacySettings />} />

          <Route path="/ResetFollowKPIs" element={<ResetFollowKPIs />} />

          <Route path="/ResetLikes" element={<ResetLikes />} />

          <Route path="/City" element={<City />} />

          <Route path="/EnrichTripImages" element={<EnrichTripImages />} />

          <Route path="/Profile" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />

          <Route path="/EditProfile" element={<EditProfile />} />

          <Route path="/InspirePrompt" element={<InspirePrompt />} />

          <Route path="/ApiDashboard" element={<ApiDashboard />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
