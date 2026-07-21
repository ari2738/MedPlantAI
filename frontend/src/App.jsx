import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import PlantDetail from "./pages/PlantDetail";
import Remedies from "./pages/Remedies";
import Regions from "./pages/Regions";
import Quiz from "./pages/Quiz";
import Saved from "./pages/Saved";
import Profile from "./pages/Profile";
import Identify from "./pages/Identify";
import SymptomChecker from "./pages/SymptomChecker";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/identify" element={<Identify />} />
          <Route path="/search" element={<Search />} />
          <Route path="/plants/:slug" element={<PlantDetail />} />
          <Route path="/remedies" element={<Remedies />} />
          <Route path="/regions" element={<Regions />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/symptoms" element={<SymptomChecker />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
