import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { invokeFunction, setAdminToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

const AdminLoginPage = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await invokeFunction("admin-login", {
        body: { password },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed.");
      } else {
        setAdminToken(data.token);
        navigate("/admin/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="QuantumRit Logo"
              className="h-16 w-16 object-contain rounded-lg"
            />
            <h1 className="text-xl font-bold text-card-foreground">
              Admin Login
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
