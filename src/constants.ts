export const ERR_COLOR = '\x1b[31m';
export const OK_COLOR = '\x1b[32m';
export const RESET_COLOR = '\x1b[0m';
export const ERR_SYMBOL = `${ERR_COLOR}✕${RESET_COLOR}`;
export const OK_SYMBOL = `${OK_COLOR}✔${RESET_COLOR}`;
export const ALLOWED_TYPE_NAMES = [
	'ZodString',
	'ZodEnum',
	'ZodLiteral',
	'ZodEffects',
	'ZodUnion',
	'ZodOptional',
];
