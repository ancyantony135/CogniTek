import { useEffect, useState } from "react";
import { fetchTasks } from "../api/api";
import TaskCard from "../components/TaskCard";
import AudioRecorder from "../components/AudioRecorder";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);

  const loadTasks = () => {
    fetchTasks().then((res) => setTasks(res.data));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="dashboard">
      <h1>Welcome to Cognitek</h1>

      <AudioRecorder onSuccess={loadTasks} />

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} refresh={loadTasks} />
        ))}
      </div>
    </div>
  );
}

