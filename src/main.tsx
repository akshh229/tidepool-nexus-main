import { createRoot } from "react-dom/client";
import { World } from './sim/world.js';
import { Network, buildDefaultBrain } from './sim/brain/network.js';
import { TrialManager } from './sim/trial.js';
import { Scorer } from './sim/scorer.js';
import { simAPI } from './simAPI.js';
import App from "./App.tsx";
import { AuthProvider } from "./lib/AuthContext";
import "./index.css";

const world = new World();
const network = new Network();
const trialManager = new TrialManager(30);
const scorer = new Scorer();
buildDefaultBrain(network);
simAPI._init({ world, network, trialManager, scorer });

createRoot(document.getElementById("root")!).render(<AuthProvider><App /></AuthProvider>);
