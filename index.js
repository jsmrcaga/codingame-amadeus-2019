const Game = require('./game');

const game = new Game();

var inputs = readline().split(' ');
const width = parseInt(inputs[0]);
const height = parseInt(inputs[1]); // size of the map

// game loop
while (true) {
	var inputs = readline().split(' ');
	const myScore = parseInt(inputs[0]); // Amount of ore delivered
	const opponentScore = parseInt(inputs[1]);

	matrix = [];
	matrix.ores = [];
	matrix.traps = [];

	for (let i = 0; i < height; i++) {
		let column = [];
		matrix.push(column);

		var inputs = readline().split(' ');
		for (let j = 0; j < width; j++) {
			const ore = inputs[2*j];// amount of ore or "?" if unknown
			const hole = parseInt(inputs[2*j+1]);// 1 if cell has a hole
			column.push({ ore, hole, entities: [] });
			if(ore !== '?') {
				matrix.ores.push({
					x: parseInt(j),
					y: parseInt(i),
					qtty: parseInt(ore)
				});
			}
		}
	}

	let entities = [];

	var inputs = readline().split(' ');
	const entityCount = parseInt(inputs[0]); // number of entities visible to you
	const radarCooldown = parseInt(inputs[1]); // turns left until a new radar can be requested
	const trapCooldown = parseInt(inputs[2]); // turns left until a new trap can be requested

	for (let i = 0; i < entityCount; i++) {
		var inputs = readline().split(' ');
		const id = parseInt(inputs[0]); // unique id of the entity
		const type = parseInt(inputs[1]); // 0 for your robot, 1 for other robot, 2 for radar, 3 for trap
		const x = parseInt(inputs[2]);
		const y = parseInt(inputs[3]); // position of the entity
		const item = parseInt(inputs[4]); // if this entity is a robot, the item it is carrying (-1 for NONE, 2 for RADAR, 3 for TRAP, 4 for ORE)
		entities.push({
			id,
			type,
			x,
			y,
			item
		});
	}
	
	// Update game every loop
	game.update(matrix, entities, radarCooldown, trapCooldown);

	// Play the game every loop
	game.play();
}
