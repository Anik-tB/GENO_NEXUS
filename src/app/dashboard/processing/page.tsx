"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const STEPS = [
  { id: 1, name: "Uploading sequence data", duration: 1000 },
  { id: 2, name: "Cleaning and normalizing reads", duration: 2000 },
  { id: 3, name: "Analyzing mutation variants", duration: 3000 },
  { id: 4, name: "Predicting pathogenic risk scores", duration: 2500 },
];

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let currentStepIndex = 0;
    
    const runNextStep = () => {
      if (currentStepIndex >= STEPS.length) {
        setIsComplete(true);
        return;
      }
      
      setCurrentStep(currentStepIndex);
      const step = STEPS[currentStepIndex];
      
      // Animate progress bar for the current step
      let start = null;
      const animateProgress = (timestamp: number) => {
        if (!start) start = timestamp;
        const passed = timestamp - start;
        const percentage = Math.min((passed / step.duration) * 100, 100);
        
        // Map 0-100 of current step to global progress 0-100
        const previousStepsProgress = (currentStepIndex / STEPS.length) * 100;
        const currentStepContribution = (percentage / 100) * (100 / STEPS.length);
        setProgress(previousStepsProgress + currentStepContribution);
        
        if (passed < step.duration) {
          requestAnimationFrame(animateProgress);
        } else {
          currentStepIndex++;
          runNextStep();
        }
      };
      requestAnimationFrame(animateProgress);
    };

    runNextStep();
  }, []);

  const timeRemaining = isComplete ? "0s" : `${Math.ceil(((100 - progress) / 100) * 8.5)}s`;

  return (
    <div className={styles.container}>
      {isComplete ? (
        <div className={styles.completeState}>
          <div className={styles.successGlow} />
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.title}>Processing Complete</h1>
          <p className={styles.subtitle}>AI prediction models have finished their analysis.</p>
          <div className={styles.actions}>
            <Link href="/dashboard/analysis" className={styles.primaryButton}>
              View Mutation Analysis
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.processingState}>
          <div className={styles.loaderRing}>
            <div className={styles.loaderCore} />
          </div>
          <h1 className={styles.title}>Analyzing Genome</h1>
          <p className={styles.subtitle}>Estimated time remaining: {timeRemaining}</p>

          <div className={styles.progressContainer}>
            <div className={styles.progressTrack}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${progress}%` }} 
              />
              <div className={styles.progressGlow} style={{ left: `${progress}%` }} />
            </div>
            <div className={styles.progressText}>{Math.floor(progress)}% Complete</div>
          </div>

          <ul className={styles.stepList}>
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isDone = index < currentStep || isComplete;
              return (
                <li key={step.id} className={`${styles.stepItem} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}>
                  <div className={styles.stepIcon}>
                    {isDone ? '✓' : isActive ? <span className={styles.pulsingDot} /> : null}
                  </div>
                  <span className={styles.stepName}>{step.name}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
