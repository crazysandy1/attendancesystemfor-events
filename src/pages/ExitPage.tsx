import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction, getFingerprint } from "@/lib/api";
import { Loader2, CheckCircle2 } from "lucide-react";

const ExitPage = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [exitOpen, setExitOpen] = useState<boolean | null>(null);
  const [exitClosed, setExitClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [usn, setUsn] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .limit(1)
        .single();
      if (data) {
        setEventName(data.name);
        setExitOpen(data.exit_open ?? false);

        if (data.exit_closes_at) {
          const closesAt = new Date(data.exit_closes_at);
          if (new Date() > closesAt) {
            setExitClosed(true);
          }
        }

        // If exit is closed, redirect to home after 2 seconds
        if (
          !data.exit_open ||
          (data.exit_closes_at && new Date() > new Date(data.exit_closes_at))
        ) {
          setTimeout(() => navigate("/"), 2000);
        }
      }
      setLoading(false);
    };
    fetchEvent();
  }, [navigate]);

  // Redirect to home after successful attendance marking
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!usn.trim()) {
      setError("USN is required.");
      return;
    }

    setSubmitting(true);
    try {
      const fingerprint = await getFingerprint();
      const res = await invokeFunction("exit-attendance", {
        body: { usn: usn.trim().toUpperCase(), fingerprint },
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to mark attendance.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showForm = exitOpen && !exitClosed;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-6 flex justify-center">
            <img
              src="/logo.jpeg"
              alt="QuantumRit Logo"
              className="h-16 w-16 object-contain rounded-lg"
            />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-card-foreground">
            {eventName}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">Mark Attendance</p>

          {!exitOpen ? (
            <div className="rounded-lg bg-warning/10 p-4 text-center">
              <p className="font-medium text-warning">
                The exit window is not open yet.
              </p>
            </div>
          ) : exitClosed ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="font-medium text-destructive">
                The exit window has closed.
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-success/10 p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <h2 className="text-lg font-semibold text-card-foreground">
                Attendance marked!
              </h2>
              <p className="text-sm text-muted-foreground">
                Thank you for attending.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-card-foreground">
                  USN
                </label>
                <input
                  type="text"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm uppercase text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                  placeholder="Enter your USN"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Submitting..." : "Mark Attendance"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitPage;
