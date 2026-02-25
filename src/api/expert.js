import api from "./index";

/* LIST */
export const getMyAssignments = async () => {
    const res = await api.get("/expert/assignments");
    return res.data;
};

/* SINGLE */
export const getAssignmentById = async (id) => {
    const res = await api.get(`/expert/assignments/${id}`);
    return res.data;
};

/* SUBMIT */
export const submitEvaluation = async (id, payload) => {
    const responses = payload.scores.map(s => ({
        criteria_id: s.scoring,
        score: s.score,
        note: s.comments
    }));
    const res = await api.post(`/expert/assignments/${id}/submit`, {
        responses
    });
    return res.data;
};
