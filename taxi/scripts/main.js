
async function Ajax(params) {
    var formData = new FormData();
    for (let key in params) {
        formData.append(key, params[key]);
    }

    const request = new Request(BASEURL + "/ajax", {
        method: "POST",
        body: formData
    });
    try {
        const response = await fetch(request);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        //console.error(error.message);
    }
    return null;
}

let user = Telegram.WebApp.initDataUnsafe.user;
if (user) {
    console.log(user);
    Ajax({"action":"setUser", "data": user});
}
