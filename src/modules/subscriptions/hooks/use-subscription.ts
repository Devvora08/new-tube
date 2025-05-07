import { trpc } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { toast } from "sonner";

interface UseSubscriptionProps {
    userId: string;
    isSubscribed: boolean;
    fromVideoId?: string;
}

export const UseSubscription = ({userId, isSubscribed, fromVideoId} : UseSubscriptionProps) => {
    const clerk = useClerk();
    const utils = trpc.useUtils();
    const subscribe = trpc.subscriptions.create.useMutation({
        onSuccess: () => {
            toast.success("Suscribed");

            utils.videos.getManySubscribed.invalidate();
            utils.users.getOne.invalidate({id: userId});
            utils.subscriptions.getMany.invalidate();

            if(fromVideoId) {
                utils.videos.getOne.invalidate({id: fromVideoId});
            }
        },
        onError: (error) => {
            toast.error("Something went wrong, try again...");

            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const unsuscribe = trpc.subscriptions.remove.useMutation({
        onSuccess: () => {
            toast.success("Unsuscribed");
            
            utils.videos.getManySubscribed.invalidate();
            utils.users.getOne.invalidate({id: userId})
            utils.subscriptions.getMany.invalidate();

            if(fromVideoId) {
                utils.videos.getOne.invalidate({id: fromVideoId});
            }
        },
        onError: (error) => {
            toast.error("Something went wrong, try again...");

            if(error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn();
            }
        }
    });

    const isPending = subscribe.isPending || unsuscribe.isPending;

    const onClick = () => {
        if(isSubscribed) {
            unsuscribe.mutate({userId});
        } else {
            subscribe.mutate({userId})
        }
    }

    return {
        isPending, 
        onClick
    }
}