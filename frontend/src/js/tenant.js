/* eslint-disable no-undef */
const TENANT = import.meta.env.VITE_TENANT;
const TENANT_CLIENT_ID = import.meta.env.VITE_TENANT_CLIENT_ID;
const PATH = TENANT === 'default' ? '' : `/${TENANT}`;
// const TENANT = "default";
// const TENANT_CLIENT_ID = "e9fdb985-9173-4e01-9d73-ac2d60d1dc8e";

console.log(TENANT);

export {
    PATH,
    TENANT,
    TENANT_CLIENT_ID
};