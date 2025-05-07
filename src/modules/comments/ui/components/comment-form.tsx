import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { commentInsertSchema } from "@/db/schema";
import { trpc } from "@/trpc/client";
import { useClerk, useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";


interface CommentFormProps {
    videoId: string;
    parentId?: string
    onSuccess?: () => void;
    onCancel?: () => void;
    variant?: "comment" | "reply"
}

export const CommentForm = ({ videoId, onSuccess,parentId,variant = "comment", onCancel }: CommentFormProps) => {

    const utils = trpc.useUtils();
    const clerk = useClerk()
    const create = trpc.comments.create.useMutation({
        onSuccess: () => {
            utils.comments.getMany.invalidate({ videoId });
            utils.comments.getMany.invalidate({videoId, parentId})
            form.reset();
            toast.success("Comment Posted !");
            onSuccess?.();
        },
        onError: (error) => {

            toast.error("Failed to post comment...");

            if (error.data?.code === "UNAUTHORIZED") {
                clerk.openSignIn()
            }
        }
    })

    const commentInsertFormSchema = commentInsertSchema.omit({ userId: true });

    const form = useForm<z.infer<typeof commentInsertFormSchema>>({
        resolver: zodResolver(commentInsertFormSchema),
        defaultValues: {
            parentId: parentId,
            videoId,
            value: ""
        }
    });

    const handleSubmit = (values: z.infer<typeof commentInsertFormSchema>) => {
        create.mutate(values)
    }

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    }

    const { user } = useUser();

    return (
        <Form {...form}>
            <form className="flex gap-4 group" onSubmit={form.handleSubmit(handleSubmit)}>
                <UserAvatar size={'lg'} name={user?.username || "User"} imageUrl={user?.imageUrl || "/user-placeholder.svg"} />
                <div className="flex-1">
                    <FormField
                        name="value"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder={
                                            variant === "reply" ? "Reply to this comment" : "Add a comment" 
                                        }
                                        className="resize-none bg-transparent overflow-hidden min-h-0"
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />


                    <div className="justify-end gap-2 mt-2 flex">
                        {onCancel && (
                            <Button variant={'ghost'} type="button" onClick={handleCancel}>Cancel</Button>
                        )}
                        <Button disabled={create.isPending} type="submit" size={'sm'}>
                            {variant === "reply" ? "Reply" : "Comment"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>

    )
}