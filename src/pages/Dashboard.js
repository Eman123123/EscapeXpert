// // src/pages/Dashboard.jsx
// import React, { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import { useVRLaunch } from "../hooks/useVRLaunch";
// import { useDraw2DLaunch } from "../hooks/useDraw2DLaunch";
// import axios from "axios";
// import Header from "../components/Header";
// import Sidebar from "../components/Sidebar";
// import "./Dashboard.css";

// const dashboardData = {
//   simulationsCompleted: 12,
//   personalRiskScore: 4.2,
//   services: [
//     { 
//       id: 1, 
//       title: "2D Blue-print to 3D", 
//       description: "Convert 2D blueprints to 3D models with VR simulation.", 
//       icon: "fas fa-cube", 
//       action: "vr-training"
//     },
//     { 
//       id: 2, 
//       title: "Disaster Risk Prediction", 
//       description: "Get location-specific risk reports for natural disasters.", 
//       icon: "fas fa-chart-line", 
//       link: "/disasterprediction" 
//     },
//     { 
//       id: 3, 
//       title: "3D Environment Creator", 
//       description: "Draw and create custom 3D environments from scratch.", 
//       icon: "fas fa-pencil-ruler", 
//       action: "draw2d"  
//     },
//     { 
//       id: 4, 
//       title: "Emergency Resource Map", 
//       description: "Find nearest hospitals, shelters, and emergency contacts.", 
//       icon: "fas fa-map-marker-alt", 
//       link: "/emergency-map" 
//     },
//   ]
// };

// export default function Dashboard() {
//   const { isLoggedIn, user, handleLogout } = useAuth();
//   const navigate = useNavigate();
  
//   // VR Module hooks
//   const { launchVR, loading: vrLoading, status: vrStatus } = useVRLaunch();
  
//   // Draw2D Module hooks
//   const { launchDraw2D, loading: draw2DLoading, status: draw2DStatus } = useDraw2DLaunch();
  
//   const [moduleStatus, setModuleStatus] = useState(null);

//   // Check VR module status when dashboard loads
//   useEffect(() => {
//     if (isLoggedIn) {
//       checkModuleStatus();
//     }
//   }, [isLoggedIn]);

//   const checkModuleStatus = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/module/module-status');
//       setModuleStatus(response.data);
//     } catch (error) {
//       console.log('⚠️ Could not check VR module status');
//     }
//   };

//   const handleServiceClick = (service) => {
//     if (service.action === 'vr-training') {
//       launchVR(); // Launch VR module
//     } else if (service.action === 'draw2d') {
//       launchDraw2D(); // Launch Draw2D module
//     } else {
//       navigate(service.link);
//     }
//   };

//   useEffect(() => {
//     if (!isLoggedIn) navigate("/login");
//   }, [isLoggedIn, navigate]);

//   if (!isLoggedIn) return <div className="loading-state">Redirecting to login...</div>;

//   const { simulationsCompleted, personalRiskScore, services } = dashboardData;

//   return (
//     <div className="dashboard-wrapper">
//       <Header isLoggedIn={isLoggedIn} user={user} handleLogout={handleLogout} isAuthPage={false} />

//       <div className="app-layout">
//         <Sidebar user={user} />

//         <main className="dashboard-main-content">
//           <h1 className="main-title gradient-heading">Welcome, {user?.username || user?.email || 'User'}!</h1>
          
