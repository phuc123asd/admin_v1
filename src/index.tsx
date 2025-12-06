import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Sử dụng createRoot thay vì render (API mới của React 18)
const container = document.getElementById("root");
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);
root.render(<App />);