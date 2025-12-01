import passport from 'passport';
// import { localStrategy } from './localStrategy.js';
// import { jwtStrategy } from './jwtStrategy.js';

// passport.use(localStrategy);
// passport.use(jwtStrategy);

const localAuth = passport.authenticate('local', { session: false });
const jwtAuth = passport.authenticate('jwt', { session: false });

const passports = {
  localAuth: localAuth,
  jwtAuth: jwtAuth,
};

export default passports;
