const Entity = require('./entity');
const { Enemy, Robot } = require('./robot');

const TYPES = {
	0: Robot,
	1: Enemy,
};

module.exports = (entity) => {
	const { type, id, x, y, item } = entity;
	const Class = TYPES[type] || Entity;
	return new Class(id, { x, y }, item);
};
