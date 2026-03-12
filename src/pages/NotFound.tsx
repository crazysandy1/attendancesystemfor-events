import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">
          Oops! Page not found
        </p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
        <br></br>
        <a href="www.buildersandy.tech">
          <p className="text-[9px] text-center text-[#c29519] font-semibold">
            Crafted By Buildersandy
            <img
              src="buildersandy-logo.png"
              alt="Buildersandy Logo"
              className="inline w-4 h-4 ml-1 rounded-full bg-white"
            />
          </p>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
