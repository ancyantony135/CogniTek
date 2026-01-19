import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
});

export const fetchTasks = () => API.get("/tasks");

export const uploadAudio = (formData) =>
  API.post("/process-audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateTask = (id, is_completed) =>
  API.patch(`/tasks/${id}`, { is_completed });

