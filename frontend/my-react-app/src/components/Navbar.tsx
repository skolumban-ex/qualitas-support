// components/Navbar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
        File Uploader
      </NavLink>
      <NavLink to="/templates-list" className={({ isActive }) => (isActive ? 'active' : '')}>
        Template List
      </NavLink>
    </nav>
  );
};

export default Navbar;
