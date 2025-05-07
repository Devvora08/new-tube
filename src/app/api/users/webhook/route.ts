import {Webhook} from 'svix';
import {headers} from 'next/headers'
import {WebhookEvent} from '@clerk/nextjs/server'
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    const SIGNING_SECRET = process.env.CLERK_SIGNING_SECRET;

    if(!SIGNING_SECRET) {
        throw new Error('Error: please add clerk signing secret from clerk dashboard');
    }

    const wh = new Webhook(SIGNING_SECRET);

    const headerPayload = await headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    if(!svix_id || !svix_signature || !svix_signature){
        return new Response('Error : missing svix headers', {status: 400});
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            'svix-id': svix_id!,
            'svix-timestamp': svix_timestamp!,
            'svix-signature': svix_signature!,
          }) as WebhookEvent;

        //console.log('Webhook event received:', evt);
    } catch (error) {
        console.error('Error: could not verify webhook:', error)
        return new Response('Error: verification error : ', {status: 400})
    }

    
    const eventType = evt.type;
    // console.log(`recieved webhook with id ${data.id} and event type of ${eventType}`);
    // console.log('webhook payload: ',body);

    if(eventType === 'user.created') {
        const {data} = evt;
        await db.insert(users).values({
            clerkId: data.id,
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url,
        })
    }

    if(eventType === 'user.deleted'){
        const {data} = evt;
        if(!data.id) return new Response("missing user id", {status:400})
        
        await db.delete(users).where(eq(users.clerkId, data.id))
    }

    if(eventType === 'user.updated') {
        const {data} = evt;

        await db.update(users).set({
            name: `${data.first_name} ${data.last_name}`,
            imageUrl: data.image_url, 
        }).where(eq(users.clerkId, data.id));
    }

    return new Response('Webhook recieved',{status:200})
}