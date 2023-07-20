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

	const curio = new Curio();

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
		<Stack
			direction="column"
			justifyContent="center"
			alignItems="center"
			spacing={20}
		>
			<Button
				onClick={() => {
					handleConnect();
				}}
				style={
					isConnected
						? {
								backgroundColor: "rgba(171, 61, 89, 255)",
						  }
						: {
								backgroundColor: "rgba(61, 89, 171, 255)",
						  }
				}
				sx={{ mt: 10 }}
				variant="contained"
			>
				{isConnected ? "DISCONNECT" : "CONNECT TO CURIO"}
			</Button>
			
			{isConnected && (
				<Button
				onClick={() => {
					handleMove(0,1,100)
				  }}
				sx={{ mt: 10 }}
				variant="contained"
				>
					START MOVING
				</Button>
			)}
			{isConnected && (
				<Button
				onClick={() => {
					handleStop()
				  }}
				  sx={{ mt: 10 }}
				  variant="contained"
				  >
					STOP MOVING
				</Button>
			)}
		</Stack>
	);
}
