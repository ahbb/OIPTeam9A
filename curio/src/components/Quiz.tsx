import { useEffect, useState } from "react";
import { Box, Button, Container, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem } from "@mui/material";
import { Curio } from "../services/curioServices";
import { DataType, PeerData } from "../services/types";
import * as fs from 'fs';
import { TextField } from "@mui/material";

type Props = {
	sendMessage: ((message: PeerData) => void) | undefined;
};

export default function QuizController({ sendMessage }: Props) {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isMoving, setIsMoving] = useState<boolean>(false);
	const [isMovingForward, setIsMovingForward] = useState<boolean>(false);
	const [numCheckpoints, setNumCheckpoints] = useState<number | null>(null);
	const [checkpointsComplete, setCheckpointsComplete] = useState(0);
	const [quizStarted, setQuizStarted] = useState(false);


	// Multiple-choice question state
	const [question, setQuestion] = useState<string | null>(null);
	const [answers, setAnswers] = useState<string[]>([]);
	// Add this state variable
	const [pointsToWin, setPointsToWin] = useState<number>(10); // Set the default value to 10 or any other value you prefer.
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
	const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
	const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
	const [buttonsDisabled, setButtonsDisabled] = useState<boolean>(false);
	const [selectedFilename, setSelectedFilename] = useState<string>('');


	// Quiz progress state
	const [questionCount, setQuestionCount] = useState(0);
	const [quizComplete, setQuizComplete] = useState(false);

	const moveOptions = ['Move Forward', 'Turn Left', 'Turn Right'];
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
	
	  // The quiz is complete when the number of completed checkpoints is equal to the number of desired checkpoints
	  // Replace the existing useEffect block
	// The quiz is complete when the number of completed checkpoints is greater than or equal to the number of desired checkpoints
	useEffect(() => {
		if (numCheckpoints !== null && checkpointsComplete >= pointsToWin) {
		setQuizComplete(true);
		}
	}, [checkpointsComplete, numCheckpoints, pointsToWin]);
	
	// Function to start the quiz
	const startQuiz = () => {
		setQuizStarted(true);
		// reset counts
		setQuestionCount(0);
		initQuestion(selectedFilename);
	  };


	const initQuestion = async (filename : String) => {
		try {
			const response = await fetch(`./${filename}`);
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
			moveBackwards();
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
		initQuestion(selectedFilename);
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

	useEffect(() => {
		if (selectedMoveOption === 'Move Forward') {
			moveForward();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion(selectedFilename);
		} else if (selectedMoveOption === 'Turn Left') {
			turnLeft();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion(selectedFilename);
		} else if (selectedMoveOption === 'Turn Right') {
			turnRight();
			setAnswerCorrect(true);
			setQuestionCount((prevCount) => prevCount + 1); // increment question count
			initQuestion(selectedFilename);
		} 
	
		// Reset the selected option and hide the pop-up
		setSelectedMoveOption('');
		setShowPopup(false);
	}, [selectedMoveOption]);

	const handleFileSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// Call initQuestion with the selected filename
		initQuestion(selectedFilename);
	};	  

	return (
		<Stack direction="column" justifyContent="center" alignItems="center" spacing={2}>
		  {!quizStarted ? (
			<form onSubmit={handleFileSubmit}>
			<Select
				label="Enter Filename" // Note: Select doesn't use "label" prop directly, you may need to adjust styling accordingly.
				value={selectedFilename}
				onChange={(e) => setSelectedFilename(e.target.value)}
				style={{ width: "50%" }}
				>
				<MenuItem value="week1.txt">Week 1</MenuItem>
				<MenuItem value="week2.txt">Week 2</MenuItem>
				<MenuItem value="week3.txt">Week 3</MenuItem>
			</Select>
			<Box>
			  <Button onClick={startQuiz} variant="contained" color="primary">
				Start
			  </Button>
			</Box>
			</form>
		  ) : isConnected && !quizComplete ? (
			<>
			  <Box>
				{questionCount + 1}. {question}
			  </Box>
			  {answers.map((answer) => (
				<Button
				  key={answer}
				  onClick={() => handleAnswerSelect(answer)}
				  disabled={isMoving || buttonsDisabled}
				  variant="contained"
				  style={{
					backgroundColor:
					  selectedAnswer === answer
						? answerCorrect
						  ? "green"
						  : "red"
						: undefined,
				  }}
				>
				  {answer}
				</Button>
			  ))}
			  <Dialog
				open={showPopup}
				BackdropProps={{
				  onClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
					event.stopPropagation();
				  },
				}}
				PaperProps={{
				  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
					if (event.key === "Escape") {
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
				<Box>
				  {answerCorrect
					? "Your last answer was correct."
					: "Your last answer was incorrect."}
				</Box>
			  )}
			</>
		  ) : (
			<Box>Quiz complete!</Box>
		  )}
		</Stack>
	  );
	  
}
