import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div id="not-found-page" style={{ textAlign: "center", paddingTop: "4rem" }}>
      <h1 style={{ fontSize: "4rem" }}>404</h1>
      <p>Page not found</p>
      <Link to="/">Go back home</Link>
    </div>
  );
}
