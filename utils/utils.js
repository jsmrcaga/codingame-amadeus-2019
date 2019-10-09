const pythagoras = ({x: ax, y: ay}, {x: bx, y: by}) => {
	const a = Math.abs(bx - ax);
	const b = Math.abs(by - ay);

	return Math.sqrt(a**2 + b**2);
};

module.exports = {
	pythagoras
};
