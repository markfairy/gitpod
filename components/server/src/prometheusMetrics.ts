import * as prometheusClient from 'prom-client';

// Enable collection of default metrics.
prometheusClient.collectDefaultMetrics({ timeout: 5000 });
export const register = prometheusClient.register;

const loginCounter = new prometheusClient.Counter({
    name: 'gitpod_login_requests_total',
    help: 'Total amount of login requests',
    labelNames: ['status', 'auth_host'],
    registers: [prometheusClient.register]
});

export function increaseLoginCounter(status: string, auth_host: string) {
    loginCounter.inc({
        status,
        auth_host,
    });
}

const apiConnectionCounter = new prometheusClient.Counter({
    name: 'gitpod_api_connection',
    help: 'Total amount of established API connections',
    registers: [prometheusClient.register],
});

export function increaseApiConnectionCounter() {
    apiConnectionCounter.inc();
}

const apiConnectionClosedCounter = new prometheusClient.Counter({
    name: 'gitpod_api_connection_closed',
    help: 'Total amount of closed API connections',
    registers: [prometheusClient.register],
});

export function increaseApiConnectionClosedCounter() {
    apiConnectionClosedCounter.inc();
}

const apiCallCounter = new prometheusClient.Counter({
    name: 'gitpod_api_call',
    help: 'Total amount of API calls per method',
    labelNames: ['method'],
    registers: [prometheusClient.register],
});

export function increaseApiCallCounter(method: string) {
    apiCallCounter.inc({ method });
}
