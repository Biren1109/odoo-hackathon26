"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
function authorize(...roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!roles.includes(user.role))
            return res.status(403).json({ message: 'Forbidden — Insufficient role' });
        next();
    };
}
