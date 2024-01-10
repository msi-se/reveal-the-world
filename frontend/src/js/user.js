var user = null;

export function getUser() {
    if (user != null) {
        return user;
    }
    const userDetails = document.cookie.match(/userDetails=([^;]+)/)?.[1];
    if (!userDetails) {
        return null;
    }
    const decodedUserDetails = decodeURIComponent(userDetails).slice(2);
    const userDetailsJSON = JSON.parse(decodedUserDetails);

    user = userDetailsJSON;
    return user;
}

export function login() {
    window.location.href = "/auth/login";
}

export function logout() {
    user = null;
    window.location.href = "/auth/logout";
}