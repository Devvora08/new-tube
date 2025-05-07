// import { db } from "@/db";
// import { videos } from "@/db/schema";
// import { mux } from "@/lib/mux";
// import { VideoAssetCreatedWebhookEvent, VideoAssetDeletedWebhookEvent, VideoAssetErroredWebhookEvent, VideoAssetReadyWebhookEvent, VideoAssetTrackReadyWebhookEvent } from "@mux/mux-node/resources/webhooks.mjs";
// import { eq } from "drizzle-orm";
// import { headers } from "next/headers";
// import { UTApi } from "uploadthing/server";

// const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;

// type WebhookEvent = 
//     | VideoAssetCreatedWebhookEvent
//     | VideoAssetReadyWebhookEvent 
//     | VideoAssetErroredWebhookEvent
//     | VideoAssetTrackReadyWebhookEvent
//     | VideoAssetDeletedWebhookEvent

// export const POST = async (request: Request) => {
//     if(!SIGNING_SECRET) {
//         throw new Error("Mux signing secret not set");
//     }

//     const headersPayload = await headers();
//     const muxSignature = headersPayload.get("mux-signature");

//     if(!muxSignature) {
//         return new Response("No signature found", {status: 401});
//     }

//     const payload = await request.json();
//     const body = JSON.stringify(payload);

//     mux.webhooks.verifySignature(
//         body,
//         {
//             "mux-signature": muxSignature,
//         },
//         SIGNING_SECRET
//     );

//     switch(payload.type as WebhookEvent["type"]) {
//         case "video.asset.created": {
//             const data = payload.data as VideoAssetCreatedWebhookEvent['data'];

//             if(!data.upload_id) return new Response("No upload ID found", {status:400});

//             console.log("Creating video : ", {uploadId: data.upload_id})

//             await db
//                 .update(videos)
//                 .set({
//                     muxAssetId: data.id,
//                     muxStatus: data.status,
//                 })
//                 .where(eq(videos.muxUploadId, data.upload_id));
//             break;
//         }

//         case "video.asset.ready": {
//             const data = payload.data as VideoAssetReadyWebhookEvent['data'];
//             const playbackId = data.playback_ids?.[0].id;

//             if(!data.upload_id) return new Response("missing upload id", {status:400})

//             if(!playbackId) {
//                 return new Response("Missing playback id", {status:400});
//             }

//             const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
//             const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
//             const duration = data.duration ? Math.round(data.duration * 1000) : 0;


//             const utapi = new UTApi();
//             const [uploadedThumbnail, uploadedPreview] = await utapi.uploadFilesFromUrl([
//                 tempThumbnailUrl,
//                 tempPreviewUrl
//             ]);

//             if(!uploadedThumbnail.data || !uploadedPreview.data) return new Response("Failed to upload thumbnail or preview", {status: 500});

//             const {key: thumbnailKey, url: thumbnailUrl} = uploadedThumbnail.data;
//             const {key: previewKey, url: previewUrl} = uploadedPreview.data;

//             await db
//                 .update(videos)
//                 .set({
//                     muxStatus: data.status,
//                     muxPlaybackId: playbackId,
//                     muxAssetId: data.id,
//                     thumbnailUrl,
//                     thumbnailKey,
//                     previewUrl,
//                     previewKey,
//                     duration,
//                 })
//                 .where(eq(videos.muxUploadId, data.upload_id));

//                 break;
//         }

//         case "video.asset.errored": {
//             const data = payload.data as VideoAssetErroredWebhookEvent["data"];

//             if(!data.upload_id) return new Response("Missing upload id", {status: 400});

//             await db
//                 .update(videos)
//                 .set({
//                     muxStatus: data.status,
//                 })
//                 .where(eq(videos.muxUploadId, data.upload_id));

//             break;
//         }

//         case "video.asset.deleted": {
//             const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

//             if(!data.upload_id) return new Response("Missing upload id", {status: 400});

//             console.log("Deleting video : ", {uploadId: data.upload_id})

//             await db
//                 .delete(videos)
//                 .where(eq(videos.muxUploadId, data.upload_id))

//             break;
//         }

//         case "video.asset.track.ready" : {
//             const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
//                 asset_id : string;
//             }

//             console.log("Track ready")

//             const assetId = data.asset_id;
//             const trackId = data.id;
//             const status = data.status;

