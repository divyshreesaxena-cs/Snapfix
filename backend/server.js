const dotenv = require('dotenv');
const createApp = require('./app');
const logger = require('./utils/logger');

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp({ connectDatabase: true });

app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});
