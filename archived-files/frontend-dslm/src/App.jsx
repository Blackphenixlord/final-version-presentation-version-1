// src/App.jsx
import React, { useMemo, useState } from "react";

// Data
import { createMockData } from "./data/mockData";

// Shared layout/components
import TopBar from "./components/TopBar";
import SideNav from "./components/SideNav";
import Inspector from "./components/Inspector";

// Screens
import ReceiveScreen from "./screens/ground/ReceiveScreen";
import TagScreen from "./screens/ground/TagScreen";
import PackScreen from "./screens/ground/PackScreen";
import StowScreen from "./screens/ground/LoadScreen";
import MoveScreen from "./screens/ground/MoveScreen";
import LoginScreen from "./screens/LoginScreen";

// Space screens
import RemoveScreen from "./screens/space/RemoveScreen";
import AddScreen from "./screens/space/AddScreen";
import TrashScreen from "./screens/space/TrashScreen";

const GROUND_SCREENS = [
  { key: "receive", label: "Receive" },
  { key: "tag", label: "Tag" },
  { key: "pack", label: "Pack" },
  { key: "stow", label: "Stow" },
  { key: "move", label: "Move" },
];

const ASTRONAUT_SCREENS = [
  { key: "take", label: "Take out" },
  { key: "return", label: "Put back" },
  { key: "dispose", label: "Throw away" },
];

export default function App() {
  const data = useMemo(() => createMockData(), []);

  // Default to login screen until a role is chosen.
  // session = { role: "astronaut" | "ground", name: string, station: string }
  const [session, setSession] = useState(null);

  const [screen, setScreen] = useState("receive");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorEntity, setInspectorEntity] = useState(null);

  function openInspector(entity) {
    setInspectorEntity(entity ?? null);
    setInspectorOpen(true);
  }

  function closeInspector() {
    setInspectorOpen(false);
  }

  function logout() {
    setSession(null);
    setScreen("receive");
    setInspectorOpen(false);
    setInspectorEntity(null);
  }

  return (
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ background: "#2e3440" }}
    >
      {!session ? (
        <LoginScreen
          onLogin={({ role, user }) => {
            const isAstronaut = role === "astronaut";

            setSession({
              role: isAstronaut ? "astronaut" : "ground",
              name:
                (user && user.trim()) ||
                (isAstronaut ? "Cmdr. Rivera" : "Jamie"),
              station: isAstronaut
                ? "DSLM • Node 2 • Workstation B"
                : "Dock 2 • Tag Bench A",
            });

            setScreen(isAstronaut ? "take" : "receive");
          }}
        />
      ) : (
        <div className="h-full flex flex-col">
          <TopBar
            onLogout={logout}
            appLabel={session.role === "astronaut" ? "KSC • CREW" : "KSC"}
            operatorName={session.name}
            operatorRole={
              session.role === "astronaut" ? "Astronaut" : "Operator"
            }
            stationLabel={session.station}
          />

          <div className="flex-1 min-h-0 flex">
            <SideNav
              screens={
                session.role === "astronaut"
                  ? ASTRONAUT_SCREENS
                  : GROUND_SCREENS
              }
              activeKey={screen}
              onPick={setScreen}
            />

            <main className="flex-1 min-w-0 min-h-0 p-4 overflow-auto">
              {session.role === "astronaut" ? (
                <>
                  {screen === "take" ? <RemoveScreen /> : null}
                  {screen === "return" ? <AddScreen /> : null}
                  {screen === "dispose" ? <TrashScreen /> : null}
                </>
              ) : (
                <>
                  {screen === "receive" ? (
                    <ReceiveScreen data={data} onInspect={openInspector} />
                  ) : null}
                  {screen === "tag" ? (
                    <TagScreen data={data} onInspect={openInspector} />
                  ) : null}
                  {screen === "pack" ? (
                    <PackScreen data={data} onInspect={openInspector} />
                  ) : null}
                  {screen === "stow" ? (
                    <StowScreen data={data} onInspect={openInspector} />
                  ) : null}
                  {screen === "move" ? (
                    <MoveScreen data={data} onInspect={openInspector} />
                  ) : null}
                </>
              )}
            </main>

            {session.role !== "astronaut" ? (
              <Inspector
                open={inspectorOpen}
                entity={inspectorEntity}
                onClose={closeInspector}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
