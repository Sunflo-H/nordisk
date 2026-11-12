import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/Home.tsx";
import EventInventory from "./pages/EventInventory.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="inventory" element={<App />} />
        <Route path="event" element={<EventInventory />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
