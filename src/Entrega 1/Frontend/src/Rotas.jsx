import { Routes, Route } from "react-router-dom";
import Home from "./paginas/Home.jsx";
import Login from "./paginas/login.jsx";
import Dashboard from "./paginas/Dashboard.jsx";
import NaoEncontrada from "./paginas/NaoEncontrada.jsx";
import FaleConosco  from "./paginas/FaleConosco.jsx";

function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/index.html" element={<Home />} />
      <Route path="/login.html" element={<Login />} />
      <Route path="/dashboard.html" element={<Dashboard />} />
      <Route path="/fale-conosco" element={<FaleConosco />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}

export default Rotas;
