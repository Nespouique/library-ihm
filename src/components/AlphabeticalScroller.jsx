import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const getAlphabetGroup = (value) => {
    const firstChar = String(value || '')
        .trim()
        .charAt(0)
        .toUpperCase();
    return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
};

const AlphabeticalScroller = ({
    onLetterClick,
    items,
    getKey = (item) => item,
    getAvailableKey = getKey,
    ariaLabel = 'Navigation alphabétique',
}) => {
    const lastPointerLetterRef = useRef(null);
    const suppressNextClickRef = useRef(false);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const allButtons = ['#', ...alphabet];
    const hasAvailabilityFilter = Array.isArray(items);
    const availableLetters = new Set(
        hasAvailabilityFilter
            ? items.map((item) => getAlphabetGroup(getAvailableKey(item)))
            : allButtons
    );

    const activateLetterFromPoint = (event) => {
        if (event.pointerType === 'mouse') return;

        const target = document.elementFromPoint(event.clientX, event.clientY);
        const button = target?.closest?.('[data-alphabet-letter]');

        if (!button || button.dataset.available !== 'true') return;

        const letter = button.dataset.alphabetLetter;
        if (!letter || lastPointerLetterRef.current === letter) return;

        lastPointerLetterRef.current = letter;
        suppressNextClickRef.current = true;
        onLetterClick(letter);
        event.preventDefault();
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === 'mouse') return;

        lastPointerLetterRef.current = null;
        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (event.pointerType === 'mouse') return;
        if (event.buttons !== 1) return;

        activateLetterFromPoint(event);
    };

    const handlePointerEnd = () => {
        lastPointerLetterRef.current = null;
        window.setTimeout(() => {
            suppressNextClickRef.current = false;
        }, 350);
    };

    return (
        <nav
            className="alphabet-scroller-horizontal"
            aria-label={ariaLabel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
        >
            <div className="alphabet-scroller-track">
                {allButtons.map((char) => {
                    const isAvailable = availableLetters.has(char);

                    return (
                        <motion.button
                            key={char}
                            type="button"
                            className="alphabet-letter-btn"
                            data-alphabet-letter={char}
                            data-available={isAvailable}
                            onClick={() => {
                                if (suppressNextClickRef.current) {
                                    suppressNextClickRef.current = false;
                                    return;
                                }

                                if (isAvailable) onLetterClick(char);
                            }}
                            disabled={!isAvailable}
                            aria-disabled={!isAvailable}
                            aria-label={
                                char === '#'
                                    ? 'Aller aux éléments commençant par un chiffre ou un caractère spécial'
                                    : `Aller à la lettre ${char}`
                            }
                            whileHover={
                                isAvailable
                                    ? {
                                          scale: 1.08,
                                          transition: { duration: 0.1 },
                                      }
                                    : undefined
                            }
                            whileTap={isAvailable ? { scale: 0.95 } : undefined}
                        >
                            {char}
                        </motion.button>
                    );
                })}
            </div>
        </nav>
    );
};

export default AlphabeticalScroller;
