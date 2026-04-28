'use client';

import styles from './layout.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.layout}>
            {/* Animated gradient background */}
            <div className={styles.bg} />

            {/* Floating orbs */}
            <div className={`${styles.orb} ${styles.orb1} ${styles.orbVisible}`} />
            <div className={`${styles.orb} ${styles.orb2} ${styles.orbVisible}`} />
            <div className={`${styles.orb} ${styles.orb3} ${styles.orbVisible}`} />

            {/* Grid pattern overlay */}
            <div className={styles.gridOverlay} />

            {/* Content */}
            <div className={`${styles.content} ${styles.contentVisible}`}>
                {children}
            </div>
        </div>
    );
}
