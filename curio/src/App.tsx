import "./App.css";
import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { PeerData } from "./services/types";
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import QuizController from "./components/Quiz";
import Peer, { DataConnection } from "peerjs";
import LoginPage from './components/LoginPage';

function Home() {
	return (
		<div className="App">
			<QuizController sendMessage={undefined} />
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
				<QuizController sendMessage={sendMessage} />
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
	// State to track the login status
	const [isLoggedIn, setIsLoggedIn] = useState(false);
  
	// Function to handle successful login
	const handleLogin = () => {
	  setIsLoggedIn(true);
	};
  
	return (
	  <BrowserRouter>
		{/* Conditionally render the LoginPage or the Home component */}
		{isLoggedIn ? (
		  <Routes>
			<Route path="/" element={<Home />} />
			<Route path="/:roomID" element={<HomePeer />} />
		  </Routes>
		) : (
		  <LoginPage onLogin={handleLogin} />
		)}
	  </BrowserRouter>
	);
  }
  
  export default App;
