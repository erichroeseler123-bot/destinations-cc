const apiKey = "406d9dde-ffa7-4b8c-9031-c707010c716b";
fetch("https://api.viator.com/partner/destinations", {
  method: "GET",
  headers: {
    Accept: "application/json;version=2.0",
    "Accept-Language": "en-US",
    "exp-api-key": apiKey,
  },
})
  .then(async (res) => {
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response:", body.slice(0, 500));
  })
  .catch((err) => console.error(err));