//           {/* Module Status Cards */}
//           <div className="modules-status-container" style={{ 
//             display: 'flex', 
//             gap: '15px', 
//             marginBottom: '20px',
//             flexWrap: 'wrap'
//           }}>
//             {/* VR Module Status */}
//             {vrStatus && (
//               <div className={`module-status-card ${vrStatus.running ? 'success' : vrStatus.starting ? 'warning' : 'info'}`} style={{
//                 flex: 1,
//                 minWidth: '200px',
//                 padding: '12px 15px',
//                 borderRadius: '6px',
//                 background: vrStatus.running ? '#e8f5e9' : vrStatus.starting ? '#fff3e0' : '#f5f5f5',
//                 borderLeft: `4px solid ${vrStatus.running ? '#4caf50' : vrStatus.starting ? '#ff9800' : '#9e9e9e'}`
//               }}>
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                   <i className="fas fa-cube" style={{ color: vrStatus.running ? '#4caf50' : vrStatus.starting ? '#ff9800' : '#9e9e9e' }}></i>
//                   <strong>VR Module</strong>
//                 </div>
//                 <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
//                   {vrStatus.running ? '✅ Ready on port 3001' : 
//                    vrStatus.starting ? `⏳ Starting... (${vrStatus.elapsedTime}s)` : 
//                    '⚪ Not running'}
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Stats Section */}
//           {/* <section className="dashboard-status-bar">
//             <div className="status-item">
//               <i className="fas fa-graduation-cap"></i>
//               <p><strong>{simulationsCompleted}</strong> Simulations Completed</p>
//             </div>
//             <div className="status-item">
//               <i className="fas fa-exclamation-triangle"></i>
//               <p>Average Risk Score: <strong>{personalRiskScore.toFixed(1)}/5.0</strong></p>
//             </div>
//           </section> */}

//           <hr />

//           {/* Services Section */}
//           <section className="dashboard-services">
//             <h2>Our Services</h2>
//             <p className="services-subtitle">Click any service below to begin or view your previous reports.</p>
//             <div className="services-grid">
//               {services.map(service => (
//                 <div 
//                   key={service.id} 
//                   className="service-card"
//                   onClick={() => handleServiceClick(service)}
//                   style={{ cursor: 'pointer' }}
//                 >
//                   <div className="service-icon-container">
//                     <i className={service.icon}></i>
//                   </div>
//                   <h3>{service.title}</h3>
//                   <p>{service.description}</p>
                  
//                   {service.action === 'vr-training' ? (
//                     <button 
//                       className="service-action-link"
//                       disabled={vrLoading}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleServiceClick(service);
//                       }}
//                     >
//                       {vrLoading ? (
//                         <>
//                           <i className="fas fa-spinner fa-spin"></i> Starting VR...
//                         </>
//                       ) : (
//                         'Launch VR →'
//                       )}
//                     </button>
//                   ) : service.action === 'draw2d' ? (
//                     <button 
//                       className="service-action-link"
//                       disabled={draw2DLoading}
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleServiceClick(service);
//                       }}
//                     >
//                       {draw2DLoading ? (
//                         <>
//                           <i className="fas fa-spinner fa-spin"></i> Starting Draw2D...
//                         </>
//                       ) : (
//                         'Launch Draw2D →'
//                       )}
//                     </button>
//                   ) : (
//                     <span className="service-action-link">
//                       Avail Service →
//                     </span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </section>
//         </main>
//       </div>
//     </div>
//   );
// }
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useVRLaunch } from "../hooks/useVRLaunch";
import { useDraw2DLaunch } from "../hooks/useDraw2DLaunch";
import axios from "axios";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const dashboardData = {
  simulationsCompleted: 12,
  personalRiskScore: 4.2,
  services: [
    { 
      id: 1, 
      title: "2D Blue-print to 3D", 
      description: "Convert 2D blueprints to 3D models with VR simulation.", 
      icon: "fas fa-cube", 
      action: "vr-training"
    },
    { 
      id: 2, 
      title: "Disaster Risk Prediction", 
      description: "Get location-specific risk reports for natural disasters.", 
      icon: "fas fa-chart-line", 
      link: "/disasterprediction" 
    },
    { 
      id: 3, 
      title: "3D Environment Creator", 
      description: "Draw and create custom 3D environments from scratch.", 
      icon: "fas fa-pencil-ruler", 
      action: "draw2d"  
    }
  ]
};

