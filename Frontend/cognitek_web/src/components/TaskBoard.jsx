import { useEffect, useState } from "react";
import api from "../api/api";
import TaskCard from "./TaskCard";
import AudioRecorder from "./AudioRecorder";

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);

  const loadTasks = async () => {
    const res = await api.get("/tasks");
    setTasks(res.data);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div>
      <AudioRecorder refresh={loadTasks} />

      <div className="grid gap-4 mt-6">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} refresh={loadTasks} />
        ))}
      </div>
    </div>
  );
}
