import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Training from "./pages/Training";
import DisasterPrediction from "./pages/DisasterPrediction";
import Aboutus from "./pages/Aboutus";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ContactUS from "./pages/ContactUS";
import Terms from "./pages/Terms";
import ForgotPassword from "./pages/Forgetpassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/Resetpassword";
import FloodPredictor from "./pages/Flood"; 
import EarthquakePredictor from './pages/EarthquakePredictor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/training" element={<Training />}/>
        <Route path="/disasterprediction" element={<DisasterPrediction />}/>
        <Route path="/aboutus" element={<Aboutus />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/settings" element={<Settings />}/>
        <Route path="/profile" element={<Profile />}/> 
        <Route path="/contact" element={<ContactUS />}/> 
        <Route path="/terms" element={<Terms />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/flood" element={<FloodPredictor />} />
        <Route path="/earthquake" element={<EarthquakePredictor />} />

        
      </Routes>
    </Router>
  );
}

export default App;
