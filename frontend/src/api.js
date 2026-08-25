import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

const http = axios.create({ baseURL: API });

export const api = {
  getUser: () => http.get("/user/me").then((r) => r.data),
  setTrainerStyle: (style_id) => http.put("/user/trainer-style", { style_id }).then((r) => r.data),
  getProfile: () => http.get("/fitness-profile").then((r) => r.data),
  updateProfile: (data) => http.put("/fitness-profile", data).then((r) => r.data),
  getTrainerStyles: () => http.get("/trainer-styles").then((r) => r.data),
  getAchievements: () => http.get("/achievements").then((r) => r.data),
  getChallenges: () => http.get("/challenges").then((r) => r.data),

  getDashboard: () => http.get("/dashboard").then((r) => r.data),

  getTodayWorkout: () => http.get("/workout/today").then((r) => r.data),
  getPlans: () => http.get("/workout/plans").then((r) => r.data),
  completeWorkout: () => http.post("/workout/complete").then((r) => r.data),
  logPerformance: (exercise_id, sets) => http.post("/workout/performance", { exercise_id, sets }).then((r) => r.data),
  getExercises: (muscle, q) => http.get("/exercises", { params: { muscle, q } }).then((r) => r.data),

  getProgress: () => http.get("/progress").then((r) => r.data),
  addMeasurement: (data) => http.post("/measurements", data).then((r) => r.data),

  getLeagues: () => http.get("/leagues").then((r) => r.data),
  createLeague: (name) => http.post("/leagues", { name }).then((r) => r.data),
  joinLeague: (id) => http.post(`/leagues/${id}/join`).then((r) => r.data),
  getLeague: (id) => http.get(`/leagues/${id}`).then((r) => r.data),
  getRanking: (id, metric, period) => http.get(`/leagues/${id}/ranking`, { params: { metric, period } }).then((r) => r.data),
};

export default api;
