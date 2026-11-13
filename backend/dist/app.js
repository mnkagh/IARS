"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const hpp_1 = __importDefault(require("hpp"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const error_1 = require("./middleware/error");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const assessments_routes_1 = __importDefault(require("./modules/assessments/assessments.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const institutions_routes_1 = __importDefault(require("./modules/institutions/institutions.routes"));
const app = (0, express_1.default)();
// Security headers - Helmet with strict CSP
app.use((0, helmet_1.default)({
    contentSecurityPolicy: env_1.default.HELMET_CSP_ENABLED !== 'false' ? {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", env_1.default.CORS_ORIGIN],
        },
    } : false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
// CORS - whitelist only
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true); // allow non-browser (health checks)
        const allowed = env_1.default.CORS_ORIGIN.split(',').map((s) => s.trim());
        if (allowed.includes(origin) || allowed.includes('*'))
            return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use((0, morgan_1.default)(env_1.default.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express_1.default.json({ limit: '10kb' })); // limit payload size
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
app.use((0, cookie_parser_1.default)(env_1.default.COOKIE_SECRET));
app.use((0, hpp_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
// Rate limit
app.use(rateLimiter_1.globalLimiter);
// Health
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'IARS API healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});
app.get('/api', (_req, res) => {
    res.json({
        success: true,
        message: 'IARS Institutional AI Readiness Scale API',
        version: '1.0.0',
        docs: '/api/v1',
        endpoints: ['/api/v1/auth', '/api/v1/assessments', '/api/v1/users', '/api/v1/institutions'],
    });
});
// API v1
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/assessments', assessments_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/institutions', institutions_routes_1.default);
// 404
app.use(error_1.notFoundHandler);
// Error handler
app.use(error_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map