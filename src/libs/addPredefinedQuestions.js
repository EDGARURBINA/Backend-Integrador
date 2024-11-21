
import Question from "../models/Question.js";


const predefinedQuestions = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿En qué ciudad naciste?",
    "¿Cuál es el nombre de tu mejor amigo?",
];

const addPredefinedQuestions = async () => {
    try {
        for (let questionText of predefinedQuestions) {
            const question = new Question({
                question: questionText
            });
            await question.save();
        }
        console.log("Preguntas predefinidas agregadas exitosamente.");
    } catch (error) {
        console.error("Error al agregar preguntas:", error);
    }
};
export default addPredefinedQuestions; 