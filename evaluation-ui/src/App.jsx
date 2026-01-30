import { Routes, Route } from "react-router-dom";
import EvaluationList from "./pages/EvaluationList";
import EvaluationPage from "./pages/EvaluationPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EvaluationList />} />
      <Route path="/evaluation/:id" element={<EvaluationPage />} />
    </Routes>
  );
}
