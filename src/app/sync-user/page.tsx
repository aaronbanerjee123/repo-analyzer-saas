import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { db } from '~/server/db';

export default async function SyncUser() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not found');
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const emailAddress = user.emailAddresses[0]?.emailAddress;
    if (!emailAddress) {
        return notFound();
    }

    await db.user.upsert({
        where: { emailAddress },
        update: {
            imageUrl: user.imageUrl,
            firstName: user.firstName,
            lastName: user.lastName,
        },
        create: {
            id: userId,
            emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username ?? emailAddress,
            imageUrl: user.imageUrl,
        },
    });

    return redirect('/dashboard');
}