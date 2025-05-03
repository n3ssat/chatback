import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Farándula', 'Historia', 'Ciencia', 'Deporte', 'Arte']
  },
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
    userAnswer: String
  }],
  score: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

const Game = mongoose.model('Game', gameSchema);

export default Game;