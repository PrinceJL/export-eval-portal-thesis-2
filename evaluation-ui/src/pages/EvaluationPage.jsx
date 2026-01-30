import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { useState } from "react";
import { evaluations } from "../data/evaluations";

const chat = [
    { speaker: "user", text: "Hello!" },
    { speaker: "assistant", text: "Hi! How can I help you today?" },
    { speaker: "user", text: "Explain the policy." },
];

const dimensions = ["Factual Grounding", "Jurisdictional Precision", "Linguistic Accessibility", "Temporal Validity","SOS Compliance"];

export default function EvaluationPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const evalItem = evaluations.find(e => e.id === Number(id));

    const [dimensionIndex, setDimensionIndex] = useState(0);
    const isFinal = dimensionIndex === dimensions.length - 1;

    const handleSubmit = () => {
        evalItem.completed = true;
        navigate("/");
    };

    return (
        <div className="flex h-screen">
            {/* Chat Area (80%) */}
            <div className="w-4/5 p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {evalItem.code} — {dimensions[dimensionIndex]}
                </h2>

                <div className="space-y-4">
                    {chat.map((msg, i) => (
                        <div
                            key={i}
                            className={`chat ${msg.speaker === "user" ? "chat-start" : "chat-end"
                                }`}
                        >
                            <div className="chat-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Answer Panel (20%) */}
            <div className="w-1/5 p-4 border-l bg-base-200 space-y-3">
                <h3 className="font-semibold">Evaluation</h3>

                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        className="btn btn-outline w-full"
                    >
                        {n}
                    </button>
                ))}
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-base-100 border-t p-4 flex justify-between">
                <Button
                    variant="outlined"
                    disabled={dimensionIndex === 0}
                    onClick={() => setDimensionIndex(dimensionIndex - 1)}
                >
                    Previous
                </Button>

                {isFinal ? (
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={() => setDimensionIndex(dimensionIndex + 1)}
                    >
                        Next
                    </Button>
                )}
            </div>
        </div>
    );
}
