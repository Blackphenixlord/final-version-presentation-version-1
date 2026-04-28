import React, { useState } from "react";

const NORD = {
  bg: "#2E3440",
  panel: "#3B4252",
  text: "#ECEFF4",
  muted: "#D8DEE9",
  subtle: "#A3ABB9",
};

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function BigButton({ children, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl px-6 py-4 text-lg font-semibold transition",
        "hover:opacity-95",
        className,
      )}
      style={{
        background: "rgba(129,161,193,0.18)",
        border: "1px solid rgba(129,161,193,0.30)",
        color: NORD.text,
      }}
    >
      {children}
    </button>
  );
}

export default function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  function submit(role) {
    onLogin?.({ role, user, pass });
  }

  return (
    <div
      className="h-screen w-screen flex items-center justify-center p-6"
      style={{ background: NORD.bg }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6"
        style={{
          background: "rgba(59,66,82,0.92)",
          border: "1px solid rgba(216,222,233,0.10)",
        }}
      >
        <div className="text-2xl font-semibold" style={{ color: NORD.text }}>
          Login
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: NORD.muted }}
            >
              User
            </div>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="mt-2 w-full rounded-2xl px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(46,52,64,0.55)",
                border: "1px solid rgba(216,222,233,0.12)",
                color: NORD.text,
              }}
              placeholder="(optional)"
              autoComplete="username"
            />
          </div>

          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: NORD.muted }}
            >
              Password
            </div>
            <input
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mt-2 w-full rounded-2xl px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(46,52,64,0.55)",
                border: "1px solid rgba(216,222,233,0.12)",
                color: NORD.text,
              }}
              placeholder="(optional)"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div className="pt-2 space-y-3">
            <BigButton onClick={() => submit("astronaut")}>
              Login as Astronaut
            </BigButton>
            <BigButton onClick={() => submit("ground")}>
              Login as Ground Crew
            </BigButton>
          </div>

          <div className="text-sm" style={{ color: NORD.subtle }}>
            Temporary mock login. No auth yet.
          </div>
        </div>
      </div>
    </div>
  );
}
