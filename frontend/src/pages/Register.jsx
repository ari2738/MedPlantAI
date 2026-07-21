import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-forest-700 flex items-center justify-center">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="font-display text-xl text-ink-900">
            MedPlant <span className="text-forest-600">AI</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-ink-900/5 shadow-sm p-7">
          <h1 className="font-display text-xl text-ink-900 mb-1">Create your account</h1>
          <p className="text-sm text-ink-500 mb-6">Start identifying and saving medicinal plants.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-900/10 text-sm outline-none focus:border-forest-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-900/10 text-sm outline-none focus:border-forest-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-ink-900/10 text-sm outline-none focus:border-forest-500"
                placeholder="At least 6 characters"
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <p className="text-xs text-ink-500 text-center mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-forest-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
