import { Link, Outlet } from "react-router";

export default function C() {
  return (
    <div>
      hi
      <Link to="C1">C1로</Link>
      <Link to="C2">C2로</Link>
      <Outlet />
    </div>
  );
}