export default function Dashboard() {
  const { isLoggedIn, user, handleLogout } = useAuth();
  const navigate = useNavigate();
  
  // VR Module hooks
  const { launchVR, loading: vrLoading, status: vrStatus } = useVRLaunch();
  
  // Draw2D Module hooks
  const { launchDraw2D, loading: draw2DLoading } = useDraw2DLaunch();

  // Check VR module status when dashboard loads
  useEffect(() => {
    if (isLoggedIn) {
      checkModuleStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const checkModuleStatus = async () => {
    try {
      await axios.get('http://localhost:5000/api/module/module-status');
      // Status check completed successfully
    } catch (error) {
      console.log('⚠️ Could not check VR module status');
    }
  };

  const handleServiceClick = (service) => {
    if (service.action === 'vr-training') {
      launchVR(); // Launch VR module
    } else if (service.action === 'draw2d') {
      launchDraw2D(); // Launch Draw2D module
    } else {
      navigate(service.link);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return <div className="loading-state">Redirecting to login...</div>;

  const { simulationsCompleted, personalRiskScore, services } = dashboardData;

  return (
    <div className="dashboard-wrapper">
      <Header isLoggedIn={isLoggedIn} user={user} handleLogout={handleLogout} isAuthPage={false} />

      <div className="app-layout">
        <Sidebar user={user} />

        <main className="dashboard-main-content">
          <h1 className="main-title gradient-heading">Welcome, {user?.username || user?.email || 'User'}!</h1>
          
          {/* Module Status Cards */}
          <div className="modules-status-container" style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {/* VR Module Status */}
            {vrStatus && (
              <div className={`module-status-card ${vrStatus.running ? 'success' : vrStatus.starting ? 'warning' : 'info'}`} style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 15px',
                borderRadius: '6px',
                background: vrStatus.running ? '#e8f5e9' : vrStatus.starting ? '#fff3e0' : '#f5f5f5',
                borderLeft: `4px solid ${vrStatus.running ? '#4caf50' : vrStatus.starting ? '#ff9800' : '#9e9e9e'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-cube" style={{ color: vrStatus.running ? '#4caf50' : vrStatus.starting ? '#ff9800' : '#9e9e9e' }}></i>
                  <strong>VR Module</strong>
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                  {vrStatus.running ? '✅ Ready on port 3001' : 
                   vrStatus.starting ? `⏳ Starting... (${vrStatus.elapsedTime}s)` : 
                   '⚪ Not running'}
                </p>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <section className="dashboard-status-bar">
            <div className="status-item">
              <i className="fas fa-graduation-cap"></i>
              <p><strong>{simulationsCompleted}</strong> Simulations Completed</p>
            </div>
            <div className="status-item">
              <i className="fas fa-exclamation-triangle"></i>
              <p>Average Risk Score: <strong>{personalRiskScore.toFixed(1)}/5.0</strong></p>
            </div>
          </section>

          <hr />

          {/* Services Section */}
          <section className="dashboard-services">
            <h2>Our Services</h2>
            <p className="services-subtitle">Click any service below to begin or view your previous reports.</p>
            <div className="services-grid">
              {services.map(service => (
                <div 
                  key={service.id} 
                  className="service-card"
                  onClick={() => handleServiceClick(service)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="service-icon-container">
                    <i className={service.icon}></i>
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  
                  {service.action === 'vr-training' ? (
                    <button 
                      className="service-action-link"
                      disabled={vrLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service);
                      }}
                    >
                      {vrLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Starting VR...
                        </>
                      ) : (
                        'Launch VR →'
                      )}
                    </button>
                  ) : service.action === 'draw2d' ? (
                    <button 
                      className="service-action-link"
                      disabled={draw2DLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleServiceClick(service);
                      }}
                    >
                      {draw2DLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Starting Draw2D...
                        </>
                      ) : (
                        'Launch Draw2D →'
                      )}
                    </button>
                  ) : (
                    <span className="service-action-link">
                      Avail Service →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}