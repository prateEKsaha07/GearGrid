import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/shared/NavBar";

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

export default function PostRequest() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [neededFrom, setNeededFrom] = useState("");
  const [neededTo, setNeededTo] = useState("");
  const [pincode, setPincode] = useState("");
  const [voiceInputUsed, setVoiceInputUsed] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);

  const startListening = () => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      navigate("/error", {
        state: {
          message: "Speech recognition not supported in this browser.",
          redirectTo: "/requests/new",
        },
      });
      return;
    }

    const rec: SpeechRecognitionLike = new SpeechRecognitionCtor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTaskDescription((prev) => (prev ? prev + " " + transcript : transcript));
      setVoiceInputUsed(true);
    };

    rec.onerror = () => {
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
    };

    setRecognition(rec);
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setListening(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = {
      renter_id: "test-user-id",
      category,
      task_description: taskDescription,
      needed_from: neededFrom,
      needed_to: neededTo,
      pincode,
      voice_input_used: voiceInputUsed,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      navigate("/success", {
        state: {
          message: "Request posted successfully",
          redirectTo: "/dashboard",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      navigate("/error", {
        state: { message, redirectTo: "/requests/new" },
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar unreadCount={0} userName="User" />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Post a Request</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder="e.g. vehicle, handheld"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Task Description</label>
            <div className="flex gap-2">
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                required
                rows={4}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                className={`self-start rounded-lg border px-3 py-2 text-sm transition ${
                  listening
                    ? "border-red-500 bg-red-500/10 text-red-600"
                    : "border-border hover:bg-muted"
                }`}
                aria-label={listening ? "Stop listening" : "Start voice input"}
              >
                {listening ? (
                  <span className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 animate-pulse"
                    >
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                    Listening...
                  </span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Needed From</label>
              <input
                type="date"
                value={neededFrom}
                onChange={(e) => setNeededFrom(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Needed To</label>
              <input
                type="date"
                value={neededTo}
                onChange={(e) => setNeededTo(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pincode</label>
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Post Request
          </button>
        </form>
      </div>
    </div>
  );
}