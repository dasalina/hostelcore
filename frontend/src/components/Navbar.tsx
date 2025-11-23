import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { MapPin, LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const authToken = localStorage.getItem("authToken");
      setIsAuthenticated(!!authToken);
    };

    checkAuth();

    // Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);

    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, [location]); // Re-check when location changes

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <nav className="w-full border-b border-gray-800 bg-gray-900">
      <div className="h-16 px-6 flex items-center justify-between"> {/*left side - empty for now */}
        <div className="w-48"></div>


        {/* Center - HostelCore */}
        <div className="flex-initial flex justify-center">
          <h2 className="text-white">HostelCore</h2>
        </div>


        {/* Right side - Navigation buttons */}
        <div className="w-48 flex justify-end gap-2">
          <Link to="/">
            <Button
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              className={location.pathname === "/" ? "gap-2" : "gap-2 text-gray-300 hover:text-white hover:bg-gray-800"}
            >
              <MapPin className="w-4 h-4" />
              Events
            </Button>
          </Link>


          <Link to="/host-panel" className={!isAuthenticated ? "cursor-not-allowed" : ""}>
            <Button
              variant={location.pathname === "/host-panel" ? "default" : "ghost"}
              size="sm"
              disabled={!isAuthenticated}
              className={
                location.pathname === "/host-panel"
                  ? "gap-2"
                  : !isAuthenticated
                  ? "gap-2 text-gray-500 cursor-not-allowed"
                  : "gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              Host Panel
            </Button>
          </Link>


          {/* Login/Logout Button */}
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          ) : (
            <Button
              variant={location.pathname === "/login" ? "default" : "ghost"}
              size="sm"
              onClick={handleLogin}
              className={location.pathname === "/login" ? "gap-2" : "gap-2 text-gray-300 hover:text-white hover:bg-gray-800"}
            >
              <LogIn className="w-4 h-4" />
              Login
            </Button>


          )}
        </div>
      </div>
    </nav>
  );
}