import { useEffect, useState } from "react";
import { Joystick } from "react-joystick-component";
import { Box, Button, Container, Stack } from "@mui/material";
import { Curio } from "../services/curioServices";
import { DataType, PeerData } from "../services/types";

type Props = {
	sendMessage: ((message: PeerData) => void) | undefined;
};

export default function JoystickControlle({ sendMessage }: Props) {
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const [isMoving, setIsMoving] = useState<boolean>(false);
	const [isMovingForward, setIsMovingForward] = useState<boolean>(false);

	// Multiple-choice question state
	const [question, setQuestion] = useState<string | null>(null);
	const [answers, setAnswers] = useState<string[]>([]);
	const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

	const curio = new Curio();

	// Initialize the multiple-choice question
	const initQuestion = () => {
	const numbers = [1, 5, 4, 8, 9, 100, 5, 78, 37, 52];
	const correctAnswer = "100";
	const answers = ["100", "78", "1", "8"];

	setQuestion(`numbers = [${numbers}]\n What would be the output of this code? print(numbers[5])`);
	setAnswers(answers);
	setSelectedAnswer(null);
	};

	// Handle answer selection
	const handleAnswerSelect = (answer: string) => {
	setSelectedAnswer(answer);
	if (answer === "100") {
		curio.setParameters(0,1,100)
		curio.move()
	} else {
		// Show a notification or message to indicate the wrong answer
		// Robot will not move if the wrong answer is selected
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

	return (
		<Stack direction="column" justifyContent="center" alignItems="center" spacing={20}>
		  {/* Render the question and answers only when isConnected is true */}
		  {isConnected && (
			<>
			  <Box>{question}</Box>
			  {answers.map((answer) => (
				<Button
				  key={answer}
				  onClick={() => handleAnswerSelect(answer)}
				  variant="contained"
				  style={{
					backgroundColor: selectedAnswer === answer ? "green" : undefined,
				  }}
				>
				  {answer}
				</Button>
			  ))}
			</>
		  )}
		</Stack>
	  );
}
