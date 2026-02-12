import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';

import { useAuth } from "../auth/AuthContext";
import StatCard from "../components/StatCard";
import EvaluationTable from "../components/EvaluationTable";

// Mock data imports
import dimensionsData from "../data/mockD.json";
import evaluationsData from "../data/mock.json";

export default function Dashboard() {
    const { user } = useAuth();

    // Admin State
    const [adminStats, setAdminStats] = useState(null);
    const [systemHealth, setSystemHealth] = useState(null);

    // Expert State
    const [dimensions, setDimensions] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const scrollRef = useRef(null);
    const [scrollIndex, setScrollIndex] = useState(0);

    // Mock performance (Expert)
    const userName = user?.username || "Guest";
    const currentPerformance = 72;
    const goalPerformance = 85;
    const maxPerformance = 100;
    const modelVersion = "v1.2.3";

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'RESEARCHER';

    useEffect(() => {
        if (isAdmin) {
            // Load Admin Stats
            apiFetch('/admin/stats').then(setAdminStats).catch(console.error);
            apiFetch('/system/health').then(setSystemHealth).catch(console.error);
        } else {
            // Load Expert Stats
            setDimensions(dimensionsData);
            setEvaluations(evaluationsData);
        }
    }, [isAdmin]);

    // Auto-scroll dimensions (Expert only)
    useEffect(() => {
        if (isAdmin) return;
        const interval = setInterval(() => {
            if (dimensions.length <= 2) return;
            setScrollIndex(prev => (prev + 1) % dimensions.length);
            const scrollEl = scrollRef.current;
            if (scrollEl) {
                const cardWidth = scrollEl.children[0].offsetWidth;
                scrollEl.scrollTo({
                    left: scrollIndex * cardWidth,
                    behavior: "smooth"
                });
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [scrollIndex, dimensions, isAdmin]);

    if (isAdmin) {
        return (
            <div className="min-h-screen w-full bg-base-100 px-6 py-8 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="opacity-60">System overview and health status</p>
                </div>

                {/* System Health Widget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title mb-4">
                                System Health
                                <div className={`badge ${systemHealth?.status === 'OK' ? 'badge-success' : 'badge-error'} badge-sm`}>
                                    {systemHealth?.status || 'LOADING'}
                                </div>
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                    <span className="font-semibold">PostgreSQL Database</span>
                                    <span className={`badge ${systemHealth?.databases?.postgres === 'CONNECTED' ? 'badge-success' : 'badge-error'}`}>
                                        {systemHealth?.databases?.postgres || '...'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                                    <span className="font-semibold">MongoDB Database</span>
                                    <span className={`badge ${systemHealth?.databases?.mongodb === 'CONNECTED' ? 'badge-success' : 'badge-error'}`}>
                                        {systemHealth?.databases?.mongodb || '...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Evaluation Summary Widget */}
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <h2 className="card-title mb-4">Evaluation Summary</h2>
                            <div className="stats stats-vertical lg:stats-horizontal shadow bg-base-200 w-full">
                                <div className="stat">
                                    <div className="stat-title">Total Evaluations</div>
                                    <div className="stat-value text-primary">{adminStats?.evaluations?.total || 0}</div>
                                    <div className="stat-desc">All time assignments</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Completed</div>
                                    <div className="stat-value text-accent">{adminStats?.evaluations?.completed || 0}</div>
                                    <div className="stat-desc">Successfully finished</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Pending</div>
                                    <div className="stat-value text-warning">{adminStats?.evaluations?.pending || 0}</div>
                                    <div className="stat-desc">Awaiting completion</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Stats Widget */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body">
                        <h2 className="card-title">User Statistics</h2>
                        <div className="flex items-center gap-6">
                            <div className="avatar placeholder">
                                <div className="bg-neutral text-neutral-content rounded-full w-20 h-20 flex items-center justify-center">
                                    <span className="text-4xl font-bold">{adminStats?.users?.total || 0}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg">Total Registered Users</p>
                                <div className="flex items-center gap-2">
                                    <div className="badge badge-success badge-xs"></div>
                                    <p className="text-sm opacity-70">
                                        {adminStats?.users?.online || 0} Online
                                    </p>
                                </div>
                                <p className="text-xs opacity-50">Experts, Admins, and Researchers</p>
                            </div>
                            <div className="ml-auto">
                                <Link to="/admin/users" className="btn btn-primary btn-sm">Manage Users</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Expert View (Existing)
    return (
        <div className="min-h-screen w-full bg-base-100 px-6 py-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Welcome, {userName}!</h1>
                <p className="opacity-60">Overview of your evaluations and model performance</p>
            </div>

            {/* Overall Model Statistics */}
            <div className="flex gap-6 relative min-h-[40vh]">
                {/* Scrollable dimension cards */}
                <div className="flex gap-4 overflow-x-auto flex-1 p-2 bg-base-200 rounded-lg shadow-md" ref={scrollRef}>
                    {dimensions.map((d) => (
                        <StatCard
                            key={d.name}
                            title={d.name}
                            value={d.avgScore}
                            subtitle={d.sentiment}
                            style={{ minWidth: "250px", flexShrink: 0 }}
                        />
                    ))}
                </div>

                {/* Fixed half-circle performance */}
                <div className="w-1/5 flex flex-col items-center justify-center p-4 bg-base-200 rounded-lg shadow-md">
                    <div style={{ width: "160px", height: "80px" }}>
                        <CircularProgressbarWithChildren
                            value={currentPerformance}
                            maxValue={maxPerformance}
                            strokeWidth={16}
                            styles={buildStyles({
                                rotation: 0.75, // half-circle
                                strokeLinecap: "round",
                                pathColor: "#3B82F6",
                                trailColor: "#E5E7EB",
                            })}
                        >
                        </CircularProgressbarWithChildren>
                        <div className="text-center">
                            <strong>{currentPerformance}%</strong>
                            <p className="text-sm opacity-70">Goal: {goalPerformance}%</p>
                            <p className="mt-2 text-sm opacity-60">Model Version: {modelVersion}</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* My Evaluations */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold">My Evaluations</h2>
                <EvaluationTable evaluations={evaluations} />
            </div>
        </div>
    );
}
