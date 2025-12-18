import { useState, useEffect } from "react";  // Add useEffect import
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
// import { getToken } from "../api/api"; 
// import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import axios from "axios";
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount and redirect if authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = { email, password };
      const res = await axios.post(`${BACKEND_BASE_URL}/auth/login`, body);
      console.log("res_", res)
      // const decoded=jwtDecode(res.data.token);
      // console.log(decoded)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.user?.name);
      localStorage.setItem("role", res.data.user?.role);
      localStorage.setItem("dealer", res.data.user?.dealer);
      if (res.data.user?.dealer){
        navigate("/dashboard");}
    } catch (err) {
      // ✅ robust error message
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed";

      toast.error(msg)
      // optional debug:
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">

      {loading ? <Loader size={90} color="#111" /> :
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full mb-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full mb-4 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 disabled:opacity-60 text-white p-2 w-full rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      }
    </div>
  );
};

export default Login;