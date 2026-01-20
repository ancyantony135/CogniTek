import api from "../api/api";

export default function TaskCard({ task, refresh }) {
  return (
    <div className="bg-white p-4 rounded shadow flex justify-between">
      <div>
        <h3 className="font-bold">{task.title}</h3>
        <p className="text-sm text-gray-500">{task.subject} • {task.due_date}</p>
        <span className="text-xs text-blue-600">{task.priority}</span>
      </div>

      <button
        onClick={async () => {
          await api.delete(`/tasks/${task.id}`);
          refresh();
        }}
        className="text-red-600"
      >
        Delete
      </button>
    </div>
  );
}
