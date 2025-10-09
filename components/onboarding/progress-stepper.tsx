'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
    id: string;
    label: string;
    description?: string;
}

interface ProgressStepperProps {
    steps: Step[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    className?: string;
}

export function ProgressStepper({
    steps,
    currentStep,
    onStepClick,
    className = '',
}: ProgressStepperProps) {
    const canNavigate = (stepIndex: number): boolean => {
        // Allow navigation to current step or any previous step
        return stepIndex <= currentStep;
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Desktop: Horizontal Stepper */}
            <div className="hidden md:block">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isClickable = canNavigate(index) && onStepClick;

                        return (
                            <React.Fragment key={step.id}>
                                {/* Step Circle */}
                                <div className="flex flex-col items-center flex-1">
                                    <button
                                        type="button"
                                        onClick={() => isClickable && onStepClick(index)}
                                        disabled={!isClickable}
                                        className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2
                      transition-all duration-200
                      ${isCompleted
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : isCurrent
                                                    ? 'bg-white dark:bg-gray-950 border-purple-600 text-purple-600'
                                                    : 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-400'
                                            }
                      ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    `}
                                        aria-label={`Step ${index + 1}: ${step.label}`}
                                        aria-current={isCurrent ? 'step' : undefined}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <span className="text-sm font-semibold">{index + 1}</span>
                                        )}
                                    </button>

                                    {/* Step Label */}
                                    <div className="mt-2 text-center">
                                        <p
                                            className={`text-sm font-medium ${isCompleted || isCurrent
                                                    ? 'text-gray-900 dark:text-gray-100'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                }`}
                                        >
                                            {step.label}
                                        </p>
                                        {step.description && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {step.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Connector Line */}
                                {index < steps.length - 1 && (
                                    <div
                                        className={`
                      h-0.5 flex-1 mx-4 mb-8
                      transition-colors duration-300
                      ${index < currentStep
                                                ? 'bg-purple-600'
                                                : 'bg-gray-300 dark:bg-gray-700'
                                            }
                    `}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Mobile: Vertical Stepper */}
            <div className="md:hidden">
                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep;
                        const isCurrent = index === currentStep;
                        const isClickable = canNavigate(index) && onStepClick;

                        return (
                            <div key={step.id} className="flex items-start gap-3">
                                {/* Step Circle with Vertical Line */}
                                <div className="flex flex-col items-center">
                                    <button
                                        type="button"
                                        onClick={() => isClickable && onStepClick(index)}
                                        disabled={!isClickable}
                                        className={`
                      flex items-center justify-center w-8 h-8 rounded-full border-2
                      transition-all duration-200 flex-shrink-0
                      ${isCompleted
                                                ? 'bg-purple-600 border-purple-600 text-white'
                                                : isCurrent
                                                    ? 'bg-white dark:bg-gray-950 border-purple-600 text-purple-600'
                                                    : 'bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 text-gray-400'
                                            }
                      ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
                    `}
                                        aria-label={`Step ${index + 1}: ${step.label}`}
                                        aria-current={isCurrent ? 'step' : undefined}
                                    >
                                        {isCompleted ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <span className="text-xs font-semibold">{index + 1}</span>
                                        )}
                                    </button>

                                    {/* Vertical Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`
                        w-0.5 h-12 mt-1
                        transition-colors duration-300
                        ${index < currentStep
                                                    ? 'bg-purple-600'
                                                    : 'bg-gray-300 dark:bg-gray-700'
                                                }
                      `}
                                        />
                                    )}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 pt-1">
                                    <p
                                        className={`text-sm font-medium ${isCompleted || isCurrent
                                                ? 'text-gray-900 dark:text-gray-100'
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {step.label}
                                    </p>
                                    {step.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
                <div className="relative">
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-600 transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` } as React.CSSProperties}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
                        Step {currentStep + 1} of {steps.length}
                    </p>
                </div>
            </div>
        </div>
    );
}
