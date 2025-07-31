"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Enable CORS for web interface
    app.enableCors({
        origin: true,
        credentials: true
    });
    // Serve static files from public directory
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'), {
        prefix: '/',
    });
    await app.listen(3000);
    console.log('🚀 RPA Socket.IO Server running on http://localhost:3000');
    console.log('📱 Web interface available at http://localhost:3000');
}
bootstrap();
