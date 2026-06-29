const { Redis } = require("@upstash/redis");
const redis = new Redis({
  url: "https://peaceful-salmon-144503.upstash.io",
  token: "gQAAAAAAAjR3AAIgcDE5MWQ2NmMwZWJlM2Q0MDA3Yjc5OWNmZTVkN2RhZGI3Zg",
});

async function main() {
  const keys = await redis.keys("*");
  console.log("Redis keys:", keys);
}

main().catch(console.error);
