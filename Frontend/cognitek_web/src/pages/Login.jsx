import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-3xl font-bold text-center mb-6">Cognitek</h1>

        <input className="w-full p-3 border rounded mb-3" placeholder="Username" />
        <input className="w-full p-3 border rounded mb-4" type="password" placeholder="Password" />

        <button
          onClick={() => navigate("/dashboard")}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
        >
          Login
        </button>

        <p className="text-center mt-4 text-sm">
          New user?{" "}
          <span className="text-blue-600 cursor-pointer" onClick={() => navigate("/register")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}
