import { TENANT, TENANT_CLIENT_ID } from "./config";

var user = null;

export function getUser() {
    if (user != null) {
        return user;
    }
    const regex = new RegExp(`${TENANT}-userDetails=([^;]+)`);
    const userDetails = document.cookie.match(regex)?.[1];
    if (!userDetails) {
        return null;
    }
    const decodedUserDetails = decodeURIComponent(userDetails).slice(2);
    const userDetailsJSON = JSON.parse(decodedUserDetails);

    user = userDetailsJSON;
    return user;
}

export function login() {
    window.location.href = `/auth/login?tenant=${TENANT}&clientId=${TENANT_CLIENT_ID}`;
}

export function logout() {
    user = null;
    window.location.href = `/auth/logout?clientId=${TENANT_CLIENT_ID}`;
}