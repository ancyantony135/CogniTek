import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-700">
      <div className="bg-white p-8 rounded-xl shadow-lg w-96">
        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

        <input
          className="w-full p-3 border rounded mb-3"
          placeholder="Username"
        />

        <input
          className="w-full p-3 border rounded mb-3"
          placeholder="Email"
        />

        <input
          type="password"
          className="w-full p-3 border rounded mb-4"
          placeholder="Password"
        />

        <button
          className="w-full bg-purple-600 text-white py-3 rounded hover:bg-purple-700"
          onClick={() => navigate("/")}
        >
          Register
        </button>

        <p className="text-center mt-4 text-sm">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
