import { ReactNode, useEffect } from "react";

const Page = ({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: ReactNode;
}) => {
    useEffect(() => {
        document.title = `${title} - Boutique Admin`;
    }, [title]);

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    );
}

export default Page;