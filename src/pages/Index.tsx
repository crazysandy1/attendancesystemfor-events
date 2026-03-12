import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo.jpeg"
            alt="QuantumRit Logo"
            className="h-24 w-24 object-contain rounded-lg"
          />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">QuantumRit</h1>
        <p className="mb-8 text-muted-foreground">
          Quantum Club Inauguration — Registration & Attendance
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/register")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Student Registration
          </button>
          <button
            onClick={() => navigate("/exit")}
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
          >
            Mark Attendance (Exit)
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            Admin Panel
          </button>
        </div>
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

export default Index;
