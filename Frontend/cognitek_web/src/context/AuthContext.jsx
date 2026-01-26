import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock Database in LocalStorage
  const getMockUsers = () => JSON.parse(localStorage.getItem("cognitek_users") || "[]");
  const saveMockUsers = (users) => localStorage.setItem("cognitek_users", JSON.stringify(users));

  useEffect(() => {
    // Check session
    const storedUser = localStorage.getItem("cognitek_session");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const users = getMockUsers();
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("cognitek_session", JSON.stringify(foundUser));
      return { success: true };
    } else {
      return { success: false, message: "Invalid credentials" };
    }
  };

  const register = (username, password) => {
    const users = getMockUsers();
    if (users.find(u => u.username === username)) {
      return { success: false, message: "User already exists" };
    }

    const newUser = { username, password, name: username, role: "Student" };
    users.push(newUser);
    saveMockUsers(users);

    // Auto-login after register
    setUser(newUser);
    localStorage.setItem("cognitek_session", JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cognitek_session");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
