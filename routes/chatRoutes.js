import express from 'express';
import { startGame, submitAnswers } from '../controllers/gameController.js';

const router = express.Router();

router.post('/start', startGame);
router.post('/submit', submitAnswers);

export { router };