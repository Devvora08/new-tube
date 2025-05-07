import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubscriptionButtonProps {
    onClick: ButtonProps["onClick"];
    disabled: boolean;
    isSubscribed: boolean;
    className?: string;
    size?: ButtonProps["size"]
}

export const SubscriptionButton = ({onClick, disabled, size, className, isSubscribed}: SubscriptionButtonProps) => {
    return (
        <Button
            size={size}
            disabled={disabled}
            onClick={onClick}
            className={cn("rounded-full", className)}
            variant={isSubscribed ? "secondary": "default"}
        >
            {isSubscribed ? "Unsuscribe" : "Suscribe"}
        </Button>
    )
}