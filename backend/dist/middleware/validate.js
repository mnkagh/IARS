"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, _res, next) => {
    try {
        if (schema.body)
            req.body = schema.body.parse(req.body);
        if (schema.query)
            req.query = schema.query.parse(req.query);
        if (schema.params)
            req.params = schema.params.parse(req.params);
        next();
    }
    catch (e) {
        next(e);
    }
};
exports.validate = validate;
// Common sanitization: trim strings, limit lengths globally via Zod .max() per schema
//# sourceMappingURL=validate.js.map