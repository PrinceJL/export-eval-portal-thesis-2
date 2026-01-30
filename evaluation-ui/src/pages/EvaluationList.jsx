import { Link } from "react-router-dom";
import { evaluations } from "../data/evaluations";

function daysUntil(date) {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function EvaluationList() {
    const batchNumber = evaluations[0]?.batch;
    const completedCount = evaluations.filter(e => e.completed).length;

    const nextDeadlineEval = [...evaluations]
        .filter(e => !e.completed)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="card bg-base-200">
                <div className="card-body">
                    <h1 className="text-2xl font-bold">Evaluation Batch #{batchNumber}</h1>

                    <div className="flex gap-12 mt-2">
                        <div>
                            <p className="font-semibold">Next Deadline</p>
                            {nextDeadlineEval ? (
                                <p>
                                    {nextDeadlineEval.deadline} —{" "}
                                    <span className="text-error">
                                        in {daysUntil(nextDeadlineEval.deadline)} days
                                    </span>
                                </p>
                            ) : (
                                <p className="text-success">All completed 🎉</p>
                            )}
                        </div>

                        <div>
                            <p className="font-semibold">Progress</p>
                            <p>
                                Completed: {completedCount}/{evaluations.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Evaluation</th>
                            <th>Date Assigned</th>
                            <th>Deadline</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluations.map((e) => (
                            <tr key={e.id}>
                                <td>
                                    <Link
                                        to={`/evaluation/${e.id}`}
                                        className="link link-primary"
                                    >
                                        {e.code}
                                    </Link>
                                </td>
                                <td>{e.assignedAt}</td>
                                <td>{e.deadline}</td>
                                <td>
                                    {e.completed ? (
                                        <span className="badge badge-success">Completed</span>
                                    ) : (
                                        <span className="badge badge-warning">Pending</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
