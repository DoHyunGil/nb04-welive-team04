import passport from 'passport';
import jwtStrategy from '../lib/passports/jwtStrategy.js';

// JWT Strategy 등록
passport.use('jwt', jwtStrategy);

export default passport;
