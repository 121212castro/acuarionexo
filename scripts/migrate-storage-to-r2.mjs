import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const required = ["R2_ENDPOINT","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_PUBLIC_BASE_URL"];
for (const key of required) if (!process.env[key]) throw new Error("Falta " + key);
const R2_BUCKET = process.env.R2_BUCKET || "acuarionexo-media";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vqpxhozavfzgtkqscncs.supabase.co";
const manifestPath = process.argv[2] || "data/storage-migration-manifest.json";
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const encodePath = value => value.split("/").map(encodeURIComponent).join("/");
const result = { started_at: new Date().toISOString(), copied: [], skipped: [], failed: [] };

for (const [index, item] of manifest.objects.entries()) {
  const key = `supabase/${item.bucket_id}/${item.name}`;
  process.stdout.write(`[${index+1}/${manifest.objects.length}] ${key}\n`);
  try {
    try {
      await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
      result.skipped.push({ ...item, key, reason: "already_exists" });
      continue;
    } catch (error) {
      const status = error?.$metadata?.httpStatusCode;
      const code = error?.name || error?.Code || "";
      if (status !== 404 && code !== "NotFound" && code !== "NoSuchKey") throw error;
    }

    const sourceUrl = `${SUPABASE_URL}/storage/v1/object/public/${item.bucket_id}/${encodePath(item.name)}`;
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`source_http_${response.status}: ${body.slice(0,200)}`);
    }
    const body = Buffer.from(await response.arrayBuffer());
    await client.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: item.mimetype || response.headers.get("content-type") || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: {
        source_bucket: item.bucket_id,
        source_name: item.name,
        source_etag: String(item.etag || "").replaceAll('"',"")
      }
    }));
    const verified = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
    if (Number(verified.ContentLength) !== body.length) {
      throw new Error("r2_size_verification_failed");
    }

    const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/,"");
    result.copied.push({
      ...item,
      key,
      old_url: sourceUrl,
      new_url: publicBase + "/" + encodePath(key)
    });
  } catch (error) {
    result.failed.push({ ...item, key, error: String(error?.message || error) });
  }

  if ((index + 1) % 25 === 0) {
    await fs.writeFile("data/r2-migration-result.json", JSON.stringify(result, null, 2));
  }
}

result.finished_at = new Date().toISOString();
await fs.writeFile("data/r2-migration-result.json", JSON.stringify(result, null, 2));
const failureCategories = {};
for (const item of result.failed) {
  const error = String(item.error || "");
  const http = error.match(/source_http_(\d+)/);
  const category = http ? "source_http_" + http[1]
    : /AccessDenied|Forbidden/i.test(error) ? "r2_access_denied"
    : /SignatureDoesNotMatch|InvalidAccessKeyId/i.test(error) ? "r2_bad_credentials"
    : error.includes("r2_size_verification_failed") ? "r2_size_verification_failed"
    : "other";
  failureCategories[category] = (failureCategories[category] || 0) + 1;
}
console.log(JSON.stringify({
  copied: result.copied.length,
  skipped: result.skipped.length,
  failed: result.failed.length,
  failure_categories: failureCategories
}, null, 2));
if (result.failed.length) {
  console.error("R2 migration incomplete; inspect the uploaded artifact before retrying.");
  process.exitCode = 1;
}
