const REQUIRED_ENV_VARIABLES = [
    'APP_SECRET',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME'
];

function handlerOfServerError(err, req, res, next) {
    console.error(err.stack);

    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message
    });
}

function isEnvironmentVariablesExist() {
    let result = true;
    REQUIRED_ENV_VARIABLES.some(item => {
        if (!process.env.hasOwnProperty(item)) {
            result = false;
        }
    });

    return result;
}

if (!isEnvironmentVariablesExist()) {
    console.error(`Please fill in the correct environment variables [ ${REQUIRED_ENV_VARIABLES.join(', ')} ] in the .env file.`);
    process.exit(1);
}

import express from 'express';
import * as path from "path";
import cors from 'cors';
import swaggerUI from 'swagger-ui-express';
import swaggerDocs from './docs/openapi.json' with { type: 'json' };

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as jwtMiddleware from './src/auth/middlewares/jwt.js';
import userRouter from './src/user/routes.js';
import authRoutes from './src/auth/routes.js';
import calendarRoutes from './src/calendar/routes.js';

const app = express();
const PORT = 8080;

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.use('/api/auth/', jwtMiddleware.setUserByJWT, authRoutes);
app.use('/api/users/', jwtMiddleware.setUserByJWT, userRouter);
app.use('/api/calendars/', jwtMiddleware.setUserByJWT, calendarRoutes);

app.all('*', (req, res) => {
    return res.status(404).json({
        message: "Endpoint not found."
    });
});

app.use(handlerOfServerError);


app.listen(PORT, () => {
    console.log(`✔ API Docs: http://localhost:${PORT}/api-docs/`);
});