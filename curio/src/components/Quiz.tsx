import { useEffect, useState } from "react";
import { Box, Button, Container, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Curio } from "../services/curioServices";
import { DataType, PeerData } from "../services/types";
import * as fs from 'fs';

type Props = {
	sendMessage: ((message: PeerData) => void) | undefined;
};

export default function QuizController({ sendMessage }: Props) {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isMoving, setIsMoving] = useState<boolean>(false);
	const [isMovingForward, setIsMovingForward] = useState<boolean>(false);

	// Multiple-choice question state
	const [question, setQuestion] = useState<string | null>(null);
	const [answers, setAnswers] = useState<string[]>([]);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
	const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
	const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(false);

	// Quiz progress state
	const [questionCount, setQuestionCount] = useState(0);
	const [quizComplete, setQuizComplete] = useState(false);

	const moveOptions = ['Move Forward', 'Turn Left', 'Turn Right', 'Move Backwards'];
	const [showPopup, setShowPopup] = useState(false);
	const [selectedMoveOption, setSelectedMoveOption] = useState('');

	const curio = new Curio();

	const moveForward = () => {
		curio.setParameters(0, 1, 100);
		curio.move();
	}

	const turnLeft = () => {
		curio.setParameters(-1,0,100);
		curio.move();
	}

	const turnRight = () => {
		curio.setParameters(1,0,100);
		curio.move();
	}

	const moveBackwards = () => {
		curio.setParameters(0,-1,100);
		curio.move();
	}
	
	useEffect(() => {
		if (buttonsDisabled) {
			// Re-enable the buttons after 3 seconds
			const timeout = setTimeout(() => setButtonsDisabled(false), 3000);
			
			// Clear the timeout if the component unmounts
			return () => clearTimeout(timeout);
		}
	}, [buttonsDisabled]);
	
	// Initialize the multiple-choice question
	const initQuestion = async () => {
		try {
			const response = await fetch('./questions.txt');
			const text = await response.text();
			console.log("gretg - " + text)
			const lines = text.split('\n');
			const randomLine = lines[Math.floor(Math.random() * lines.length)];
			const data = randomLine.split('|');

			const question = data[0];
			const correctAnswer = data[1];
			const wrongAnswers = data.slice(2);
			const answers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

			setQuestion(question);
			setCorrectAnswer(correctAnswer);
			setAnswers(answers);
						
		} catch (err) {
			console.error('Failed to fetch questions', err);
		}
	};

	const handleAnswerSelect = async (answer: string) => {
		setSelectedAnswer(answer);
		if (answer === correctAnswer) {
			setShowPopup(true);
		} else {
			setAnswerCorrect(false);
			setButtonsDisabled(true); // Disable buttons when the answer is wrong
		}
	};
	
	const handleConnect = () => {
		if (sendMessage) {
			const connectData: PeerData = {
				type: DataType.CURIO_CONNECT,
				data: { isConnected: isConnected },
			};
			sendMessage(connectData);
			setIsConnected(!isConnected);
		} else {
			if (!isConnected) {
				curio.connect(() => {
					console.log("Connected");
					setIsConnected(true);
				});
			} else {
				curio.disconnect(() => {
					console.log("Disconnected");
					setIsConnected(false);
				});
			}
		}
	};

	// x = turn, y = straight
	const handleMove = (x: number, y: number, distance: number) => {
		if (sendMessage) {
			const moveData: PeerData = {
				type: DataType.CURIO_MOVE_VECTOR,
				data: { x: x, y: y, speed: distance },
			};
			sendMessage(moveData);

			if (!isMoving) {
				const moveCommand: PeerData = {
					type: DataType.CURIO_MOVE,
					data: { message: "move" },
				};
				sendMessage(moveCommand);
			}
		} else {
			curio.setParameters(x, y, distance);
			if (!isMoving) {
				curio.move();
			}
		}

		setIsMoving(true);
	};

	const handleStart = () => {
		//setIsMoving(true);
	};

	const handleStop = () => {
		if (sendMessage) {
			const moveData: PeerData = {
				type: DataType.CURIO_MOVE_VECTOR,
				data: { x: 0, y: 0, speed: 0 },
			};
			sendMessage(moveData);
		} else {
			curio.setParameters(0, 0, 0);
		}
		setIsMoving(false);
	};

	useEffect(() => {
		initQuestion();
		const autoConnect = async () => {
			try {
				if (!isConnected) {
					await curio.connect();
					setIsConnected(true);
				}
			}
			catch (error) {
			}
		};

		let intervalId: NodeJS.Timer;

		if (isMoving) {
			if (sendMessage) {
				const moveCommand: PeerData = {
					type: DataType.CURIO_MOVE,
					data: { message: "move" },
				};
				sendMessage(moveCommand);
			} else {
				curio.move();
			}
			intervalId = setInterval(() => {
				if (sendMessage) {
					const moveCommand: PeerData = {
						type: DataType.CURIO_MOVE,
						data: { message: "move" },
					};
					sendMessage(moveCommand);
				} else {
					curio.move();
				}
			}, 1000);
		}

		autoConnect();

		return () => {
			clearInterval(intervalId);
			if (isConnected) {
				if (sendMessage) {
					const stopCommand: PeerData = {
						type: DataType.CURIO_MOVE,
						data: { message: "stop" },
					};
					sendMessage(stopCommand);
				} else {
					curio.stop();
				}
			}
		};
	}, [isMoving]);

	// 10 answers correct = quiz complete
	useEffect(() => {
		if (questionCount === 10) {
			setQuizComplete(true);
		}
	}, [questionCount]);

	useEffect(() => {
		if (selectedMoveOption === 'Move Forward') {
			moveForward();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion();
		} else if (selectedMoveOption === 'Turn Left') {
			turnLeft();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion();
		} else if (selectedMoveOption === 'Turn Right') {
			turnRight();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion();
		} else if (selectedMoveOption === 'Move Backwards') {
			moveBackwards();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion();
		}
	
		// Reset the selected option and hide the pop-up
		setSelectedMoveOption('');
		setShowPopup(false);
	}, [selectedMoveOption]);


	return (
		<Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
			{!isConnected && <Box>Robot Not Connected</Box>}

			{/* Render the question and answers only when isConnected is true */}
			{isConnected && !quizComplete && (
				<>
					<Box>{questionCount + 1}. {question}</Box>
					{answers.map((answer) => (
						<Button
							key={answer}
							onClick={() => handleAnswerSelect(answer)}
							disabled={isMoving || buttonsDisabled} // disable button while the robot is moving or while the buttons are disabled
							variant="contained"
							style={{
								backgroundColor: selectedAnswer === answer ? (answerCorrect ? 'green' : 'red') : undefined,
							}}
						>
							{answer}
						</Button>
						
					))}

					<Dialog
					open={showPopup}
					BackdropProps={{
						// This will prevent the user from closing the dialog by clicking outside
						onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
						event.stopPropagation();
						},
					}}
					PaperProps={{
						// This will prevent the user from closing the dialog by pressing escape key
						onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
						if (event.key === 'Escape') {
							event.stopPropagation();
						}
						},
					}}
					>
						<DialogTitle>Choose an Option</DialogTitle>
						<DialogContent>
						{moveOptions.map((option) => (
							<Button key={option} onClick={() => setSelectedMoveOption(option)}>
								{option}
							</Button>
						))}
						</DialogContent>
					</Dialog>

					{answerCorrect !== null && (
						<Box>{answerCorrect ? 'Your last answer was correct.' : 'Your last answer was incorrect.'}</Box>
					)}
				</>
			)}
				{quizComplete && <Box>Quiz complete!</Box>}
		</Stack>
	);
}
