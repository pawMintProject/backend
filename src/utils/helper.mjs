import bcrypt from 'bcrypt';

const saltRounds = 10;

export const HashPassword = (password) => {
	const salt = bcrypt.genSaltSync(saltRounds);
	return bcrypt.hashSync(password, salt);
};

export const ComparePassword = (plain, hashed) => {
	return bcrypt.compareSync(hashed,plain)

}
// profile.displayName