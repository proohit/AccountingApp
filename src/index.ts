import Koa from 'koa';
import parser from 'koa-bodyparser';
import cors from 'koa-cors';
import Router from 'koa-router';
import config from '../config';
import recordRouter from './record/services/recordRouter';
import authenticationRouter from './shared/services/authenticationRouter';
import documentationRouter from './shared/services/documentationRouter';
import walletRouter from './wallet/services/walletRouter';

const app = new Koa();
const router = new Router({ prefix: '/api' });

app.use(parser());
app.use(cors());

router.use(async (ctx, next) => {
    try {
        ctx.type = 'application/json';
        await next();
    } catch (error) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
            message: ctx.status === 500 ? 'Oops, something went wrong...' : error.message,
        };
    }
});
router.use('/records', recordRouter);
router.use('/wallets', walletRouter);
router.use('/auth', authenticationRouter);
router.use('/docs', documentationRouter);

app.use(router.allowedMethods({ throw: true }));
app.use(router.routes());

try {
    app.listen(config.backendPort);
    console.log(`running on port ${config.backendPort}`);
} catch (e) {
    console.log(e);
}
