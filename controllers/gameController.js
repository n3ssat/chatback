    import OpenAI from 'openai';
    import Game from '../models/Game.js';
    import dotenv from 'dotenv';

   // dotenv.config();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const CATEGORIES = {
    'Farándula': 'Preguntas sobre celebridades, espectáculos y cultura popular',
    'Historia': 'Preguntas sobre eventos históricos importantes',
    'Ciencia': 'Preguntas sobre descubrimientos científicos y conceptos',
    'Deporte': 'Preguntas sobre deportes y atletas famosos',
    'Arte': 'Preguntas sobre pintura, música, literatura y arte en general'
    };

    export const startGame = async (req, res) => {
    try {
        const { category } = req.body;
        
        if (!CATEGORIES[category]) {
        return res.status(400).json({ error: 'Categoría no válida' });
        }

        // Generar preguntas con ChatGPT
        const prompt = `Genera 5 preguntas de opción múltiple (a, b, c, d) sobre ${CATEGORIES[category]}. 
        Cada pregunta debe tener 4 opciones y solo una correcta. 
        Devuelve el resultado en formato JSON como este ejemplo:
        {
        "questions": [
            {
            "question": "¿Quién pintó La Mona Lisa?",
            "options": ["a) Pablo Picasso", "b) Vincent van Gogh", "c) Leonardo da Vinci", "d) Salvador Dalí"],
            "correctAnswer": "c"
            }
        ]
        }`;

        const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            { role: "system", content: "Eres un generador de preguntas de trivia. Devuelve solo el JSON." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        const questionsData = JSON.parse(content).questions;

        // Crear nuevo juego en la base de datos
        const game = new Game({
        category,
        questions: questionsData.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer
        })),
        score: 0
        });

        await game.save();

        res.json({
        gameId: game._id,
        questions: questionsData
        });

    } catch (error) {
        console.error('Error al iniciar el juego:', error);
        res.status(500).json({ error: 'Error al iniciar el juego' });
    }
    };

    export const submitAnswers = async (req, res) => {
    try {
        const { gameId, answers } = req.body;
        
        const game = await Game.findById(gameId);
        if (!game) {
        return res.status(404).json({ error: 'Juego no encontrado' });
        }

        // Calcular puntaje
        let score = 0;
        game.questions.forEach((question, index) => {
        const userAnswer = answers[index];
        question.userAnswer = userAnswer;
        
        if (userAnswer === question.correctAnswer) {
            score += 1;
        }
        });

        game.score = score;
        game.completedAt = new Date();
        await game.save();

        res.json({
        score,
        totalQuestions: game.questions.length,
        correctAnswers: game.questions.filter(q => q.userAnswer === q.correctAnswer).length,
        questions: game.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: q.userAnswer
        }))
        });

    } catch (error) {
        console.error('Error al enviar respuestas:', error);
        res.status(500).json({ error: 'Error al enviar respuestas' });
    }
    };