//             if(!assetId) return new Response("Missing asset id", {status: 400});

//             await db
//                 .update(videos)
//                 .set({
//                     muxTrackId: trackId,
//                     muxTrackStatus: status
//                 })
//                 .where(eq(videos.muxAssetId, assetId));

//             break;
//         }
//     }

//     return new Response("Webhook recieved", {status: 200})
// }

import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetDeletedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
} from "@mux/mux-node/resources/webhooks.mjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { UTApi } from "uploadthing/server";

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!;

type WebhookEvent =
  | VideoAssetCreatedWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent;

export const POST = async (request: Request) => {
  if (!SIGNING_SECRET) {
    throw new Error("Mux signing secret not set");
  }

  const headersPayload = headers();
  const muxSignature = (await headersPayload).get("mux-signature");

  if (!muxSignature) {
    return new Response("No signature found", { status: 401 });
  }

  // Step 1: Read the raw body
  const rawBody = await request.text();

  // Step 2: Verify signature before trusting the body
  try {
    mux.webhooks.verifySignature(
      rawBody,
      { "mux-signature": muxSignature },
      SIGNING_SECRET
    );
  } catch (err) {
    console.error("Invalid Mux webhook signature", err);
    return new Response("Invalid signature", { status: 401 });
  }

  // Step 3: Safely parse JSON
  let payload: WebhookEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("Failed to parse webhook JSON", err);
    return new Response("Malformed JSON", { status: 400 });
  }

  // Step 4: Handle the webhook event
  switch (payload.type as WebhookEvent["type"]) {
    case "video.asset.created": {
      const data = payload.data as VideoAssetCreatedWebhookEvent["data"];

      if (!data.upload_id) return new Response("No upload ID found", { status: 400 });

      console.log("Creating video : ", { uploadId: data.upload_id });

      await db
        .update(videos)
        .set({
          muxAssetId: data.id,
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));
      break;
    }

    case "video.asset.ready": {
      const data = payload.data as VideoAssetReadyWebhookEvent["data"];
      const playbackId = data.playback_ids?.[0].id;

      if (!data.upload_id) return new Response("Missing upload id", { status: 400 });

      if (!playbackId) {
        return new Response("Missing playback id", { status: 400 });
      }

      const tempThumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`;
      const tempPreviewUrl = `https://image.mux.com/${playbackId}/animated.gif`;
      const duration = data.duration ? Math.round(data.duration * 1000) : 0;

      const utapi = new UTApi();
      const [uploadedThumbnail, uploadedPreview] = await utapi.uploadFilesFromUrl([
        tempThumbnailUrl,
        tempPreviewUrl,
      ]);

      if (!uploadedThumbnail.data || !uploadedPreview.data)
        return new Response("Failed to upload thumbnail or preview", { status: 500 });

      const { key: thumbnailKey, url: thumbnailUrl } = uploadedThumbnail.data;
      const { key: previewKey, url: previewUrl } = uploadedPreview.data;

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
          muxPlaybackId: playbackId,
          muxAssetId: data.id,
          thumbnailUrl,
          thumbnailKey,
          previewUrl,
          previewKey,
          duration,
        })
        .where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case "video.asset.errored": {
      const data = payload.data as VideoAssetErroredWebhookEvent["data"];

      if (!data.upload_id) return new Response("Missing upload id", { status: 400 });

      await db
        .update(videos)
        .set({
          muxStatus: data.status,
        })
        .where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case "video.asset.deleted": {
      const data = payload.data as VideoAssetDeletedWebhookEvent["data"];

      if (!data.upload_id) return new Response("Missing upload id", { status: 400 });

      console.log("Deleting video : ", { uploadId: data.upload_id });

      await db.delete(videos).where(eq(videos.muxUploadId, data.upload_id));

      break;
    }

    case "video.asset.track.ready": {
      const data = payload.data as VideoAssetTrackReadyWebhookEvent["data"] & {
        asset_id: string;
      };

      console.log("Track ready");

      const assetId = data.asset_id;
      const trackId = data.id;
      const status = data.status;

      if (!assetId) return new Response("Missing asset id", { status: 400 });

      await db
        .update(videos)
        .set({
          muxTrackId: trackId,
          muxTrackStatus: status,
        })
        .where(eq(videos.muxAssetId, assetId));

      break;
    }
  }

  return new Response("Webhook received", { status: 200 });
};
