import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <h2>VR Disaster Training</h2>

      <div>
        {!user ? (
          <>
            <Link to="/login" className="btn">Login</Link>
            <Link to="/signup" className="btn">Signup</Link>
          </>
        ) : (
          <>
            <span className="username">Hello, {user.name}</span>
            <button onClick={logout} className="btn">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
