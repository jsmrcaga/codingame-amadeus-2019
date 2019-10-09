const EntityFactory = require('./entities/entity-factory');

const ENTITIES = {
	0: 'robots',
	1: 'enemies',
	2: 'radars',
	3: 'traps'
};

class Game {
	constructor() {
		this.entities = {
			robots: [],
			enemies: [],
			radars: [],
			traps: []
		};

		this.matrix = null;
		this.round = 0;

		this.radarCooldown = 0;
		this.trapCooldown = 0;
	}

	update(matrix, entities, radarCooldown, trapCooldown) {
		printErr(`Update ${this.round}`)
		this.round++;
		this.matrix = matrix;
		this.radarCooldown = radarCooldown;
		this.trapCooldown = trapCooldown;
		this.update_entities(entities);

		this.matrix.ores = this.matrix.ores.filter(ore => {
			// DIscard ores where there is nothing
			if(ore.qtty <= 0){
				return false;
			}

			// Discard ores where there are traps
			if(this.entities.traps.find(t => t.position.x === ore.x && t.position.y === ore.y)){
				return false;
			}

			return true;
		});
	}

	update_entities(entities) {
		for (let entity of entities) {
			let type = ENTITIES[entity.type];
			let exists = this.entities[type].find(e => e.id === entity.id);
			if(!exists) {
				let instance = EntityFactory(entity);
				if(type === 'robots') {
					instance.on('trap', ({x, y}) => {
						this.entities.robots.forEach(robot => robot.blacklist({x, y}));
					});
				}
				this.entities[type].push(instance);
				continue;
			}

			exists.update(entity, this.matrix, this.round);
		}
	}

	play() {
		printErr(`Playing ${this.round} for ${this.entities.robots.length} robots (${this.entities.robots.map(r => r.id).join(', ')})`);
		printErr(`Aware of ${this.matrix.ores.length} ores totaling: ${this.matrix.ores.reduce((sum, ore) => sum + ore.qtty, 0)} ore`);
		for(let robot of this.entities.robots) {
			robot.play(this.entities, this.matrix, this.radarCooldown, this.trapCooldown);
		}
	}
}

module.exports = Game;
