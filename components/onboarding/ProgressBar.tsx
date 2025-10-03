interface ProgressBarProps {
    currentStep: number
    totalSteps: number
    className?: string
}

export function ProgressBar({ currentStep, totalSteps, className = '' }: ProgressBarProps) {
    const progress = (currentStep / totalSteps) * 100

    return (
        <div className={`w-full ${className}`}>
            <div className="flex justify-between mb-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-2 rounded-full mx-1 ${i < currentStep
                                ? 'bg-primary'
                                : i === currentStep - 1
                                    ? 'bg-primary/50'
                                    : 'bg-muted'
                            }`}
                    />
                ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
            </div>
        </div>
    )
}