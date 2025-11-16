import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { MapPin, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="border-b border-gray-800 bg-gray-900">
      <div className="h-16 px-6 flex items-center justify-between">

        {/* Left side - empty for now */}
        <div className="w-48"></div>

        {/* Center - HostelCore */}
        <div className="flex-1 flex justify-center">
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

          <Link to="/host-panel">
            <Button
              variant={location.pathname === "/host-panel" ? "default" : "ghost"}
              size="sm"
              className={location.pathname === "/host-panel" ? "gap-2" : "gap-2 text-gray-300 hover:text-white hover:bg-gray-800"}
            >
              <LayoutDashboard className="w-4 h-4" />
              Host Panel
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}