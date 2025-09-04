import aj from '#config/arcjet.js';
import logger from '#config/logger.js';

const geolocationMiddleware = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const decision = await aj.protect(req);
    
    const blockedCountries = ['IR', 'KP', 'SY', 'CU', 'SD', 'MM', 'BY', 'VE']; // Iran, North Korea, Syria, Cuba, Sudan, Myanmar, Belarus, Venezuela
    
    if (decision.ip.hasCountry() && blockedCountries.includes(decision.ip.country)) {
      logger.warn('Geolocation block triggered', {
        ip: req.ip,
        country: decision.ip.country,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access from your location is not permitted',
      });
    }

    next();
  } catch (error) {
    logger.error('Geolocation middleware error:', error);
    next();
  }
};

export default geolocationMiddleware;
