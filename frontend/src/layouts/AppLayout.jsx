import { Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="app-layout no-sidebar-layout">
      <Outlet />
    </div>
  );
}

export default AppLayout;
