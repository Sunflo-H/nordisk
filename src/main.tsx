import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter, Route, Routes } from "react-router";
import A from "./pages/A.tsx";
import B from "./pages/B.tsx";
import C from "./pages/C.tsx";
import C_1 from "./pages/C_1.tsx";
import C_2 from "./pages/C_2.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route index element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
