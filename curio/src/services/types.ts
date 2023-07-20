export enum DataType {
	CURIO_CONNECT,
	CURIO_MOVE,
	CURIO_MOVE_PARAMS,
	CURIO_MOVE_VECTOR,
}

export type CurioConnectData = {
	isConnected: boolean;
};

export type CurioMoveCommand = {
	message: string;
};

export type CurioMoveData = {
	x: number;
	y: number;
	speed: number;
};

export type PeerData = {
	type: DataType;
	data: CurioConnectData | CurioMoveCommand | CurioMoveData;
};
