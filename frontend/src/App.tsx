import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ShieldCheck, LogOut, Building2, UserCircle } from "lucide-react";

function AuthDashboard() {
  const { user, loading, login, signup, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({
          user: { email, password, password_confirmation: passwordConfirmation, first_name: firstName, last_name: lastName },
          organization: { name: orgName, subdomain },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.join(", ") || "Authentication failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading session...
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100">OpsPulse Hub</h1>
                <p className="text-xs text-slate-400">Multi-Tenant Operations Platform</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 text-rose-300 rounded-lg text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400">
                <UserCircle className="w-5 h-5" />
                <h2 className="font-semibold text-slate-200">Current User</h2>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><span className="text-slate-500">Name:</span> {user.full_name}</div>
                <div><span className="text-slate-500">Email:</span> {user.email}</div>
                <div>
                  <span className="text-slate-500">Role:</span>{" "}
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-800 border border-slate-700 uppercase font-mono text-emerald-400">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Building2 className="w-5 h-5" />
                <h2 className="font-semibold text-slate-200">Organization Tenant</h2>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div><span className="text-slate-500">Organization:</span> {user.organization?.name}</div>
                <div><span className="text-slate-500">Tenant Subdomain:</span> {user.organization?.subdomain}</div>
                <div><span className="text-slate-500">Tenant ID:</span> #{user.organization?.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">OpsPulse Hub</h1>
        <p className="text-xs text-slate-400 mb-6">{isLogin ? "Sign in to your account" : "Create your tenant organization"}</p>

        {error && (
          <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Subdomain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-slate-400">Confirm Password</label>
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-lg text-sm transition"
          >
            {isLogin ? "Sign In" : "Register Organization"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? "Need a new workspace? " : "Already registered? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-emerald-400 font-semibold hover:underline"
          >
            {isLogin ? "Create an account" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthDashboard />
    </AuthProvider>
  );
}