import "./App.css";
import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { PeerData } from "./services/types";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import JoystickController from "./components/Joystick";
import Peer, { DataConnection } from "peerjs";

function Home() {
	return (
		<div className="App">
			<JoystickController sendMessage={undefined} />
		</div>
	);
}

function HomePeer() {
	const { roomID } = useParams();
	const peer = new Peer(); // Create PeerJS instance
	const [connection, setConnection] = useState<DataConnection>(); // Store the connection
	const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

	const peerConnection = () => {
		if (roomID) {
			console.log(roomID);

			const conn = peer.connect(roomID);
			setConnection(conn);
			console.log(conn);
			setIsPeerConnected(true);
		}
	};

	const sendMessage = (data: PeerData) => {
		if (connection) {
			console.log(data);

			connection.send(data); // Send the message to the receiver
		}
	};

	return (
		<div className="App">
			{isPeerConnected ? (
				<JoystickController sendMessage={sendMessage} />
			) : (
				<Stack
					direction="column"
					justifyContent="center"
					alignItems="center"
				>
					<Button
						onClick={() => {
							peerConnection();
						}}
						style={{
							backgroundColor: "green",
						}}
						sx={{ mt: 10 }}
						variant="contained"
					>
						CONNECT TO THE HOST DEVICE
					</Button>
				</Stack>
			)}
		</div>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/:roomID" element={<HomePeer />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
