import { useState, useEffect, useCallback } from "react";
import { invokeFunction, getAdminToken, clearAdminToken } from "@/lib/api";
import {
  Loader2,
  Download,
  LogOut,
  Users,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import LiveEntries from "@/components/LiveEntries";

interface EventData {
  id: string;
  name: string;
  entry_open: boolean;
  exit_open: boolean;
  exit_closes_at: string | null;
}

interface Stats {
  registered: number;
  attended: number;
  absent: number;
}

const AdminDashboard = () => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [stats, setStats] = useState<Stats>({
    registered: 0,
    attended: 0,
    absent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [timerMinutes, setTimerMinutes] = useState("15");
  const [customMinutes, setCustomMinutes] = useState("");

  const token = getAdminToken();

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = useCallback(async () => {
    const t = getAdminToken();
    if (!t) return;

    try {
      const [eventRes, statsRes] = await Promise.all([
        invokeFunction("admin-event", { method: "GET", token: t }),
        invokeFunction("admin-stats", { method: "GET", token: t }),
      ]);

      if (eventRes.status === 401 || statsRes.status === 401) {
        clearAdminToken();
        return;
      }

      const eventData = await eventRes.json();
      const statsData = await statsRes.json();
      setEvent(eventData);
      setStats(statsData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!event?.exit_closes_at) {
      setCountdown("");
      return;
    }

    const update = () => {
      const remaining = new Date(event.exit_closes_at!).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown("Expired");
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [event?.exit_closes_at]);

  const updateEvent = async (updates: Partial<EventData>) => {
    if (!token || updating) return;
    setUpdating(true);
    try {
      const res = await invokeFunction("admin-event", {
        method: "PATCH",
        body: updates as Record<string, unknown>,
        token,
      });
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleEntry = () => {
    if (!event) return;
    updateEvent({ entry_open: !event.entry_open });
  };

  const toggleExit = () => {
    if (!event) return;
    if (event.exit_open) {
      updateEvent({ exit_open: false, exit_closes_at: null });
    } else {
      updateEvent({ exit_open: true });
    }
  };

  const startTimer = () => {
    const mins =
      timerMinutes === "custom"
        ? parseInt(customMinutes)
        : parseInt(timerMinutes);
    if (isNaN(mins) || mins <= 0) return;

    const closesAt = new Date(Date.now() + mins * 60000).toISOString();
    updateEvent({ exit_open: true, exit_closes_at: closesAt });
  };

  const exportCSV = async (type: string) => {
    if (!token) return;
    try {
      const res = await invokeFunction("admin-export", {
        method: "GET",
        token,
        queryParams: { type },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${type}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const logout = () => {
    clearAdminToken();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-destructive">Failed to load event data.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/logo.jpeg"
              alt="QuantumRit Logo"
              className="h-12 w-12 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {event.name}
              </h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="grid gap-6">
          {/* Section 1: Entry Control */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Entry Registration
            </h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${event.entry_open ? "bg-success" : "bg-destructive"}`}
                />
                <span className="text-sm font-medium text-card-foreground">
                  {event.entry_open ? "Open" : "Closed"}
                </span>
              </div>
              <button
                onClick={toggleEntry}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  event.entry_open ? "bg-success" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-card transition-transform ${
                    event.entry_open ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 2: Exit Control */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Exit Window
            </h2>

            {/* Manual toggle */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${event.exit_open ? "bg-success" : "bg-destructive"}`}
                />
                <span className="text-sm font-medium text-card-foreground">
                  {event.exit_open ? "Open" : "Closed"}
                </span>
              </div>
              <button
                onClick={toggleExit}
                disabled={updating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  event.exit_open ? "bg-success" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-card transition-transform ${
                    event.exit_open ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Timer */}
            <div className="border-t border-border pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Clock className="h-4 w-4" />
                Auto-close Timer
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                  <option value="custom">Custom</option>
                </select>

                {timerMinutes === "custom" && (
                  <input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-24 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
                    min="1"
                  />
                )}

                <button
                  onClick={startTimer}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start Timer
                </button>
              </div>

              {countdown && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Time remaining:
                  </span>
                  <span
                    className={`text-lg font-mono font-bold ${
                      countdown === "Expired"
                        ? "text-destructive"
                        : "text-primary"
                    }`}
                  >
                    {countdown}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Live Stats */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Live Stats{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (refreshes every 10s)
              </span>
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <Users className="mx-auto mb-2 h-6 w-6 text-primary" />
                <div className="text-2xl font-bold text-primary">
                  {stats.registered}
                </div>
                <div className="text-xs text-muted-foreground">Registered</div>
              </div>
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <UserCheck className="mx-auto mb-2 h-6 w-6 text-success" />
                <div className="text-2xl font-bold text-success">
                  {stats.attended}
                </div>
                <div className="text-xs text-muted-foreground">Attended</div>
              </div>
              <div className="rounded-lg bg-destructive/10 p-4 text-center">
                <UserX className="mx-auto mb-2 h-6 w-6 text-destructive" />
                <div className="text-2xl font-bold text-destructive">
                  {stats.absent}
                </div>
                <div className="text-xs text-muted-foreground">Absent</div>
              </div>
            </div>
          </div>

          {/* Section 4: Live Activity Feed */}
          <LiveEntries />

          {/* Section 5: Export */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Export CSV
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => exportCSV("registered")}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                All Registered
              </button>
              <button
                onClick={() => exportCSV("attended")}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Attended Only
              </button>
              <button
                onClick={() => exportCSV("absent")}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                Did NOT Attend
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
