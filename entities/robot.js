const { pythagoras } = require('../utils/utils');

const Entity = require('./entity');

const ITEMS = {
	'-1': null,
	2: 'radar',
	3: 'trap',
	4: 'ore'
};

class R extends Entity {
	constructor(id, {x, y}, item=-1) {
		super(id, {x, y});
		
		this.item = ITEMS[item];
		this.dead = false;
	}

	die() {
		this.dead = true;
	}

	update(entity, matrix, round) {
		if(this.dead) {
			return;
		}

		// Entity died
		let { x, y } = entity;
		if(entity.x === -1 && entity.y === -1) {
			return this.die();
		}

		// Update coords
		this.position.x = x;
		this.position.y = y;

		// Update item
		this.item = ITEMS[entity.item];
	}
}

class Enemy extends R {}

class Robot extends R {
	constructor() {
		super(...arguments);
		this.busy = false;
		this.current_action = '';
		this.next_action = null;
		this.meta = {};
		this.black_list = [];

		this.events = {
			trap: []
		}
	}

	emit(event, data) {
		if(!this.events[event]) {
			return;
		}

		for(let cb of this.events[event]) {
			cb(data);
		}
	}

	on(event, cb) {
		this.events[event] = this.events[event] || [];
		this.events[event].push(cb);
	}

	blacklist({x, y}) {
		printErr(`Blacklisting ${x} ${y}`);
		this.black_list.push({x, y});
	}

	free() {
		this.next_action = null;
	}

	move({x, y}, callback=null, message='') {
		// Wait until we are where we need to be
		if(callback) {
			this.meta = { x, y };
			this.next_action = () => this.move_wait(callback, message);
			this.next_action.description = message;
		}
		return console.log(`MOVE ${x} ${y} ${message}`);
	}

	move_wait(callback=()=>{}, message) {
		let { x, y } = this.position;
		let { x: tx, y: ty } = this.meta;

		if(x !== tx || y !== ty) {
			return this.move({x: tx, y: ty}, callback, message);
		}

		// arrived at destination
		this.meta = {};
		this.free();

		return callback ? callback() : undefined;
	}

	dig({x, y}, message='') {
		// up left down right self
		return console.log(`DIG ${x} ${y} ${message}`);
	}

	request(what) {
		return console.log(`REQUEST ${what}`);
	}

	wait(message='') {
		console.log(`WAIT ${this.current_action} ${message}`);
	}

	deliver(message='') {
		// go to headquarters
		return this.headquarters(message);
	}

	headquarters(message='') {
		return this.move({
			x: 0,
			y: this.position.y
		}, () => {
			this.wait('Returning something');
		}, message);
	}

	placeRadar(matrix, radars, traps) {
		let closestOre = this.get_closest_ore(matrix);
		if(closestOre) {
			// will place radar at the same time
			return this.recover_ore(closestOre);
		}

		let { x, y } = this.random_coords(matrix, { x:-2, y:0 });

		return this.move({x, y}, () => {
			this.dig({x, y}, `Placing radar`);
		}, `Going to place radar`);
	}

	random_coords(matrix, {x: ox=0, y: oy=0}={}) {
		let h = matrix.length;
		let w = matrix[0].length;

		let x = Math.floor(Math.random() * w);
		let y = Math.floor(Math.random() * h);

		return {x, y};
	}

	use(type, matrix, radars, traps) {
		switch(type) {
			case 'radar':
				// find unknown 3x3 place
				return this.placeRadar(matrix, radars, traps);
			case 'trap':
				// Closest ore block with at least 2 ores
				let closestOre = this.get_closest_ore(matrix, 2);
				if(closestOre){
					// will dig and place trap at the same time
					this.emit('trap', {
						x: closestOre.x,
						y: closestOre.y
					});
					return this.recover_ore(closestOre);
				}

				// Allow others to blacklist
				let { x, y } = this.random_coords(matrix);
				this.emit('trap', {x, y});
				return this.move({x, y}, () => {
					this.dig({x, y}, `Placing trap`);
				}, `Going to place trap`);
				// go to any empty cell
			case 'ore':
				return this.headquarters('Returning ore');
		}
	}

	get_closest_ore(matrix, min_qtty=null) {
		// Do we know where ORE is?
		if(!matrix.ores.length) {
			return null;
		}

		let {position} = this;
		matrix.ores.sort((ore1, ore2) => pythagoras(position, ore1) - pythagoras(position, ore2));
		
		let ores = [...matrix.ores];

		if(min_qtty) {
			ores = ores.filter(o => o.qtty >= min_qtty);
		}

		if(!ores.length) {
			return null;
		}

		let i = 0;
		let found = this.black_list.find(e => e.x === ores[i].x && e.y === ores[i].y);
		while(found) {
			i++;
			if(!ores[i]) {
				return null;
			}
			found = this.black_list.find(e => e.x === ores[i].x && e.y === ores[i].y);
		}
		return ores[i];
	}

	recover_ore(ore) {
		let { x, y } = ore;
		printErr(`Robot ${this.id} is moving to get closest ore`);
		return this.move({ x, y }, () => {
			this.dig({ x, y });
		}, `Going to recover closest ore`);
	}

	play({ robots, enemies, radars, traps }, matrix, radarCooldown, trapCooldown) {
		if(this.dead) {
			printErr(`Robot ${this.id} is dead`);
			return this.wait('dead');
		}

		// If an action predicted another action
		// and reset meta afterwards
		if(this.next_action) {
			printErr(`Robot ${this.id} has next action: ${this.next_action.description}`);
			this.next_action();
			return;
		}

		// If robot has an item
		if(this.item) {
			printErr(`Robot ${this.id} will use item ${this.item}`);
			return this.use(this.item, matrix, radars, traps);
		}

		// This robot is supposed to get traps
		if(this.canGetTrap(trapCooldown)) {
			return this.request('TRAP');
		}

		// or maybe radars ?
		if(this.canGetRadar(radarCooldown)) {
			return this.request('RADAR');
		}

		return this.action(...arguments);
	}

	action({ robots, enemies, radars, traps }, matrix, radarCooldown, trapCooldown) {
		let closestOre = this.get_closest_ore(matrix);

		if(closestOre) {
			return this.recover_ore(closestOre);
		}

		// If not, go to a random middle place and dig
		let { x, y } = this.random_coords(matrix, { x:-2, y:0 });

		printErr(`Robot ${this.id} is moving randomly, (${x}, ${y})`);
		return this.move({ x, y }, () => {
			this.dig({x, y});
		}, 'digging random palce');
	}

	canGetRadar(radarCooldown) {
		return radarCooldown <= 0 && this.position.x === 0;
	}

	canGetTrap(trapCooldown) {
		return trapCooldown <= 0 && this.position.x === 0;
	}
}

module.exports = { Robot, Enemy } ;
