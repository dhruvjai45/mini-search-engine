import axios from "axios";

const BASE_URL = "http://localhost:5000/documents";

const TOTAL_DOCS = 800;
const BATCH_DELAY_MS = 80;
const RETRY_LIMIT = 2;

const topics = [
  "machine learning",
  "deep learning",
  "neural networks",
  "data science",
  "reinforcement learning",
  "computer vision",
  "natural language processing",
  "big data",
  "artificial intelligence",
  "statistics"
];

const templates = [
  "An introduction to {topic} covering fundamentals and applications.",
  "{topic} enables systems to learn patterns and make intelligent decisions.",
  "This article explores advanced concepts in {topic} and scalable systems.",
  "{topic} is widely used in industry for automation and prediction tasks.",
  "Modern applications rely on {topic} for data-driven insights."
];

const noise = [
  "high performance systems",
  "low latency pipelines",
  "distributed architecture",
  "real-time analytics",
  "scalable infrastructure",
  "cloud-native deployment"
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateContent(topic: string, i: number) {
  const t1 = randomItem(templates).replace("{topic}", topic);
  const t2 = randomItem(templates).replace("{topic}", topic);
  const n1 = randomItem(noise);
  const n2 = randomItem(noise);

  return `${t1} ${t2} This document discusses ${topic} in context of ${n1} and ${n2}. Unique ID: ${i}`;
}

async function postWithRetry(doc: any, retries = RETRY_LIMIT): Promise<boolean> {
  try {
    await axios.post(BASE_URL, doc);
    return true;
  } catch (err: any) {
    const errorMsg = err.response?.data || err.message;

    if (retries > 0) {
      console.log(`Retrying... (${retries})`, errorMsg);
      await sleep(50);
      return postWithRetry(doc, retries - 1);
    }

    console.log("❌ Failed:", errorMsg);
    return false;
  }
}

async function generate() {
  console.log(`🚀 Generating ${TOTAL_DOCS} documents...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < TOTAL_DOCS; i++) {
    const topic = randomItem(topics);

    const doc = {
      title: `${topic} insights ${i}`,
      content: generateContent(topic, i),
      url: `https://example.com/${topic.replace(/\s/g, "-")}-${i}`,
      sourceType: "manual"
    };

    const res = await postWithRetry(doc);

    if (res) success++;
    else failed++;

    if (i % 10 === 0) {
      console.log(`Progress → ${i}/${TOTAL_DOCS}`);
    }

    await sleep(BATCH_DELAY_MS);
  }

  console.log("\n✅ DONE");
  console.log(`Total Success: ${success}`);
  console.log(`Total Failed: ${failed}`);
}

generate();