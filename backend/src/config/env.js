import "dotenv/config"

const env = {
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: Number(process.env.EMAIL_PORT || 587),
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
}

export default env;