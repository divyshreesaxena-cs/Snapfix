import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { workerProfileAPI, workerBookingsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  const didSyncUser = useRef(false); // ✅ prevents infinite loop

  const serviceLabel = useMemo(() => {
    if (!worker) return "—";
    if (worker.isProfileComplete === false) return "—";
    return worker.serviceCategory || worker.servicesProvided?.[0] || "—";
  }, [worker]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const profileRes = await workerProfileAPI.getProfile();
        const w = profileRes?.data?.data || profileRes?.data?.worker || profileRes?.data;

        if (!alive) return;

        setWorker(w);

        // ✅ sync auth user ONCE to avoid re-fetch loop
        if (w && !didSyncUser.current) {
          updateUser(w);
          didSyncUser.current = true;
        }

        if (w && w.isProfileComplete === false) {
          navigate("/worker/profile-setup", { replace: true });
          return;
        }

        const bookingsRes = await workerBookingsAPI.getBookings({ view: "stats" });
        const data = bookingsRes?.data?.data || bookingsRes?.data;

        if (!alive) return;

        setStats({
          pending: data?.pending ?? 0,
          accepted: data?.accepted ?? 0,
          inProgress: data?.inProgress ?? 0,
          completed: data?.completed ?? 0,
        });
      } catch (e) {
        // interceptor handles auth failures
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [navigate, updateUser]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-2xl font-bold text-gray-900">Worker Dashboard</div>
        <div className="text-gray-600 mt-1">Track your jobs and manage your profile.</div>

        <div className="mt-6">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border p-6">Loading…</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Pending</div>
                  <div className="text-3xl font-bold">{stats.pending}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Accepted</div>
                  <div className="text-3xl font-bold">{stats.accepted}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <div className="text-sm text-gray-500">InProgress</div>
                  <div className="text-3xl font-bold">{stats.inProgress}</div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border p-4">
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-3xl font-bold">{stats.completed}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border p-6">
                  <div className="text-lg font-semibold">Quick Actions</div>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      className="px-5 py-2 rounded-xl bg-orange-500 text-white font-semibold"
                      onClick={() => navigate("/worker/bookings")}
                    >
                      View My Jobs
                    </button>
                    <button
                      className="px-5 py-2 rounded-xl border border-orange-300 text-orange-600 font-semibold"
                      onClick={() => navigate("/worker/profile-setup")}
                    >
                      Update Profile
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border p-6">
                  <div className="text-lg font-semibold">Your Details</div>
                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Worker ID</span>
                      <span className="font-medium">{worker?.workerId || "—"}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium">{serviceLabel}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium">{worker?.phone || "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
