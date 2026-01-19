import { updateTask } from "../api/api";

export default function TaskCard({ task, refresh }) {
  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p><b>Subject:</b> {task.subject}</p>
      <p><b>Due:</b> {task.due_date}</p>
      <span className={`priority ${task.priority}`}>
        {task.priority}
      </span>

      <button
        onClick={() => updateTask(task.id, true).then(refresh)}
      >
        ✔ Complete
      </button>
    </div>
  );
}

