const FullPageMessage = ({ title }: { title: string }) => {
    return (
        <div className="grid min-h-screen place-items-center bg-background p-6">
            <div className="text-sm text-muted-foreground">{title}</div>
        </div>
    );
}

export default FullPageMessage;