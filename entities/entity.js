class Entity {
	constructor(id, {x, y}) {
		this.id = id;
		this.position = { x, y };
	}

	play() {}
	update() {}
}

module.exports = Entity;
