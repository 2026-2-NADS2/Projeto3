import { StrictMode } from "react";
// strict e pra encontrar problemas:Kazuo
import { createRoot } from "react-dom/client";
// ja o createroot é pra Chamar o html e conectar no react:Kazuo
import App from "./App.jsx";
// esse impota o file do app.jsx pra pegar os componentes do react que eu fiz:Kazuo

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
