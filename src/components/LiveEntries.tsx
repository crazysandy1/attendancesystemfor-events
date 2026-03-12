import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, CheckCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Registration {
  id: string;
  name: string;
  usn: string;
  email: string;
  registered_at: string | null;
}

interface Attendance {
  id: string;
  usn: string;
  submitted_at: string | null;
}

interface Entry {
  id: string;
  type: "registration" | "attendance";
  name?: string;
  usn: string;
  time: string;
}

const LiveEntries = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Fetch initial data
    const fetchInitial = async () => {
      try {
        setLoading(true);
        setError("");
        const [regsRes, attRes] = await Promise.all([
          supabase
            .from("registrations")
            .select("*")
            .order("registered_at", { ascending: false })
            .limit(50),
          supabase
            .from("attendance")
            .select("*")
            .order("submitted_at", { ascending: false })
            .limit(50),
        ]);

        if (regsRes.error) {
          console.error("Registrations fetch error:", regsRes.error);
          setError(`Error fetching registrations: ${regsRes.error.message}`);
        }
        if (attRes.error) {
          console.error("Attendance fetch error:", attRes.error);
          setError(`Error fetching attendance: ${attRes.error.message}`);
        }

        const regs: Entry[] = (regsRes.data || []).map((r: Registration) => ({
          id: r.id,
          type: "registration" as const,
          name: r.name,
          usn: r.usn,
          time: r.registered_at || "",
        }));

        const atts: Entry[] = (attRes.data || []).map((a: Attendance) => ({
          id: a.id,
          type: "attendance" as const,
          usn: a.usn,
          time: a.submitted_at || "",
        }));

        const all = [...regs, ...atts].sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
        );
        setEntries(all.slice(0, 50));
        console.log("Loaded entries:", all.slice(0, 50));
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch entries");
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // Realtime subscription
    const channel = supabase
      .channel("live-entries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "registrations" },
        (payload) => {
          const r = payload.new as Registration;
          setEntries((prev) =>
            [
              {
                id: r.id,
                type: "registration" as const,
                name: r.name,
                usn: r.usn,
                time: r.registered_at || new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 50),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        (payload) => {
          const a = payload.new as Attendance;
          setEntries((prev) =>
            [
              {
                id: a.id,
                type: "attendance" as const,
                usn: a.usn,
                time: a.submitted_at || new Date().toISOString(),
              },
              ...prev,
            ].slice(0, 50),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (t: string) => {
    if (!t) return "";
    const d = new Date(t);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-card-foreground flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        Live Activity Feed
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Loading...
        </p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No activity yet
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>USN</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="animate-in fade-in slide-in-from-top-1 duration-300"
                >
                  <TableCell className="w-12">
                    {entry.type === "registration" ? (
                      <UserPlus className="h-4 w-4 text-primary" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    {entry.name || "—"}
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {entry.usn}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-mono">
                    {formatTime(entry.time)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LiveEntries;
